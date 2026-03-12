"use client";

import { SizableText, View, XStack, YStack } from "@repo/ui";
import type { GroupMember } from "../../mock-data";

interface MemberListProps {
	members: GroupMember[];
}

export function MemberList({ members }: MemberListProps) {
	return (
		<XStack
			gap="$3"
			p="$3"
			borderBottomWidth={1}
			borderBottomColor="$gray5"
			items="center"
			flexWrap="wrap"
		>
			{members.map((member) => (
				<YStack key={member.id} items="center" gap="$1">
					{/* Avatar with online indicator */}
					<View position="relative">
						<View
							width={36}
							height={36}
							rounded="$10"
							bg="$purple9"
							items="center"
							justify="center"
						>
							<SizableText size="$2" color="white" fontWeight="600">
								{member.name.charAt(0)}
							</SizableText>
						</View>
						{member.online && (
							<View
								width={8}
								height={8}
								rounded="$10"
								bg="$green9"
								position="absolute"
								b={0}
								r={0}
							/>
						)}
					</View>
					<SizableText size="$1" color="$color11">
						{member.name.split(" ")[0]}
					</SizableText>
				</YStack>
			))}
		</XStack>
	);
}
