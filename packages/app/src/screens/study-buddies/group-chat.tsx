"use client";

import { useState } from "react";
import { Button, Input, SizableText, Spinner, XStack, YStack } from "@repo/ui";
import { Send } from "@tamagui/lucide-icons";
import { useMessages, useSendMessage } from "../../hooks/use-study-buddies";
import { useCurrentUser } from "../../hooks/use-settings";

interface GroupChatProps {
	groupId: string;
}

export function GroupChat({ groupId }: GroupChatProps) {
	const [draft, setDraft] = useState("");
	const { data: messages, isLoading } = useMessages(groupId);
	const { data: user } = useCurrentUser();
	const sendMessage = useSendMessage();

	function handleSend() {
		if (!draft.trim()) return;
		sendMessage.mutate({ groupId, content: draft });
		setDraft("");
	}

	if (isLoading) {
		return (
			<YStack flex={1} items="center" justify="center" p="$4">
				<Spinner size="small" />
			</YStack>
		);
	}

	return (
		<YStack flex={1} height="100%">
			{/* Messages area */}
			<YStack flex={1} overflow="scroll" p="$3" gap="$2">
				{(messages ?? []).map((message) => {
					const isOwn = message.senderId === user?.id;

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
								{message.sender?.name ?? "Unknown"}
							</SizableText>
							<SizableText size="$3" color="$color12">
								{message.content}
							</SizableText>
							<SizableText size="$1" color="$gray9">
								{new Date(message.createdAt).toLocaleTimeString("en-US", {
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
				<Button theme="purple" icon={Send} onPress={handleSend} />
			</XStack>
		</YStack>
	);
}
