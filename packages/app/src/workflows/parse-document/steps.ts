import { getWritable } from "workflow";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { s3, UPLOADS_BUCKET } from "@repo/storage";
import { prisma } from "@repo/db";
import type { Prisma } from "@repo/db";
import { parseParsePost } from "@repo/hermes";
import type { SyllabusExtraction } from "./extraction-schema";

export type ProgressEvent = {
	step:
		| "uploading"
		| "hashing"
		| "dedup"
		| "parsing"
		| "extracting"
		| "reviewing"
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

export interface ExistingDocInfo {
	id: string;
	status: string;
	parsedS3Key: string | null;
	sectionId: string | null;
}

export async function checkDuplicate(
	contentHash: string,
	sectionId?: string,
	uploadedById?: string,
): Promise<{
	existingDoc: ExistingDocInfo | null;
	salvageableParsedKey: string | null;
	salvageableExtraction: SyllabusExtraction | null;
}> {
	"use step";
	// First: check if ANY confirmed doc exists with this hash (global dedup)
	const confirmed = await prisma.document.findFirst({
		where: { contentHash, status: "confirmed" },
		select: { id: true, status: true, parsedS3Key: true, sectionId: true },
	});
	if (confirmed) {
		return { existingDoc: confirmed, salvageableParsedKey: null, salvageableExtraction: null };
	}

	// Check globally for any doc with this hash that already has parsed output
	const withParsed = await prisma.document.findFirst({
		where: { contentHash, parsedS3Key: { not: null } },
		select: { parsedS3Key: true, extractedData: true },
		orderBy: { uploadedAt: "desc" },
	});

	// Check for in-progress/stale docs scoped to this user or section
	const where: Prisma.DocumentWhereInput = { contentHash };
	if (sectionId) {
		where.sectionId = sectionId;
	} else if (uploadedById) {
		where.uploadedById = uploadedById;
	}
	const existing = await prisma.document.findFirst({
		where,
		select: {
			id: true,
			status: true,
			parsedS3Key: true,
			sectionId: true,
		},
		orderBy: { uploadedAt: "desc" },
	});
	return {
		existingDoc: existing,
		salvageableParsedKey: withParsed?.parsedS3Key ?? null,
		salvageableExtraction: (withParsed?.extractedData as unknown as SyllabusExtraction) ?? null,
	};
}

export async function deleteDocument(docId: string) {
	"use step";
	await prisma.document.delete({ where: { id: docId } });
}

export async function createDocumentRecord(data: {
	sectionId?: string;
	filename: string;
	s3Key: string;
	contentHash: string;
	uploadedById: string;
	status: string;
	parsedS3Key?: string;
}): Promise<string> {
	"use step";
	const doc = await prisma.document.create({
		data: {
			...data,
			sectionId: data.sectionId ?? null,
		},
	});
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
): Promise<{ parsedS3Key: string | null; status: string; error?: string }> {
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
	return {
		parsedS3Key: body.output_s3_key ?? null,
		status: newStatus,
		error: body.error ?? undefined,
	};
}

export async function saveExtraction(
	docId: string,
	extraction: SyllabusExtraction,
) {
	"use step";
	await prisma.document.update({
		where: { id: docId },
		data: {
			status: "awaiting_review",
			extractedData: extraction as unknown as Prisma.JsonObject,
		},
	});
}

export async function commitExtractedData(
	docId: string,
	extraction: {
		courseInfo: {
			schoolName: string;
			schoolShortName: string;
			courseCode: string;
			courseName: string;
			section: string;
			term: string;
			instructor: string;
		};
		deadlines: Array<{
			title: string;
			dueDate: string;
			type: string;
			weight: number;
		}>;
		gradeWeights: Array<{
			label: string;
			type: string;
			weight: number;
		}>;
	},
	uploadedById: string,
) {
	"use step";
	const { courseInfo, deadlines, gradeWeights } = extraction;

	await prisma.$transaction(async (tx) => {
		// Upsert school
		const school = await tx.school.upsert({
			where: { shortName: courseInfo.schoolShortName },
			create: {
				name: courseInfo.schoolName,
				shortName: courseInfo.schoolShortName,
			},
			update: {},
		});

		// Upsert course
		const course = await tx.course.upsert({
			where: {
				schoolId_code: {
					schoolId: school.id,
					code: courseInfo.courseCode,
				},
			},
			create: {
				schoolId: school.id,
				code: courseInfo.courseCode,
				name: courseInfo.courseName,
			},
			update: {},
		});

		// Upsert section
		const section = await tx.courseSection.upsert({
			where: {
				courseId_term_section: {
					courseId: course.id,
					term: courseInfo.term,
					section: courseInfo.section,
				},
			},
			create: {
				courseId: course.id,
				term: courseInfo.term,
				section: courseInfo.section,
				instructor: courseInfo.instructor,
			},
			update: {},
		});

		// Create deadlines (skip entries with unparseable dates)
		const validDeadlines = deadlines.filter(
			(d) => !Number.isNaN(new Date(d.dueDate).getTime()),
		);
		if (validDeadlines.length > 0) {
			await tx.deadline.createMany({
				data: validDeadlines.map((d) => ({
					sectionId: section.id,
					title: d.title,
					dueDate: new Date(d.dueDate),
					type: d.type,
					weight: d.weight,
				})),
			});
		}

		// Create grade weights
		if (gradeWeights.length > 0) {
			await tx.gradeWeight.createMany({
				data: gradeWeights.map((g) => ({
					sectionId: section.id,
					label: g.label,
					type: g.type,
					weight: g.weight,
				})),
			});
		}

		// Upsert enrollment
		await tx.enrollment.upsert({
			where: {
				userId_sectionId: {
					userId: uploadedById,
					sectionId: section.id,
				},
			},
			create: { userId: uploadedById, sectionId: section.id },
			update: {},
		});

		// Link document to section and mark confirmed
		await tx.document.update({
			where: { id: docId },
			data: {
				sectionId: section.id,
				status: "confirmed",
				parsedDeadlineCount: deadlines.length,
			},
		});
	});
}

export async function enrollUserInDocSection(
	docId: string,
	userId: string,
) {
	"use step";
	const doc = await prisma.document.findUniqueOrThrow({
		where: { id: docId },
		select: { sectionId: true },
	});
	if (!doc.sectionId) return;
	await prisma.enrollment.upsert({
		where: {
			userId_sectionId: { userId, sectionId: doc.sectionId },
		},
		create: { userId, sectionId: doc.sectionId },
		update: {},
	});
}

export async function cancelDocument(docId: string) {
	"use step";
	await prisma.document.update({
		where: { id: docId },
		data: { status: "cancelled" },
	});
}

export async function failDocument(docId: string, error: string) {
	"use step";
	await prisma.document.update({
		where: { id: docId },
		data: { status: "failed", error },
	});
}

export async function closeStream() {
	"use step";
	const writer = getWritable<ProgressEvent>().getWriter();
	await writer.close();
}
