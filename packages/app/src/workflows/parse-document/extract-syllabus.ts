import { Output, streamText, gateway } from "ai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getWritable } from "workflow";
import { s3, UPLOADS_BUCKET } from "@repo/storage";
import {
  syllabusExtractionZodSchema,
  type SyllabusExtraction,
} from "./extraction-schema";

const EXTRACTION_PROMPT = `You are a syllabus parser. Output a single JSON object with exactly these top-level keys: courseInfo, gradeWeights, deadlines. No markdown fences, no commentary.

## courseInfo (object)
- schoolName: string
- schoolShortName: string (abbreviation or short name for the school)
- courseCode: string (e.g. "CS 490")
- courseName: string
- section: string (section identifier; use "001" if missing)
- term: string (e.g. "Winter 2026"; infer from dates if needed)
- instructor: string

## gradeWeights (array of objects)
Each item: { "label": string, "type": string, "weight": number }
- label: category name from the syllabus (e.g. "Assignments", "Final Exam")
- type: exactly one of: assignment, exam, quiz, project, participation, other
- weight: percent of final grade (number, not a string)

## deadlines (array of objects)
Each item: { "title": string, "dueDate": string, "type": string, "weight": number }
- title: specific item name (e.g. "Assignment 1", "Midterm")
- dueDate: YYYY-MM-DD (ISO date string; estimate from context if only relative dates exist)
- type: exactly one of: assignment, exam, quiz, project, other (deadlines do not use "participation" — use "other" if needed)
- weight: percent of final grade for this item (number). Split a category's weight across its items when individual weights are not given.

Rules:
- Output only valid JSON matching this shape.
- Do not include any keys other than courseInfo, gradeWeights, deadlines.
- Do not nest courseInfo fields at the top level.`;

export async function fetchMarkdown(parsedS3Key: string): Promise<string> {
  "use step";

  const resp = await s3.send(
    new GetObjectCommand({ Bucket: UPLOADS_BUCKET, Key: parsedS3Key }),
  );
  return resp.Body!.transformToString("utf-8");
}

export async function extractSyllabusData(
  markdown: string,
): Promise<SyllabusExtraction> {
  "use step";

  const aiStream = getWritable<string>({ namespace: "ai" });
  const writer = aiStream.getWriter();

  const result = streamText({
    model: gateway("google/gemini-2.5-flash"),
    output: Output.object({ schema: syllabusExtractionZodSchema }),
    prompt: `${EXTRACTION_PROMPT}\n\n---\n\n${markdown}`,
  });

  for await (const chunk of result.textStream) {
    await writer.write(chunk);
  }

  writer.releaseLock();
  await aiStream.close();

  const output = await result.output;

  if (!output) {
    throw new Error("AI extraction returned no structured output");
  }

  return output as SyllabusExtraction;
}
