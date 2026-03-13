import { type } from "arktype";

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
