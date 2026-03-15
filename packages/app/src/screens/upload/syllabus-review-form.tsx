"use client";

import { useCallback } from "react";
import {
	Button,
	H4,
	SizableText,
	Spinner,
	View,
	XStack,
	YStack,
} from "@repo/ui";
import { useAppForm } from "@repo/ui/form";
import { useStore } from "@tanstack/react-store";
import { BookOpen, Plus, Trash2 } from "@tamagui/lucide-icons";
import type { SyllabusExtraction } from "../../workflows/parse-document/extraction-schema";

const WEIGHT_TYPE_OPTIONS = [
	{ label: "Assignment", value: "assignment" },
	{ label: "Exam", value: "exam" },
	{ label: "Quiz", value: "quiz" },
	{ label: "Project", value: "project" },
	{ label: "Participation", value: "participation" },
	{ label: "Other", value: "other" },
];

const DEADLINE_TYPE_OPTIONS = [
	{ label: "Assignment", value: "assignment" },
	{ label: "Exam", value: "exam" },
	{ label: "Quiz", value: "quiz" },
	{ label: "Project", value: "project" },
	{ label: "Other", value: "other" },
];

interface SyllabusReviewFormProps {
	extraction: SyllabusExtraction;
	onConfirm: (data: SyllabusExtraction) => void;
	onCancel: () => void;
	confirming?: boolean;
	cancelling?: boolean;
}

