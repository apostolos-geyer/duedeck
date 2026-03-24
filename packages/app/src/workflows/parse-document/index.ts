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
	failDocument,
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
	/** Ignore duplicate shortcuts: always Hermes parse + AI extract + full commit. */
	forceFullReprocess?: boolean;
}

export async function parseDocumentWorkflow(input: ParseDocumentInput) {
	"use workflow";

	let docId: string | undefined;
	let contentHash: string | undefined;

	try {
		const forceFull = input.forceFullReprocess === true;

		// 1. Compute content hash
		await writeProgress("hashing", "start");
		contentHash = await computeContentHash(input.s3Key);
		await writeProgress("hashing", "done", { contentHash });

		// 2. Check for existing document with same hash
		await writeProgress("dedup", "start");
		const { existingDoc, salvageableParsedKey, salvageableExtraction } =
			await checkDuplicate(contentHash, input.sectionId, input.uploadedById);

		let parsedS3Key: string | undefined;
		let priorExtraction: SyllabusExtraction | undefined;

		if (existingDoc) {
			const isConfirmed = existingDoc.status === "confirmed";

			if (isConfirmed && !forceFull) {
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

			if (!isConfirmed) {
				if (!forceFull && existingDoc.parsedS3Key) {
					parsedS3Key = existingDoc.parsedS3Key;
				}
				await deleteDocument(existingDoc.id);
				await writeProgress("dedup", "done", {
					isDuplicate: true,
					retrying: true,
					skippingHermes: !forceFull && !!parsedS3Key,
				});
			} else {
				await writeProgress("dedup", "done", {
					isDuplicate: true,
					fullReprocess: true,
				});
			}
		} else {
			if (!forceFull) {
				if (salvageableParsedKey) {
					parsedS3Key = salvageableParsedKey;
				}
				if (salvageableExtraction) {
					priorExtraction = salvageableExtraction;
				}
			}
			await writeProgress("dedup", "done", {
				isDuplicate: false,
				skippingHermes: !forceFull && !!parsedS3Key,
			});
		}

		// 3. Create fresh document record
		docId = await createDocumentRecord({
			s3Key: input.s3Key,
			sectionId: input.sectionId,
			filename: input.filename,
			uploadedById: input.uploadedById,
			contentHash,
			status: "processing",
			...(parsedS3Key ? { parsedS3Key } : {}),
		});

		// 4. Parse via Hermes if we don't already have parsed markdown
		if (!parsedS3Key) {
			await writeProgress("parsing", "start");
			try {
				const webhook = createWebhook();
				await triggerHermesParse(input.s3Key, webhook.url, webhook.token);
				const callbackRequest = await webhook;

				const result = await handleParseCallback(docId, callbackRequest);
				if (result.status === "failed") {
					const msg = `Hermes parser failed: ${result.error || "unknown error"}`;
					await failDocument(docId, msg);
					await writeProgress("parsing", "done", { error: msg });
					await writeProgress("done", "done", { docId, error: msg });
					await closeStream();
					return { docId, contentHash, deduplicated: false };
				}
				parsedS3Key = result.parsedS3Key ?? undefined;
			} catch (err) {
				const msg = `Hermes parsing failed: ${err instanceof Error ? err.message : String(err)}`;
				await failDocument(docId, msg);
				await writeProgress("parsing", "done", { error: msg });
				await writeProgress("done", "done", { docId, error: msg });
				await closeStream();
				return { docId, contentHash, deduplicated: false };
			}
		} else {
			await writeProgress("parsing", "start");
		}

		if (!parsedS3Key) {
			const msg = "No parsed markdown key available";
			await failDocument(docId, msg);
			await writeProgress("parsing", "done", { error: msg });
			await writeProgress("done", "done", { docId, error: msg });
			await closeStream();
			return { docId, contentHash, deduplicated: false };
		}

		// 4b. Fetch the parsed markdown
		const markdownKey = parsedS3Key;
		let markdownContent: string;
		try {
			markdownContent = await fetchMarkdown(markdownKey);
		} catch (err) {
			const msg = `Failed to fetch parsed markdown: ${err instanceof Error ? err.message : String(err)}`;
			await failDocument(docId, msg);
			await writeProgress("parsing", "done", { error: msg });
			await writeProgress("done", "done", { docId, error: msg });
			await closeStream();
			return { docId, contentHash, deduplicated: false };
		}
		await writeProgress("parsing", "done", {
			parsedS3Key,
			markdownContent,
			s3Key: input.s3Key,
		});

		// 5. Extract all syllabus data
		let extraction: SyllabusExtraction;
		if (priorExtraction) {
			await writeProgress("extracting", "start");
			extraction = priorExtraction;
			await writeProgress("extracting", "done");
		} else {
			await writeProgress("extracting", "start");
			try {
				extraction = await extractSyllabusData(markdownContent);
			} catch (err) {
				const msg = `AI extraction failed: ${err instanceof Error ? err.message : String(err)}`;
				await failDocument(docId, msg);
				await writeProgress("extracting", "done", { error: msg });
				await writeProgress("done", "done", { docId, error: msg });
				await closeStream();
				return { docId, contentHash, deduplicated: false };
			}
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
	} catch (err) {
		// Top-level catch: surface any uncaught error to the UI
		const msg = `Workflow failed: ${err instanceof Error ? err.message : String(err)}`;
		if (docId) {
			try { await failDocument(docId, msg); } catch { /* best effort */ }
		}
		try {
			await writeProgress("done", "done", { docId, error: msg });
			await closeStream();
		} catch { /* stream may already be closed */ }
		return { docId, contentHash, deduplicated: false };
	}
}
