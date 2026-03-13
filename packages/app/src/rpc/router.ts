import { randomUUID } from "node:crypto";
import { ORPCError, os } from "@orpc/server";
import { createPresignedUpload } from "@repo/storage";
import { type } from "arktype";
import { start, getRun } from "workflow/api";
import {
	parseDocumentWorkflow,
	type ProgressEvent,
} from "../workflows/parse-document";

export type { ProgressEvent };

type Session = {
	user: { id: string; name: string; email: string };
};

export function createRouter(getSession: () => Promise<Session | null>) {
	const base = os.use(async ({ next }) => {
		const session = await getSession();
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

	return {
		uploads: {
			presign: presignedUpload,
		},
		documents: {
			start: startDocument,
			stream: streamDocument,
		},
	};
}

export type Router = ReturnType<typeof createRouter>;
