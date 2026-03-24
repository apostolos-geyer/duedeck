"use client";

import { Button, Input, SizableText, Spinner, XStack, YStack } from "@repo/ui";
import { ArrowLeft, Send } from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "../../components/link";
import {
  useDirectMessages,
  usePeerProfile,
  useSendDirectMessage,
} from "../../hooks/use-direct-messages";
import { useCurrentUser } from "../../hooks/use-settings";
import { useOrpc } from "../../rpc/orpc-context";

interface DirectChatScreenProps {
  peerUserId: string;
}

export function DirectChatScreen({ peerUserId }: DirectChatScreenProps) {
  const [draft, setDraft] = useState("");
  const { data: user } = useCurrentUser();
  const { data: peer } = usePeerProfile(peerUserId);
  const { data: messages, isLoading, isError } = useDirectMessages(peerUserId);
  const sendMessage = useSendDirectMessage();
  const queryClient = useQueryClient();
  const orpc = useOrpc();

  function handleSend() {
    if (!draft.trim()) return;
    const content = draft.trim();
    setDraft("");
    sendMessage.mutate(
      { peerUserId, content },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: orpc.directMessages.list.queryOptions({
              input: { peerUserId },
            }).queryKey,
          });
        },
      },
    );
  }

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center" p="$6">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (isError) {
    return (
      <YStack flex={1} p="$5" gap="$3" maxW="$container.full" width="100%">
        <Link href="/study-buddies" style={{ textDecoration: "none" }}>
          <Button size="$3" variant="outlined" icon={ArrowLeft}>
            Back to Study Buddies
          </Button>
        </Link>
        <SizableText color="$gray10">
          You can only message people you share a study group with.
        </SizableText>
      </YStack>
    );
  }

  return (
    <YStack flex={1} maxW="$container.full" width="100%" height="100%" gap="$2">
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
        <Link href="/study-buddies" style={{ textDecoration: "none" }}>
          <Button size="$3" variant="outlined" icon={ArrowLeft}>
            Study Buddies
          </Button>
        </Link>
        <SizableText size="$5" fontWeight="800" color="$color12">
          {peer?.name ?? "Direct message"}
        </SizableText>
      </XStack>

      <YStack
        flex={1}
        minH={360}
        bg="$gray2"
        rounded="$4"
        overflow="hidden"
        borderWidth={1}
        borderColor="$gray5"
      >
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
                maxW="85%"
              >
                <SizableText size="$1" fontWeight="600" color="$color11">
                  {message.sender?.name ?? "Unknown"}
                </SizableText>
                <SizableText size="$3" color="$color12">
                  {message.content}
                </SizableText>
                <SizableText size="$1" color="$gray9">
                  {new Date(message.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </SizableText>
              </YStack>
            );
          })}
        </YStack>

        <XStack
          gap="$2"
          p="$3"
          borderTopWidth={1}
          borderTopColor="$gray5"
          bg="$background"
        >
          <Input
            flex={1}
            placeholder="Message…"
            value={draft}
            onChangeText={setDraft}
          />
          <Button
            theme="purple"
            icon={Send}
            onPress={handleSend}
            disabled={sendMessage.isPending}
          />
        </XStack>
      </YStack>
    </YStack>
  );
}
