"use client";

import { useCallback, useState } from "react";
import {
	Button,
	H4,
	SizableText,
	Spinner,
	Theme,
	View,
	XStack,
	YStack,
} from "@repo/ui";
import { BookOpen, Trash2 } from "@tamagui/lucide-icons";
import type { SyllabusExtraction } from "../../workflows/parse-document/extraction-schema";
import { TYPE_THEME } from "../../lib/deadline-theme";

interface DeadlinePreviewProps {
	extraction: SyllabusExtraction;
	onConfirm: (data: SyllabusExtraction) => void;
	onCancel: () => void;
	confirming?: boolean;
	cancelling?: boolean;
}

export function DeadlinePreview({
	extraction,
	onConfirm,
	onCancel,
	confirming,
	cancelling,
}: DeadlinePreviewProps) {
	const [deadlines, setDeadlines] = useState(extraction.deadlines);
	const [gradeWeights, setGradeWeights] = useState(extraction.gradeWeights);
	const { courseInfo } = extraction;

	const busy = confirming || cancelling;

	const removeDeadline = useCallback((index: number) => {
		setDeadlines((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const removeWeight = useCallback((index: number) => {
		setGradeWeights((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleConfirm = useCallback(() => {
		onConfirm({
			courseInfo,
			deadlines,
			gradeWeights,
		});
	}, [courseInfo, deadlines, gradeWeights, onConfirm]);

	return (
		<YStack gap="$4">
			{/* Course info header */}
			<XStack gap="$3" items="center" bg="$purple3" rounded="$4" p="$4">
				<View bg="$purple5" rounded="$4" p="$2">
					<BookOpen size={22} color="$purple11" />
				</View>
				<YStack flex={1}>
					<SizableText size="$5" fontWeight="700" color="$purple11">
						{courseInfo.courseCode}
					</SizableText>
					<SizableText size="$3" color="$purple10">
						{courseInfo.courseName}
					</SizableText>
					<SizableText size="$2" color="$purple9">
						{courseInfo.schoolName} &middot; {courseInfo.section} &middot;{" "}
						{courseInfo.term} &middot; {courseInfo.instructor}
					</SizableText>
				</YStack>
			</XStack>

			{/* Deadlines */}
			<YStack gap="$2">
				<H4 fontWeight="800" color="$color12">
					Extracted Deadlines
				</H4>
				<SizableText size="$3" color="$gray9">
					We found {deadlines.length} deadline{deadlines.length !== 1 && "s"}{" "}
					in your syllabus. Remove any that are incorrect.
				</SizableText>
			</YStack>

			<YStack gap="$2" bg="$gray2" rounded="$4" p="$4">
				{deadlines.length === 0 ? (
					<SizableText size="$3" color="$gray8">
						No deadlines extracted.
					</SizableText>
				) : (
					deadlines.map((deadline, index) => (
						<XStack
							key={`${deadline.title}-${index}`}
							items="center"
							gap="$3"
							py="$2"
							borderBottomWidth={
								index < deadlines.length - 1 ? 1 : 0
							}
							borderBottomColor="$gray4"
						>
							<SizableText
								flex={1}
								size="$3"
								fontWeight="600"
								color="$color12"
							>
								{deadline.title}
							</SizableText>

							<View minW={100}>
								<SizableText size="$2" color="$gray10">
									{deadline.dueDate}
								</SizableText>
							</View>

							<Theme name={TYPE_THEME[deadline.type] ?? TYPE_THEME.other}>
								<View bg="$color4" rounded="$10" px="$2" py="$1">
									<SizableText
										size="$1"
										fontWeight="500"
										color="$color11"
									>
										{deadline.type}
									</SizableText>
								</View>
							</Theme>

							<View minW={50}>
								<SizableText
									size="$2"
									fontWeight="700"
									color="$gray10"
									text="right"
								>
									{deadline.weight}%
								</SizableText>
							</View>

							<Button
								unstyled
								p="$1"
								onPress={() => removeDeadline(index)}
							>
								<Trash2 size={16} color="$red9" />
							</Button>
						</XStack>
					))
				)}
			</YStack>

			{/* Grade weights */}
			{gradeWeights.length > 0 && (
				<>
					<H4 fontWeight="800" color="$color12">
						Grade Breakdown
					</H4>
					<YStack gap="$2" bg="$gray2" rounded="$4" p="$4">
						{gradeWeights.map((weight, index) => (
							<XStack
								key={`${weight.label}-${index}`}
								items="center"
								gap="$3"
								py="$2"
								borderBottomWidth={
									index < gradeWeights.length - 1 ? 1 : 0
								}
								borderBottomColor="$gray4"
							>
								<SizableText
									flex={1}
									size="$3"
									fontWeight="600"
									color="$color12"
								>
									{weight.label}
								</SizableText>

								<Theme name={TYPE_THEME[weight.type] ?? TYPE_THEME.other}>
									<View
										bg="$color4"
										rounded="$10"
										px="$2"
										py="$1"
									>
										<SizableText
											size="$1"
											fontWeight="500"
											color="$color11"
										>
											{weight.type}
										</SizableText>
									</View>
								</Theme>

								<View minW={50}>
									<SizableText
										size="$2"
										fontWeight="700"
										color="$gray10"
										text="right"
									>
										{weight.weight}%
									</SizableText>
								</View>

								<Button
									unstyled
									p="$1"
									onPress={() => removeWeight(index)}
								>
									<Trash2 size={16} color="$red9" />
								</Button>
							</XStack>
						))}
					</YStack>
				</>
			)}

			{/* Actions */}
			<XStack gap="$3" justify="flex-end">
				<Button
					variant="outlined"
					onPress={onCancel}
					disabled={busy}
				>
					{cancelling ? (
						<Spinner size="small" />
					) : (
						"Cancel"
					)}
				</Button>
				<Button
					theme="purple"
					onPress={handleConfirm}
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
	);
}
