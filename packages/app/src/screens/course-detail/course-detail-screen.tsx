"use client";

import { H2, H3, SizableText, Theme, View, XStack, YStack } from "@repo/ui";
import {
	getSection,
	getCourseForSection,
	getDeadlinesForSection,
	getGradeWeightsForSection,
} from "../../mock-data";
import { GradeBreakdown } from "./grade-breakdown";
import { DeadlineTimeline } from "./deadline-timeline";
import { StudyGroupCTA } from "./study-group-cta";

interface CourseDetailScreenProps {
	sectionId: string;
	onNavigateStudyBuddies?: () => void;
}

export function CourseDetailScreen({ sectionId, onNavigateStudyBuddies }: CourseDetailScreenProps) {
	const section = getSection(sectionId);
	const course = getCourseForSection(sectionId);

	if (!section || !course) {
		return (
			<YStack p="$5" items="center">
				<H3 color="$gray9">Course not found</H3>
			</YStack>
		);
	}

	const deadlines = getDeadlinesForSection(sectionId);
	const weights = getGradeWeightsForSection(sectionId);

	return (
		<Theme name={section.theme}>
			<YStack gap="$4" $md={{ gap: "$5" }} maxW="$container.full" width="100%">
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
								{section.term}
							</SizableText>
						</View>
						<View bg="$gray3" rounded="$2" px="$2" py="$1">
							<SizableText size="$2" color="$gray11" fontWeight="500">
								Section {section.section}
							</SizableText>
						</View>
					</XStack>
					<SizableText size="$3" color="$gray9">
						{section.instructor}
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
				<GradeBreakdown weights={weights} />

				{/* Deadline Timeline */}
				<DeadlineTimeline deadlines={deadlines} />

				{/* Study Group CTA */}
				<StudyGroupCTA courseCode={course.code} courseId={course.id} onPress={onNavigateStudyBuddies} />
			</YStack>
		</Theme>
	);
}
