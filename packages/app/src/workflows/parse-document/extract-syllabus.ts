import { Output, generateText, streamText, gateway } from "ai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getWritable } from "workflow";
import { s3, UPLOADS_BUCKET } from "@repo/storage";
import {
  syllabusExtractionZodSchema,
  chunkRelevanceZodSchema,
  partialSyllabusExtractionZodSchema,
  type SyllabusExtraction,
  type PartialSyllabusExtraction,
} from "./extraction-schema";
import type { ContentBlock } from "./steps";

// ── Prompts ──────────────────────────────────────────────────────────

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
- Do not nest courseInfo fields at the top level.
- Omit keys that have no data in this chunk (e.g. if there are no deadlines, omit "deadlines").`;

const SCREENING_PROMPT = `You are a fast classifier. Given a chunk of document content, determine if it contains ANY of the following:
- Course identification info (course code, name, instructor, term, school)
- Grade weights or marking scheme (percentages for assignments, exams, etc.)
- Deadlines, due dates, or schedule with specific dates

Respond with {"relevant": true} if the chunk contains any of the above, or {"relevant": false} if it contains only boilerplate (academic integrity, policies, reading lists, etc.).`;

// ── Types ────────────────────────────────────────────────────────────

export interface PageChunk {
  pageIdx: number;
  blocks: ContentBlock[];
  text: string;
}

// ── S3 helpers ───────────────────────────────────────────────────────

export async function fetchMarkdown(parsedS3Key: string): Promise<string> {
  "use step";

  const resp = await s3.send(
    new GetObjectCommand({ Bucket: UPLOADS_BUCKET, Key: parsedS3Key }),
  );
  return resp.Body!.transformToString("utf-8");
}

// ── Legacy single-shot extraction (fallback) ─────────────────────────

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

// ── Chunking ─────────────────────────────────────────────────────────

/** Relevant block types for syllabus extraction — skip images, equations, headers/footers, page numbers. */
const RELEVANT_BLOCK_TYPES = new Set([
  "text",
  "title",
  "table",
  "list",
  "code",
  "paragraph",
]);

/** Convert a content_list into page-level chunks, filtering out irrelevant block types. */
export function groupByPage(contentList: ContentBlock[]): PageChunk[] {
  const pages = new Map<number, ContentBlock[]>();

  for (const block of contentList) {
    if (!RELEVANT_BLOCK_TYPES.has(block.type)) continue;
    const pageBlocks = pages.get(block.page_idx);
    if (pageBlocks) {
      pageBlocks.push(block);
    } else {
      pages.set(block.page_idx, [block]);
    }
  }

  const chunks: PageChunk[] = [];
  for (const [pageIdx, blocks] of pages) {
    const text = blocks
      .map((b) => {
        if (b.html) return b.html; // tables: use structured HTML
        return b.text ?? "";
      })
      .filter(Boolean)
      .join("\n\n");

    if (text.trim()) {
      chunks.push({ pageIdx, blocks, text });
    }
  }

  return chunks.sort((a, b) => a.pageIdx - b.pageIdx);
}

// ── Screening (fast model) ───────────────────────────────────────────

export async function screenChunk(
  chunk: PageChunk,
  _index: number,
): Promise<boolean> {
  "use step";

  const { output } = await generateText({
    model: gateway("google/gemini-2.5-flash-lite"),
    output: Output.object({ schema: chunkRelevanceZodSchema }),
    prompt: `${SCREENING_PROMPT}\n\n---\nPage ${chunk.pageIdx + 1}:\n${chunk.text}`,
  });

  return output?.relevant ?? false;
}

// ── Extraction (full model, per-chunk) ───────────────────────────────

export async function extractChunk(
  chunk: PageChunk,
  _index: number,
): Promise<PartialSyllabusExtraction> {
  "use step";

  const { output } = await generateText({
    model: gateway("google/gemini-2.5-flash"),
    output: Output.object({ schema: partialSyllabusExtractionZodSchema }),
    prompt: `${EXTRACTION_PROMPT}\n\n---\nPage ${chunk.pageIdx + 1}:\n${chunk.text}`,
  });

  if (!output) {
    return {};
  }

  return output;
}

// ── Merge partials ───────────────────────────────────────────────────

/** Merge partial extractions from multiple chunks into a single SyllabusExtraction. */
export function mergeExtractions(
  partials: PartialSyllabusExtraction[],
): SyllabusExtraction {
  // Take the first non-empty courseInfo, filling in missing fields from later chunks
  const mergedCourseInfo = {
    schoolName: "",
    schoolShortName: "",
    courseCode: "",
    courseName: "",
    section: "001",
    term: "",
    instructor: "",
  };

  for (const p of partials) {
    if (!p.courseInfo) continue;
    for (const key of Object.keys(mergedCourseInfo) as Array<
      keyof typeof mergedCourseInfo
    >) {
      if (!mergedCourseInfo[key] && p.courseInfo[key]) {
        mergedCourseInfo[key] = p.courseInfo[key];
      }
    }
  }

  // Concatenate all deadlines and gradeWeights
  const deadlines = partials.flatMap((p) => p.deadlines ?? []);
  const gradeWeights = partials.flatMap((p) => p.gradeWeights ?? []);

  return {
    courseInfo: mergedCourseInfo,
    deadlines,
    gradeWeights,
  };
}
