"use client";

import { SizableText, Theme, View, XStack, YStack } from "@repo/ui";

interface CourseCardProps {
	section: {
		id: string;
		section: string;
		instructor: string;
		theme: string;
		course: { code: string; name: string };
	};
	nextDeadline?: {
		title: string;
		dueDate: string | Date;
	};
	/** Latest syllabus deadline is in the past (course has at least one deadline). */
	courseTermEnded?: boolean;
}

export function CourseCard({
	section,
	nextDeadline,
	courseTermEnded,
}: CourseCardProps) {
	return (
		<Theme name={section.theme as any}>
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
			>
				{courseTermEnded ? (
					<View
						self="flex-start"
						bg="$gray8"
						rounded="$10"
						px="$2.5"
						py="$1"
					>
						<SizableText size="$1" fontWeight="700" color="white">
							All deadlines passed
						</SizableText>
					</View>
				) : null}

				{/* Course code */}
				<SizableText
					size="$6"
					fontWeight="900"
					color="$color12"
					letterSpacing={-0.5}
				>
					{section.course.code}
				</SizableText>

				{/* Course name + section/instructor */}
				<YStack gap="$1">
					<SizableText size="$3" color="$gray10" numberOfLines={1}>
						{section.course.name}
					</SizableText>
					<SizableText size="$2" color="$gray9" numberOfLines={1}>
						Section {section.section} — {section.instructor}
					</SizableText>
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
