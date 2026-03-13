import { Output } from "ai";
import { generateText, createOllama } from "ai-sdk-ollama";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3, UPLOADS_BUCKET } from "@repo/storage";
import {
	syllabusExtractionSchema,
	type SyllabusExtraction,
} from "./extraction-schema";

const OLLAMA_BASE_URL =
	process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

const provider = createOllama({ baseURL: OLLAMA_BASE_URL });

const EXTRACTION_PROMPT = `You are a syllabus parser. Extract structured data from the following course syllabus markdown text.

Extract:
1. **Course info**: school name, school abbreviation/short name, course code (e.g. "CS 490"), course name, section identifier, term (e.g. "Winter 2026"), instructor name.
2. **Deadlines**: Every assignment, exam, quiz, project, or other graded deliverable with its title, due date (ISO 8601 format YYYY-MM-DD), type, and weight percentage. If no specific date is given, make your best estimate from context. If weight is unknown, use 0.
3. **Grade weights**: The grade breakdown categories with label, type, and weight percentage.

Return ONLY valid JSON matching the required schema. Do not include any other text.`;

export async function extractSyllabusData(
	parsedS3Key: string,
): Promise<SyllabusExtraction> {
	"use step";

	const resp = await s3.send(
		new GetObjectCommand({ Bucket: UPLOADS_BUCKET, Key: parsedS3Key }),
	);
	const markdown = await resp.Body!.transformToString("utf-8");

	const { output } = await generateText({
		model: provider("qwen3.5:9b"),
		output: Output.object({ schema: syllabusExtractionSchema }),
		prompt: `${EXTRACTION_PROMPT}\n\n---\n\n${markdown}`,
	});

	if (!output) {
		throw new Error("AI extraction returned no structured output");
	}

	return output;
}
