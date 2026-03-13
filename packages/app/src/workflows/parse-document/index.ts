import { createWebhook, createHook } from "workflow";
import {
	writeProgress,
	computeContentHash,
	checkDuplicate,
	deleteDocument,
	createDocumentRecord,
	triggerHermesParse,
	handleParseCallback,
	saveExtractionAndPause,
	commitExtractedData,
	cancelDocument,
	closeStream,
} from "./steps";
import { extractSyllabusData } from "./extract-syllabus";
import type { ConfirmationPayload } from "./extraction-schema";

export type { ProgressEvent } from "./steps";
export type { SyllabusExtraction, ConfirmationPayload } from "./extraction-schema";

export interface ParseDocumentInput {
	s3Key: string;
	sectionId?: string;
	filename: string;
	uploadedById: string;
}

export async function parseDocumentWorkflow(input: ParseDocumentInput) {
	"use workflow";

	// 1. Compute content hash
	await writeProgress("hashing", "start");
	const contentHash = await computeContentHash(input.s3Key);
	await writeProgress("hashing", "done", { contentHash });

	// 2. Check for existing document with same hash
	await writeProgress("dedup", "start");
	const { existingDoc } = await checkDuplicate(
		contentHash,
		input.sectionId,
		input.uploadedById,
	);

	// Track what we can skip based on prior work
	let parsedS3Key: string | undefined;

	if (existingDoc) {
		const isConfirmed = existingDoc.status === "confirmed";

		if (isConfirmed) {
			// Already fully processed — redirect to existing document page
			await writeProgress("dedup", "done", { isDuplicate: true });
			await writeProgress("done", "done", {
				docId: existingDoc.id,
				deduplicated: true,
			});
			await closeStream();
			return {
				docId: existingDoc.id,
				contentHash,
				deduplicated: true,
			};
		}

		// Not confirmed — salvage what we can, then delete the stale record
		if (existingDoc.parsedS3Key) {
			parsedS3Key = existingDoc.parsedS3Key;
		}
		await deleteDocument(existingDoc.id);
		await writeProgress("dedup", "done", {
			isDuplicate: true,
			retrying: true,
			skippingHermes: !!parsedS3Key,
		});
	} else {
		await writeProgress("dedup", "done", { isDuplicate: false });
	}

	// 3. Create fresh document record
	const docId = await createDocumentRecord({
		...input,
		contentHash,
		status: "processing",
	});

	// 4. Parse via Hermes if we don't already have parsed markdown
	if (!parsedS3Key) {
		await writeProgress("parsing", "start");
		const webhook = createWebhook();
		await triggerHermesParse(input.s3Key, webhook.url, webhook.token);
		const callbackRequest = await webhook;
		await writeProgress("parsing", "done");

		// 5. Process Hermes result
		await writeProgress("extracting", "start");
		const result = await handleParseCallback(docId, callbackRequest);
		if (result.status === "failed") {
			await writeProgress("done", "done", { docId, error: "Parse failed" });
			await closeStream();
			return { docId, contentHash, deduplicated: false };
		}
		parsedS3Key = result.parsedS3Key;
	} else {
		// Skip Hermes — markdown already exists
		await writeProgress("parsing", "start");
		await writeProgress("parsing", "done");
		await writeProgress("extracting", "start");
	}

	// 6. AI extraction from parsed markdown
	const extraction = await extractSyllabusData(parsedS3Key);
	await writeProgress("extracting", "done");

	// 7. Save extraction + pause for user review
	await saveExtractionAndPause(docId, extraction);
	const hookToken = `confirm-${docId}`;
	await writeProgress("reviewing", "start", {
		extraction,
		hookToken,
	});

	const hook = createHook<ConfirmationPayload>({ token: hookToken });
	const payload = await hook;

	// 8. Handle user decision
	if (payload.action === "cancel") {
		await cancelDocument(docId);
		await writeProgress("done", "done", { docId, cancelled: true });
		await closeStream();
		return { docId, contentHash, deduplicated: false, cancelled: true };
	}

	// 9. Commit confirmed data
	await commitExtractedData(docId, payload.data, input.uploadedById);

	await writeProgress("done", "done", { docId });
	await closeStream();
	return { docId, contentHash, deduplicated: false };
}
