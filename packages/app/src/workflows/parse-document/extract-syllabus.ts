import { Output, streamText, gateway } from "ai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getWritable } from "workflow";
import { s3, UPLOADS_BUCKET } from "@repo/storage";
import {
  syllabusExtractionSchema,
  type SyllabusExtraction,
} from "./extraction-schema";

const EXTRACTION_PROMPT = `You are a syllabus parser. Extract ALL structured data from the following syllabus markdown.

Extract:
1. **Course info**: school name, school abbreviation/short name, course code (e.g. "CS 490"), course name, section identifier, term (e.g. "Winter 2026"), instructor name.
2. **Grade weights**: The grade breakdown categories with label, type (assignment/exam/quiz/project/participation/other), and weight percentage. These are the high-level categories like "Assignments 30%", "Final Exam 40%", etc.
3. **Deadlines**: Every assignment, exam, quiz, project, or other graded deliverable with:
   - title: the specific name (e.g. "Assignment 1", "Midterm Exam")
   - dueDate: ISO 8601 format YYYY-MM-DD. If no specific date is given, estimate from context.
   - type: one of assignment/exam/quiz/project/other
   - weight: percentage of final grade. Distribute the category weight across items if individual weights aren't specified.

Return ONLY valid JSON matching the required schema.`;

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
    model: gateway("openai/gpt-oss-120b"),
    output: Output.object({ schema: syllabusExtractionSchema }),
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

  return output;
}
