"use client";

import { H2, H3, SizableText, Spinner, Theme, View, XStack, YStack } from "@repo/ui";
import { useCourseDetail } from "../../hooks/use-course-detail";
import { GradeBreakdown } from "./grade-breakdown";
import { DeadlineTimeline } from "./deadline-timeline";
import { StudyGroupCTA } from "./study-group-cta";

interface CourseDetailScreenProps {
	sectionId: string;
}

export function CourseDetailScreen({ sectionId }: CourseDetailScreenProps) {
	const { section, deadlines, gradeWeights, isLoading } =
		useCourseDetail(sectionId);

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

				{/* Grade Breakdown */}
				<GradeBreakdown weights={gradeWeights.data ?? []} />

				{/* Deadline Timeline */}
				<DeadlineTimeline deadlines={deadlines.data ?? []} />

				{/* Study Group CTA */}
				<StudyGroupCTA
					courseCode={course.code}
					courseId={course.id}
				/>
			</YStack>
		</Theme>
	);
}