export function SyllabusReviewForm({
	extraction,
	onConfirm,
	onCancel,
	confirming,
	cancelling,
}: SyllabusReviewFormProps) {
	const busy = confirming || cancelling;
	const { courseInfo } = extraction;

	const form = useAppForm({
		defaultValues: extraction,
		onSubmit: ({ value }) => {
			onConfirm(value);
		},
	});

	const totalWeight = useStore(form.baseStore, (s) =>
		s.values.gradeWeights.reduce(
			(sum: number, w: { weight: number }) => sum + (w.weight || 0),
			0,
		),
	);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			e.stopPropagation();
			form.handleSubmit();
		},
		[form],
	);

	return (
		<form onSubmit={handleSubmit}>
			<YStack gap="$5">
				{/* School context — read-only */}
				<XStack
					gap="$3"
					items="center"
					bg="$purple3"
					rounded="$4"
					px="$4"
					py="$3"
				>
					<View bg="$purple5" rounded="$4" p="$2">
						<BookOpen size={20} color="$purple11" />
					</View>
					<YStack flex={1}>
						<SizableText size="$3" fontWeight="700" color="$purple11">
							{courseInfo.schoolName}
						</SizableText>
						<SizableText size="$1" color="$purple9">
							{courseInfo.schoolShortName}
						</SizableText>
					</YStack>
				</XStack>

				{/* ── Course Info ── */}
				<YStack gap="$2">
					<H4 fontWeight="800" color="$color12">
						Course Information
					</H4>
					<YStack gap="$3">
						<XStack gap="$3">
							<YStack flex={1}>
								<form.AppField
									name="courseInfo.courseCode"
									children={(field) => (
										<field.TextField
											label="Course Code"
											required
										/>
									)}
								/>
							</YStack>
							<YStack flex={2}>
								<form.AppField
									name="courseInfo.courseName"
									children={(field) => (
										<field.TextField
											label="Course Name"
											required
										/>
									)}
								/>
							</YStack>
						</XStack>
						<XStack gap="$3">
							<YStack flex={1}>
								<form.AppField
									name="courseInfo.section"
									children={(field) => (
										<field.TextField label="Section" required />
									)}
								/>
							</YStack>
							<YStack flex={1}>
								<form.AppField
									name="courseInfo.term"
									children={(field) => (
										<field.TextField label="Term" required />
									)}
								/>
							</YStack>
							<YStack flex={1}>
								<form.AppField
									name="courseInfo.instructor"
									children={(field) => (
										<field.TextField
											label="Instructor"
											required
										/>
									)}
								/>
							</YStack>
						</XStack>
					</YStack>
				</YStack>

				{/* ── Grade Weights ── */}
				<YStack gap="$2">
					<XStack items="center" justify="space-between">
						<H4 fontWeight="800" color="$color12">
							Grade Breakdown
						</H4>
						<SizableText
							size="$3"
							fontWeight="700"
							color={
								Math.abs(totalWeight - 100) < 0.01
									? "$green10"
									: "$orange10"
							}
						>
							Total: {totalWeight.toFixed(1)}%
						</SizableText>
					</XStack>
					<SizableText size="$2" color="$gray9">
						Edit or add grade weight categories. Weights should sum to
						100%.
					</SizableText>

					<form.Field name="gradeWeights" mode="array">
						{(field) => (
							<YStack gap="$2">
								{field.state.value.map(
									(_: unknown, index: number) => (
										<XStack
											key={index}
											gap="$3"
											items="flex-end"
											bg="$gray2"
											rounded="$4"
											p="$3"
										>
											<YStack flex={3}>
												<form.AppField
													name={`gradeWeights[${index}].label`}
													children={(subField) => (
														<subField.TextField
															label={
																index === 0
																	? "Label"
																	: undefined
															}
															inputProps={{
																placeholder:
																	"e.g. Assignments",
															}}
														/>
													)}
												/>
											</YStack>
											<YStack flex={2} minW={130}>
												<form.AppField
													name={`gradeWeights[${index}].type`}
													children={(subField) => (
														<subField.SelectField
															label={
																index === 0
																	? "Type"
																	: undefined
															}
															options={
																WEIGHT_TYPE_OPTIONS
															}
														/>
													)}
												/>
											</YStack>
											<YStack width={90}>
												<form.AppField
													name={`gradeWeights[${index}].weight`}
													children={(subField) => (
														<subField.NumberField
															label={
																index === 0
																	? "Weight %"
																	: undefined
															}
														/>
													)}
												/>
											</YStack>
											<Button
												unstyled
												p="$2"
												onPress={() =>
													field.removeValue(index)
												}
											>
												<Trash2 size={16} color="$red9" />
											</Button>
										</XStack>
									),
								)}
								<Button
									variant="outlined"
									size="$3"
									onPress={() =>
										field.pushValue({
											label: "",
											type: "other",
											weight: 0,
										})
									}
									icon={<Plus size={16} />}
								>
									Add Category
								</Button>
							</YStack>
						)}
					</form.Field>
				</YStack>

				{/* ── Deadlines ── */}
				<YStack gap="$2">
					<H4 fontWeight="800" color="$color12">
						Deadlines
					</H4>
					<SizableText size="$2" color="$gray9">
						Edit, add, or remove individual deadlines.
					</SizableText>

					<form.Field name="deadlines" mode="array">
						{(field) => (
							<YStack gap="$2">
								{field.state.value.map(
									(_: unknown, index: number) => (
										<XStack
											key={index}
											gap="$3"
											items="flex-end"
											bg="$gray2"
											rounded="$4"
											p="$3"
										>
											<YStack flex={3}>
												<form.AppField
													name={`deadlines[${index}].title`}
													children={(subField) => (
														<subField.TextField
															label={
																index === 0
																	? "Title"
																	: undefined
															}
															inputProps={{
																placeholder:
																	"e.g. Assignment 1",
															}}
														/>
													)}
												/>
											</YStack>
											<YStack flex={2} minW={130}>
												<form.AppField
													name={`deadlines[${index}].dueDate`}
													children={(subField) => (
														<subField.TextField
															label={
																index === 0
																	? "Due Date"
																	: undefined
															}
															inputProps={{
																placeholder:
																	"YYYY-MM-DD",
															}}
														/>
													)}
												/>
											</YStack>
											<YStack flex={2} minW={130}>
												<form.AppField
													name={`deadlines[${index}].type`}
													children={(subField) => (
														<subField.SelectField
															label={
																index === 0
																	? "Type"
																	: undefined
															}
															options={
																DEADLINE_TYPE_OPTIONS
															}
														/>
													)}
												/>
											</YStack>
											<YStack width={90}>
												<form.AppField
													name={`deadlines[${index}].weight`}
													children={(subField) => (
														<subField.NumberField
															label={
																index === 0
																	? "Weight %"
																	: undefined
															}
														/>
													)}
												/>
											</YStack>
											<Button
												unstyled
												p="$2"
												onPress={() =>
													field.removeValue(index)
												}
											>
												<Trash2 size={16} color="$red9" />
											</Button>
										</XStack>
									),
								)}
								<Button
									variant="outlined"
									size="$3"
									onPress={() =>
										field.pushValue({
											title: "",
											dueDate: "",
											type: "assignment",
											weight: 0,
										})
									}
									icon={<Plus size={16} />}
								>
									Add Deadline
								</Button>
							</YStack>
						)}
					</form.Field>
				</YStack>

				{/* Actions */}
				<XStack gap="$3" justify="flex-end">
					<Button
						variant="outlined"
						onPress={onCancel}
						disabled={busy}
					>
						{cancelling ? <Spinner size="small" /> : "Cancel"}
					</Button>
					<Button
						theme="purple"
						onPress={() => form.handleSubmit()}
						disabled={busy}
					>
						{confirming ? (
							<>
								<Spinner size="small" color="white" />
								Confirming...
							</>
						) : (
							"Confirm & Add Course"
						)}
					</Button>
				</XStack>
			</YStack>
		</form>
	);
}
