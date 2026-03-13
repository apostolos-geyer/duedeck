"use client";

import { SizableText, View, XStack, YStack } from "@repo/ui";

interface MemberListProps {
	members: Array<{
		userId: string;
		user: { name: string; image: string | null };
	}>;
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
				<YStack key={member.userId} items="center" gap="$1">
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
								{member.user.name.charAt(0)}
							</SizableText>
						</View>
					</View>
					<SizableText size="$1" color="$color11">
						{member.user.name.split(" ")[0]}
					</SizableText>
				</YStack>
			))}
		</XStack>
	);
}
