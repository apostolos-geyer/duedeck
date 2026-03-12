"use client";

import { SizableText, View, XStack, YStack } from "@repo/ui";
import type { StudyGroup } from "../../mock-data";

interface GroupCardProps {
	group: StudyGroup;
	selected: boolean;
	onSelect: () => void;
}

export function GroupCard({ group, selected, onSelect }: GroupCardProps) {
	return (
		<YStack
			bg={selected ? "$purple2" : "$gray2"}
			rounded="$4"
			p="$4"
			gap="$2"
			cursor="pointer"
			hoverStyle={{ bg: "$gray3" }}
			pressStyle={{ bg: "$gray4" }}
			onPress={onSelect}
		>
			{/* Group name */}
			<SizableText size="$4" fontWeight="700" color="$color12">
				{group.name}
			</SizableText>

			{/* Course code */}
			<SizableText size="$2" color="$gray10">
				{group.courseCode}
			</SizableText>

			{/* Member count + avatars */}
			<XStack items="center" gap="$2">
				<XStack>
					{group.members.map((member, index) => (
						<View
							key={member.id}
							width={24}
							height={24}
							rounded="$10"
							bg="$purple9"
							items="center"
							justify="center"
							ml={index > 0 ? "$-1" : undefined}
						>
							<SizableText size="$1" color="white" fontWeight="600">
								{member.name.charAt(0)}
							</SizableText>
						</View>
					))}
				</XStack>
				<SizableText size="$2" color="$gray9">
					{group.members.length}/{group.maxMembers} members
				</SizableText>
			</XStack>
		</YStack>
	);
}
