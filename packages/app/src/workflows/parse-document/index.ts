import { createWebhook, createHook } from "workflow";
import {
	writeProgress,
	computeContentHash,
	checkDuplicate,
	deleteDocument,
	createDocumentRecord,
	triggerHermesParse,
	handleParseCallback,
	saveExtraction,
	commitExtractedData,
	cancelDocument,
	enrollUserInDocSection,
	closeStream,
} from "./steps";
import {
	fetchMarkdown,
	extractSyllabusData,
} from "./extract-syllabus";
import type { ConfirmationPayload, SyllabusExtraction } from "./extraction-schema";

export type { ProgressEvent } from "./steps";
export type {
	SyllabusExtraction,
	ConfirmationPayload,
} from "./extraction-schema";

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
	const { existingDoc, salvageableParsedKey, salvageableExtraction } =
		await checkDuplicate(contentHash, input.sectionId, input.uploadedById);

	// Track what we can skip based on prior work
	let parsedS3Key: string | undefined;
	let priorExtraction: SyllabusExtraction | undefined;

	if (existingDoc) {
		const isConfirmed = existingDoc.status === "confirmed";

		if (isConfirmed) {
			await enrollUserInDocSection(existingDoc.id, input.uploadedById);
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
		// No scoped match — but we may still have parsed output from another upload
		if (salvageableParsedKey) {
			parsedS3Key = salvageableParsedKey;
		}
		if (salvageableExtraction) {
			priorExtraction = salvageableExtraction;
		}
		await writeProgress("dedup", "done", {
			isDuplicate: false,
			skippingHermes: !!parsedS3Key,
		});
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

		const result = await handleParseCallback(docId, callbackRequest);
		if (result.status === "failed") {
			await writeProgress("parsing", "done", { error: "Parse failed" });
			await writeProgress("done", "done", { docId, error: "Parse failed" });
			await closeStream();
			return { docId, contentHash, deduplicated: false };
		}
		parsedS3Key = result.parsedS3Key;
	} else {
		await writeProgress("parsing", "start");
	}

	// 4b. Fetch the parsed markdown once — pass as text to extractor and UI
	const markdownContent = await fetchMarkdown(parsedS3Key);
	await writeProgress("parsing", "done", {
		parsedS3Key,
		markdownContent,
		s3Key: input.s3Key,
	});

	// 5. Extract all syllabus data (skip if salvaged from prior upload)
	let extraction: SyllabusExtraction;
	if (priorExtraction) {
		await writeProgress("extracting", "start");
		extraction = priorExtraction;
		await writeProgress("extracting", "done");
	} else {
		await writeProgress("extracting", "start");
		extraction = await extractSyllabusData(markdownContent);
		await writeProgress("extracting", "done");
	}

	// 6. Pause for review
	await saveExtraction(docId, extraction);
	const reviewToken = `confirm-${docId}`;
	await writeProgress("reviewing", "start", {
		extraction,
		hookToken: reviewToken,
		s3Key: input.s3Key,
		markdownContent,
	});

	const hook = createHook<ConfirmationPayload>({ token: reviewToken });
	const payload = await hook;

	if (payload.action === "cancel") {
		await cancelDocument(docId);
		await writeProgress("done", "done", { docId, cancelled: true });
		await closeStream();
		return { docId, contentHash, deduplicated: false, cancelled: true };
	}

	// 7. Commit confirmed data
	await commitExtractedData(docId, payload.data, input.uploadedById);

	await writeProgress("done", "done", { docId });
	await closeStream();
	return { docId, contentHash, deduplicated: false };
}
