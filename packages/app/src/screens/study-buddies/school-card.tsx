"use client";

import { SizableText, View, XStack, YStack } from "@repo/ui";
import { GraduationCap, Users, BookOpen } from "@tamagui/lucide-icons";
import type { School } from "../../mock-data";

interface SchoolCardProps {
	school: School;
	onPress: () => void;
}

export function SchoolCard({ school, onPress }: SchoolCardProps) {
	return (
		<YStack
			bg="$gray2"
			rounded="$4"
			p="$5"
			gap="$3"
			cursor="pointer"
			hoverStyle={{ bg: "$gray3", scale: 0.99 }}
			pressStyle={{ bg: "$gray4", scale: 0.98 }}
			onPress={onPress}
			style={{ flex: "1 1 280px" }}
		>
			<XStack items="center" gap="$3">
				<View
					width={48}
					height={48}
					rounded="$4"
					bg="$purple3"
					items="center"
					justify="center"
				>
					<GraduationCap size={24} color="$purple9" />
				</View>
				<YStack gap="$1" flex={1}>
					<SizableText size="$5" fontWeight="800" color="$color12">
						{school.shortName}
					</SizableText>
					<SizableText size="$2" color="$gray10" numberOfLines={1}>
						{school.name}
					</SizableText>
				</YStack>
			</XStack>

			<XStack gap="$4">
				<XStack gap="$1" items="center">
					<Users size={14} color="$gray9" />
					<SizableText size="$2" color="$gray10">
						{school.studentCount.toLocaleString()} students
					</SizableText>
				</XStack>
				<XStack gap="$1" items="center">
					<BookOpen size={14} color="$gray9" />
					<SizableText size="$2" color="$gray10">
						{school.courseCount} courses
					</SizableText>
				</XStack>
			</XStack>
		</YStack>
	);
}
