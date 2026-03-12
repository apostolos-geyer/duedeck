"use client";

import { SizableText, View, XStack, YStack } from "@repo/ui";
import { Users, MessageCircle } from "@tamagui/lucide-icons";
import type { BrowseCourse } from "../../mock-data";

interface CourseListCardProps {
	course: BrowseCourse;
	onPress: () => void;
}

export function CourseListCard({ course, onPress }: CourseListCardProps) {
	return (
		<XStack
			bg="$gray2"
			rounded="$3"
			p="$4"
			gap="$3"
			items="center"
			cursor="pointer"
			hoverStyle={{ bg: "$gray3" }}
			pressStyle={{ bg: "$gray4" }}
			onPress={onPress}
		>
			<YStack flex={1} gap="$1">
				<SizableText size="$5" fontWeight="800" color="$color12">
					{course.code}
				</SizableText>
				<SizableText size="$2" color="$gray10">
					{course.name}
				</SizableText>
			</YStack>

			<XStack gap="$4" items="center">
				<XStack gap="$1" items="center">
					<Users size={14} color="$gray9" />
					<SizableText size="$2" color="$gray10">
						{course.studentCount}
					</SizableText>
				</XStack>
				<XStack gap="$1" items="center">
					<MessageCircle size={14} color="$gray9" />
					<SizableText size="$2" color="$gray10">
						{course.groupCount} groups
					</SizableText>
				</XStack>
			</XStack>
		</XStack>
	);
}
