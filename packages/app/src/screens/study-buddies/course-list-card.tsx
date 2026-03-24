"use client";

import { SizableText, XStack, YStack } from "@repo/ui";
import { Users, MessageCircle } from "@tamagui/lucide-icons";

interface CourseListCardProps {
	course: {
		id: string;
		code: string;
		name: string;
		totalEnrollments?: number;
		/** Custom study groups only (not section class chats), by visibility. */
		customStudyGroupCounts?: { public: number; private: number };
	};
	onPress: () => void;
}

export function CourseListCard({ course, onPress }: CourseListCardProps) {
	const { public: publicGroups, private: privateGroups } =
		course.customStudyGroupCounts ?? { public: 0, private: 0 };
	const hasCustomGroups = publicGroups > 0 || privateGroups > 0;

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
				{course.totalEnrollments != null && (
					<XStack gap="$1" items="center">
						<Users size={14} color="$gray9" />
						<SizableText size="$2" color="$gray10">
							{course.totalEnrollments}
						</SizableText>
					</XStack>
				)}
				{hasCustomGroups && (
					<XStack gap="$1" items="center">
						<MessageCircle size={14} color="$gray9" />
						<SizableText size="$2" color="$gray10">
							private {privateGroups} | public {publicGroups}
						</SizableText>
					</XStack>
				)}
			</XStack>
		</XStack>
	);
}
