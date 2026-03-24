import { type } from "arktype";
import { z } from "zod";

/** Zod mirror of `syllabusExtractionSchema` — use with AI SDK `Output.object` (ArkType is not supported there). */
const deadlineTypeZod = z.enum([
	"assignment",
	"exam",
	"quiz",
	"project",
	"other",
]);
const gradeWeightTypeZod = z.enum([
	"assignment",
	"exam",
	"quiz",
	"project",
	"participation",
	"other",
]);

export const syllabusExtractionZodSchema = z.object({
	courseInfo: z.object({
		schoolName: z.string(),
		schoolShortName: z.string(),
		courseCode: z.string(),
		courseName: z.string(),
		section: z.string(),
		term: z.string(),
		instructor: z.string(),
	}),
	gradeWeights: z.array(
		z.object({
			label: z.string(),
			type: gradeWeightTypeZod,
			weight: z.number(),
		}),
	),
	deadlines: z.array(
		z.object({
			title: z.string(),
			dueDate: z.string(),
			type: deadlineTypeZod,
			weight: z.number(),
		}),
	),
});

export const courseInfoSchema = type({
	schoolName: "string",
	schoolShortName: "string",
	courseCode: "string",
	courseName: "string",
	section: "string",
	term: "string",
	instructor: "string",
});

export const extractedDeadlineSchema = type({
	title: "string",
	dueDate: "string", // ISO 8601
	type: "'assignment' | 'exam' | 'quiz' | 'project' | 'other'",
	weight: "number",
});

export const extractedGradeWeightSchema = type({
	label: "string",
	type: "'assignment' | 'exam' | 'quiz' | 'project' | 'participation' | 'other'",
	weight: "number",
});

export const syllabusExtractionSchema = type({
	courseInfo: courseInfoSchema,
	deadlines: extractedDeadlineSchema.array(),
	gradeWeights: extractedGradeWeightSchema.array(),
});

export type SyllabusExtraction = typeof syllabusExtractionSchema.infer;

export const confirmationPayloadSchema = type(
	{ action: "'confirm'", data: syllabusExtractionSchema },
	"|",
	{ action: "'cancel'" },
);

export type ConfirmationPayload = typeof confirmationPayloadSchema.infer;
