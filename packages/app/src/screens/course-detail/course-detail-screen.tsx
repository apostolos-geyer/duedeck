"use client";

import { useState } from "react";
import {
	AppCard,
	Button,
	H2,
	H3,
	Paragraph,
	SizableText,
	Spinner,
	Theme,
	View,
	XStack,
	YStack,
} from "@repo/ui";
import { FileText } from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useCourseDetail } from "../../hooks/use-course-detail";
import { useEnroll, useUnenroll } from "../../hooks/use-enrollment";
import { PdfViewer } from "../upload";
import { GradeBreakdown } from "./grade-breakdown";
import { DeadlineTimeline } from "./deadline-timeline";
import { StudyGroupCTA } from "./study-group-cta";

interface CourseDetailScreenProps {
	sectionId: string;
}

export function CourseDetailScreen({ sectionId }: CourseDetailScreenProps) {
	const queryClient = useQueryClient();
	const [syllabusOpen, setSyllabusOpen] = useState(false);
	const { section, deadlines, gradeWeights, isEnrolled, isLoading } =
		useCourseDetail(sectionId);
	const enroll = useEnroll();
	const unenroll = useUnenroll();

	if (isLoading) {
		return (
			<YStack flex={1} items="center" justify="center" p="$6">
				<Spinner size="large" />
			</YStack>
		);
	}

	const sectionData = section.data;
	if (!sectionData) {
		return (
			<YStack p="$5" items="center">
				<H3 color="$gray9">Course not found</H3>
			</YStack>
		);
	}

	const course = sectionData.course;
	const syllabusDoc = sectionData.documents?.[0];
	const syllabusKey = syllabusDoc?.s3Key;

	return (
		<Theme name={sectionData.theme as any}>
			<YStack
				gap="$4"
				$md={{ gap: "$5" }}
				maxW="$container.full"
				width="100%"
			>
				{/* Mobile single-column, Desktop two-column */}
				<YStack
					gap="$4"
					$md={{ flexDirection: "row", gap: "$5" }}
					width="100%"
				>
					{/* Left column */}
					<YStack gap="$4" $md={{ flex: 3, minW: 0 }}>
						{/* Course header card */}
						<AppCard size="lg">
							<YStack gap="$2">
								<H2
									fontFamily="$heading"
									fontWeight="900"
									color="$color12"
								>
									{course.code}
								</H2>
								<Paragraph size="$4" color="$gray10">
									{course.name}
								</Paragraph>
								<XStack gap="$2" mt="$2">
									<View bg="$gray3" rounded={0} px="$2" py="$1">
										<SizableText
											size="$2"
											color="$gray11"
											fontWeight="500"
										>
											{sectionData.term}
										</SizableText>
									</View>
									<View bg="$gray3" rounded={0} px="$2" py="$1">
										<SizableText
											size="$2"
											color="$gray11"
											fontWeight="500"
										>
											Section {sectionData.section}
										</SizableText>
									</View>
								</XStack>
								<SizableText size="$3" color="$gray9" mt="$1">
									{sectionData.instructor}
								</SizableText>
							</YStack>

							{/* Enrollment inside header */}
							<XStack gap="$3" mt="$4">
								{!isEnrolled && (
									<Button
										theme="green"
										size="$3"
										onPress={() =>
											enroll.mutate(
												{ sectionId },
												{
													onSuccess: () =>
														queryClient.invalidateQueries(),
												},
											)
										}
										disabled={enroll.isPending}
									>
										{enroll.isPending
											? "Enrolling..."
											: "Enroll in Course"}
									</Button>
								)}
							</XStack>
						</AppCard>

						{/* Deadlines */}
						<DeadlineTimeline deadlines={deadlines.data ?? []} />
					</YStack>

					{/* Right column */}
					<YStack gap="$4" $md={{ flex: 2, minW: 0 }}>
						{/* Grade breakdown */}
						<GradeBreakdown weights={gradeWeights.data ?? []} />

						{/* Syllabus PDF button */}
						{syllabusKey ? (
							<AppCard size="md">
								<YStack gap="$3">
									<Button
										size="$3"
										variant="outlined"
										icon={FileText}
										onPress={() => setSyllabusOpen((o) => !o)}
									>
										{syllabusOpen
											? "Hide syllabus PDF"
											: "View syllabus PDF"}
									</Button>
									{syllabusOpen ? (
										<YStack
											gap="$2"
											width="100%"
											bg="$gray2"
											rounded={0}
											p="$3"
											borderWidth={1}
											borderColor="$gray6"
										>
											<SizableText size="$2" color="$gray10">
												{syllabusDoc?.filename ?? "Syllabus"}
											</SizableText>
											<PdfViewer
												s3Key={syllabusKey}
												height={480}
											/>
										</YStack>
									) : null}
								</YStack>
							</AppCard>
						) : null}

						{/* Study Group CTA */}
						<StudyGroupCTA
							courseCode={course.code}
							sectionId={sectionId}
							isEnrolled={isEnrolled}
						/>
					</YStack>
				</YStack>

				{/* Leave course - small, non-prominent, at the very bottom */}
				{isEnrolled && (
					<View self="flex-start">
						<Theme name="red">
							<Button
								variant="outlined"
								size="$2"
								onPress={() =>
									unenroll.mutate(
										{ sectionId },
										{
											onSuccess: () =>
												queryClient.invalidateQueries(),
										},
									)
								}
								disabled={unenroll.isPending}
							>
								{unenroll.isPending ? "Leaving..." : "Leave Course"}
							</Button>
						</Theme>
					</View>
				)}
			</YStack>
		</Theme>
	);
}
