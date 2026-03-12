"use client";

import { useState } from "react";
import { Button, Input, SizableText, XStack, YStack } from "@repo/ui";
import { Send } from "@tamagui/lucide-icons";
import { MOCK_MESSAGES, MOCK_USER } from "../../mock-data";

interface GroupChatProps {
	groupId: string;
}

export function GroupChat({ groupId }: GroupChatProps) {
	const [draft, setDraft] = useState("");

	const messages = MOCK_MESSAGES.filter((m) => m.groupId === groupId);

	return (
		<YStack flex={1} height="100%">
			{/* Messages area */}
			<YStack flex={1} overflow="scroll" p="$3" gap="$2">
				{messages.map((message) => {
					const isOwn = message.senderId === MOCK_USER.id;

					return (
						<YStack
							key={message.id}
							self={isOwn ? "flex-end" : "flex-start"}
							bg={isOwn ? "$purple4" : "$gray3"}
							rounded="$4"
							p="$3"
							maxW="70%"
						>
							<SizableText size="$1" fontWeight="600" color="$color11">
								{message.senderName}
							</SizableText>
							<SizableText size="$3" color="$color12">
								{message.content}
							</SizableText>
							<SizableText size="$1" color="$gray9">
								{new Date(message.timestamp).toLocaleTimeString("en-US", {
									hour: "numeric",
									minute: "2-digit",
								})}
							</SizableText>
						</YStack>
					);
				})}
			</YStack>

			{/* Input bar */}
			<XStack gap="$2" p="$3" borderTopWidth={1} borderTopColor="$gray5">
				<Input
					flex={1}
					placeholder="Type a message..."
					value={draft}
					onChangeText={setDraft}
				/>
				<Button theme="purple" icon={Send} onPress={() => setDraft("")} />
			</XStack>
		</YStack>
	);
}
