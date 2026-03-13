import { createWebhook } from "workflow";
import {
	writeProgress,
	computeContentHash,
	checkDuplicate,
	createDocumentRecord,
	triggerHermesParse,
	handleParseCallback,
	closeStream,
} from "./steps";

export type { ProgressEvent } from "./steps";

export interface ParseDocumentInput {
	s3Key: string;
	sectionId: string;
	filename: string;
	uploadedById: string;
}

export async function parseDocumentWorkflow(input: ParseDocumentInput) {
	"use workflow";

	// 1. Compute content hash
	await writeProgress("hashing", "start");
	const contentHash = await computeContentHash(input.s3Key);
	await writeProgress("hashing", "done", { contentHash });

	// 2. Check for duplicates
	await writeProgress("dedup", "start");
	const { isDuplicate, existingDoc } = await checkDuplicate(
		input.sectionId,
		contentHash,
	);
	await writeProgress("dedup", "done", { isDuplicate });

	if (isDuplicate && existingDoc) {
		const docId = await createDocumentRecord({
			...input,
			contentHash,
			status: "completed",
			parsedS3Key: existingDoc.parsedS3Key ?? undefined,
		});
		await writeProgress("done", "done", { docId, deduplicated: true });
		await closeStream();
		return { docId, contentHash, deduplicated: true };
	}

	// 3. Create document record as processing
	const docId = await createDocumentRecord({
		...input,
		contentHash,
		status: "processing",
	});

	// 4. Parse via Hermes — workflow suspends until webhook callback
	await writeProgress("parsing", "start");
	const webhook = createWebhook();
	await triggerHermesParse(input.s3Key, webhook.url, webhook.token);
	const callbackRequest = await webhook;
	await writeProgress("parsing", "done");

	// 5. Process result
	await writeProgress("extracting", "start");
	const result = await handleParseCallback(docId, callbackRequest);
	await writeProgress("extracting", "done");

	await writeProgress("done", "done", { docId });
	await closeStream();
	return { docId, contentHash, ...result, deduplicated: false };
}
