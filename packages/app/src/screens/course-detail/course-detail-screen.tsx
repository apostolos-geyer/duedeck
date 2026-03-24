"use client";

import { useState } from "react";
import { Button, H2, H3, SizableText, Spinner, Theme, View, XStack, YStack } from "@repo/ui";
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
				{/* Header */}
				<YStack gap="$2">
					<H2 fontWeight="900" color="$color12">
						{course.code}
					</H2>
					<SizableText size="$4" color="$gray10">
						{course.name}
					</SizableText>
					<XStack gap="$2">
						<View bg="$gray3" rounded="$2" px="$2" py="$1">
							<SizableText size="$2" color="$gray11" fontWeight="500">
								{sectionData.term}
							</SizableText>
						</View>
						<View bg="$gray3" rounded="$2" px="$2" py="$1">
							<SizableText size="$2" color="$gray11" fontWeight="500">
								Section {sectionData.section}
							</SizableText>
						</View>
					</XStack>
					<SizableText size="$3" color="$gray9">
						{sectionData.instructor}
					</SizableText>
					<View
						height={4}
						bg="$color9"
						rounded="$2"
						width="100%"
						mt="$2"
					/>
				</YStack>

				{syllabusKey ? (
					<YStack gap="$3" width="100%">
						<Button
							size="$3"
							variant="outlined"
							icon={FileText}
							onPress={() => setSyllabusOpen((o) => !o)}
						>
							{syllabusOpen ? "Hide syllabus PDF" : "View syllabus PDF"}
						</Button>
						{syllabusOpen ? (
							<YStack
								gap="$2"
								width="100%"
								bg="$gray2"
								rounded="$4"
								p="$3"
								borderWidth={1}
								borderColor="$gray6"
							>
								<SizableText size="$2" color="$gray10">
									{syllabusDoc?.filename ?? "Syllabus"}
								</SizableText>
								<PdfViewer s3Key={syllabusKey} height={480} />
							</YStack>
						) : null}
					</YStack>
				) : null}

				{/* Enrollment */}
				<XStack gap="$3">
					{isEnrolled ? (
						<Button
							theme="red"
							variant="outlined"
							size="$3"
							onPress={() =>
								unenroll.mutate(
									{ sectionId },
									{ onSuccess: () => queryClient.invalidateQueries() },
								)
							}
							disabled={unenroll.isPending}
						>
							{unenroll.isPending ? "Leaving..." : "Leave Course"}
						</Button>
					) : (
						<Button
							theme="green"
							size="$3"
							onPress={() =>
								enroll.mutate(
									{ sectionId },
									{ onSuccess: () => queryClient.invalidateQueries() },
								)
							}
							disabled={enroll.isPending}
						>
							{enroll.isPending ? "Enrolling..." : "Enroll in Course"}
						</Button>
					)}
				</XStack>

				{/* Grade Breakdown */}
				<GradeBreakdown weights={gradeWeights.data ?? []} />

				{/* Deadline Timeline */}
				<DeadlineTimeline deadlines={deadlines.data ?? []} />

				{/* Study Group CTA */}
				<StudyGroupCTA
					courseCode={course.code}
					sectionId={sectionId}
					isEnrolled={isEnrolled}
				/>
			</YStack>
		</Theme>
	);
}
