import { getWritable } from "workflow";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { s3, UPLOADS_BUCKET } from "@repo/storage";
import { prisma } from "@repo/db";
import { parseParsePost } from "@repo/hermes";

export type ProgressEvent = {
	step:
		| "uploading"
		| "hashing"
		| "dedup"
		| "parsing"
		| "extracting"
		| "done";
	status: "start" | "done";
	data?: Record<string, unknown>;
};

export async function writeProgress(
	step: ProgressEvent["step"],
	status: ProgressEvent["status"],
	data?: Record<string, unknown>,
) {
	"use step";
	const writer = getWritable<ProgressEvent>().getWriter();
	await writer.write({ step, status, data });
	writer.releaseLock();
}

export async function computeContentHash(s3Key: string): Promise<string> {
	"use step";
	const resp = await s3.send(
		new GetObjectCommand({ Bucket: UPLOADS_BUCKET, Key: s3Key }),
	);
	const bytes = await resp.Body!.transformToByteArray();
	return createHash("sha256").update(bytes).digest("hex");
}

export async function checkDuplicate(
	sectionId: string,
	contentHash: string,
): Promise<{
	isDuplicate: boolean;
	existingDoc: { parsedS3Key: string | null } | null;
}> {
	"use step";
	const existing = await prisma.document.findFirst({
		where: { sectionId, contentHash, status: "completed" },
		select: { parsedS3Key: true },
	});
	return { isDuplicate: !!existing, existingDoc: existing };
}

export async function createDocumentRecord(data: {
	sectionId: string;
	filename: string;
	s3Key: string;
	contentHash: string;
	uploadedById: string;
	status: string;
	parsedS3Key?: string;
}): Promise<string> {
	"use step";
	const doc = await prisma.document.create({ data });
	return doc.id;
}

export async function triggerHermesParse(
	s3Key: string,
	webhookUrl: string,
	webhookToken: string,
) {
	"use step";
	await parseParsePost({
		body: {
			s3_key: s3Key,
			webhook_url: webhookUrl,
			webhook_token: webhookToken,
		},
	});
}

export async function handleParseCallback(
	docId: string,
	request: Request,
): Promise<{ parsedS3Key: string; status: string }> {
	"use step";
	const body = await request.json();
	const newStatus = body.status === "completed" ? "completed" : "failed";
	await prisma.document.update({
		where: { id: docId },
		data: {
			status: newStatus,
			parsedS3Key: body.output_s3_key,
			error: body.error,
		},
	});
	return { parsedS3Key: body.output_s3_key ?? "", status: newStatus };
}

export async function closeStream() {
	"use step";
	const writer = getWritable<ProgressEvent>().getWriter();
	await writer.close();
}
