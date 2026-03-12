import { randomUUID } from "node:crypto";
import { ORPCError, os } from "@orpc/server";
import { createPresignedUpload } from "@repo/storage";
import { auth } from "@repo/auth/server";
import { type } from "arktype";
import { start, getRun } from "workflow/api";
import { headers } from "next/headers";
import {
	parseDocumentWorkflow,
	type ProgressEvent,
} from "@/workflows/parse-document";

const base = os.use(async ({ next }) => {
	const session = await auth.api.getSession({ headers: await headers() });
	return next({ context: { session } });
});

const authed = base.use(async ({ context, next }) => {
	if (!context.session) {
		throw new ORPCError("UNAUTHORIZED");
	}
	return next({ context: { userId: context.session.user.id } });
});

const presignedUpload = base
	.input(
		type({
			filename: "string",
			contentType: "string",
			"maxSize?": "number",
		}),
	)
	.handler(async ({ input }) => {
		const ext = input.filename.split(".").pop() ?? "bin";
		const key = `${randomUUID()}.${ext}`;

		const result = await createPresignedUpload({
			key,
			contentType: input.contentType,
			maxSize: input.maxSize,
		});

		return result;
	});

const startDocument = authed
	.input(
		type({
			s3Key: "string",
			sectionId: "string",
			filename: "string",
		}),
	)
	.handler(async ({ input, context }) => {
		const run = await start(parseDocumentWorkflow, [
			{ ...input, uploadedById: context.userId },
		]);

		return { runId: run.runId };
	});

const streamDocument = base
	.input(
		type({
			runId: "string",
		}),
	)
	.handler(async function* ({ input }) {
		const run = getRun(input.runId);
		const reader = run.getReadable<ProgressEvent>().getReader();

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				yield value;
			}
		} finally {
			reader.releaseLock();
		}
	});

export const router = {
	uploads: {
		presign: presignedUpload,
	},
	documents: {
		start: startDocument,
		stream: streamDocument,
	},
};
