"use client";

import { SizableText, Theme, View, XStack, YStack } from "@repo/ui";
import type { Course, CourseSection, Deadline } from "../../mock-data";
import { MOCK_DEADLINES } from "../../mock-data";

interface CourseCardProps {
	section: CourseSection;
	course: Course;
	nextDeadline?: Deadline;
	onPress?: (sectionId: string) => void;
}

export function CourseCard({ section, course, nextDeadline, onPress }: CourseCardProps) {
	const sectionDeadlines = MOCK_DEADLINES.filter((d) => d.sectionId === section.id);
	const deadlineCount = sectionDeadlines.length;
	const completedCount = sectionDeadlines.filter((d) => d.completed).length;
	const progress = deadlineCount > 0 ? Math.round((completedCount / deadlineCount) * 100) : 0;

	return (
		<Theme name={section.theme}>
			<YStack
				bg="$gray2"
				rounded="$4"
				p="$4"
				gap="$3"
				borderTopWidth={4}
				borderTopColor="$color9"
				hoverStyle={{ scale: 0.98, opacity: 0.9 }}
				pressStyle={{ scale: 0.97, opacity: 0.85 }}
				cursor="pointer"
				onPress={() => onPress?.(section.id)}
				style={{ flex: "1 1 280px", maxWidth: 360 }}
			>
				{/* Course code */}
				<SizableText
					size="$6"
					fontWeight="900"
					color="$color12"
					letterSpacing={-0.5}
				>
					{course.code}
				</SizableText>

				{/* Course name + section/instructor */}
				<YStack gap="$1">
					<SizableText size="$3" color="$gray10" numberOfLines={1}>
						{course.name}
					</SizableText>
					<SizableText size="$2" color="$gray9" numberOfLines={1}>
						Section {section.section} — {section.instructor}
					</SizableText>
				</YStack>

				{/* Progress bar */}
				<YStack gap="$1">
					<XStack justify="space-between">
						<SizableText size="$1" color="$gray9">
							{completedCount}/{deadlineCount} completed
						</SizableText>
						<SizableText size="$1" color="$gray9" fontWeight="600">
							{progress}%
						</SizableText>
					</XStack>
					<View height={6} bg="$gray4" rounded="$10" overflow="hidden">
						<View
							height="100%"
							width={`${progress}%` as any}
							bg="$color9"
							rounded="$10"
						/>
					</View>
				</YStack>

				{/* Next deadline */}
				{nextDeadline && (
					<XStack gap="$2" items="center">
						<SizableText size="$1" color="$gray9">
							Next:
						</SizableText>
						<SizableText
							size="$1"
							color="$gray11"
							fontWeight="500"
							flex={1}
						>
							{nextDeadline.title}
						</SizableText>
						<SizableText size="$1" color="$gray9">
							{new Date(nextDeadline.dueDate).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
							})}
						</SizableText>
					</XStack>
				)}
			</YStack>
		</Theme>
	);
}
