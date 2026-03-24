"use client";

import {
  Button,
  Input,
  Paragraph,
  SizableText,
  Spinner,
  styled,
  Tabs,
  XStack,
  YStack,
} from "@repo/ui";
import { Send } from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentUser } from "../../hooks/use-settings";
import { useMessages, useSendMessage } from "../../hooks/use-study-buddies";
import { isNotStudyGroupMemberError } from "../../lib/study-group-rpc-error";
import { useOrpc } from "../../rpc/orpc-context";
import { GroupActivityLogSidebar } from "./group-activity-log-sidebar";
import { SharedFreeTimeSidebar } from "./shared-free-time-sidebar";

const ChatBubble = styled(YStack, {
  rounded: 0,
  borderWidth: 2,
  borderColor: "$gray6",
  p: "$3",
  maxW: "70%",
});

interface GroupChatProps {
  groupId: string;
  /** When the current user is no longer a member (e.g. removed), close this chat view. */
  onRemovedFromGroup?: () => void;
}

export function GroupChat({ groupId, onRemovedFromGroup }: GroupChatProps) {
  const [draft, setDraft] = useState("");
  const [mobileTab, setMobileTab] = useState("chat");
  const {
    data: messages,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMessages(groupId, {
    onRemovedFromGroup,
  });
  const removedFromGroup =
    isError && error != null && isNotStudyGroupMemberError(error);
  const { data: user } = useCurrentUser();
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const orpc = useOrpc();

  function handleSend() {
    if (!draft.trim()) return;
    const content = draft.trim();
    setDraft("");
    sendMessage.mutate(
      { groupId, content },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({
            queryKey: orpc.messages.list.queryOptions({ input: { groupId } })
              .queryKey,
          });
        },
      },
    );
  }

  const messagesContent = (
    <YStack flex={1} overflow="scroll" p="$3" gap="$2">
      {removedFromGroup ? (
        <YStack flex={1} items="center" justify="center" py="$8" px="$3">
          <SizableText
            size="$3"
            color="$gray10"
            style={{ textAlign: "center" }}
          >
            You're no longer in this group. It will disappear from your list
            shortly.
          </SizableText>
        </YStack>
      ) : isError ? (
        <YStack flex={1} items="center" justify="center" py="$8" px="$3" gap="$3">
          <SizableText
            size="$3"
            color="$gray10"
            style={{ textAlign: "center" }}
          >
            Couldn't load messages.
          </SizableText>
          <Button
            size="$3"
            variant="outlined"
            disabled={isFetching}
            onPress={() => void refetch()}
          >
            Retry
          </Button>
        </YStack>
      ) : isLoading ? (
        <YStack flex={1} items="center" justify="center" py="$8">
          <Spinner size="small" />
        </YStack>
      ) : (
        (messages ?? []).map((message) => {
          const isOwn = message.senderId === user?.id;

          return (
            <ChatBubble
              key={message.id}
              self={isOwn ? "flex-end" : "flex-start"}
              bg={isOwn ? "$purple4" : "$gray3"}
              borderColor={isOwn ? "$purple6" : "$gray6"}
            >
              <SizableText size="$1" fontWeight="600" color="$color11">
                {message.sender?.name ?? "Unknown"}
              </SizableText>
              <Paragraph size="$3" color="$color12">
                {message.content}
              </Paragraph>
              <SizableText size="$1" color="$gray9">
                {new Date(message.createdAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </SizableText>
            </ChatBubble>
          );
        })
      )}
    </YStack>
  );

  const inputBar = (
    <XStack gap="$2" p="$3" borderTopWidth={1} borderTopColor="$gray5">
      <Input
        flex={1}
        placeholder="Type a message..."
        value={draft}
        onChangeText={setDraft}
        disabled={removedFromGroup}
      />
      <Button
        theme="purple"
        icon={Send}
        onPress={handleSend}
        disabled={removedFromGroup}
      />
    </XStack>
  );

  return (
    <YStack flex={1} height="100%" minH={360}>
      {/* ── Mobile layout (< 768) ── */}
      <YStack flex={1} $md={{ display: "none" }}>
        <Tabs
          defaultValue="chat"
          value={mobileTab}
          onValueChange={setMobileTab}
          flex={1}
          flexDirection="column"
        >
          <Tabs.List>
            <Tabs.Tab value="chat" flex={1}>
              <SizableText size="$3">Chat</SizableText>
            </Tabs.Tab>
            <Tabs.Tab value="activity" flex={1}>
              <SizableText size="$3">Activity</SizableText>
            </Tabs.Tab>
            <Tabs.Tab value="schedule" flex={1}>
              <SizableText size="$3">Schedule</SizableText>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Content value="chat" flex={1}>
            <YStack flex={1}>
              {messagesContent}
              {inputBar}
            </YStack>
          </Tabs.Content>

          <Tabs.Content value="activity" flex={1} overflow="scroll">
            {!removedFromGroup && (
              <GroupActivityLogSidebar groupId={groupId} />
            )}
          </Tabs.Content>

          <Tabs.Content value="schedule" flex={1} overflow="scroll">
            {!removedFromGroup && (
              <SharedFreeTimeSidebar groupId={groupId} />
            )}
          </Tabs.Content>
        </Tabs>
      </YStack>

      {/* ── Desktop layout (768+) ── */}
      <XStack flex={1} display="none" $md={{ display: "flex" }}>
        {/* Messages column */}
        <YStack flex={1} minW={0}>
          {messagesContent}
          {inputBar}
        </YStack>

        {/* Right panel */}
        {!removedFromGroup && (
          <YStack width={280} borderLeftWidth={2} borderColor="$gray5">
            <Tabs defaultValue="activity" flexDirection="column" flex={1}>
              <Tabs.List>
                <Tabs.Tab value="activity" flex={1}>
                  <SizableText size="$2">Activity</SizableText>
                </Tabs.Tab>
                <Tabs.Tab value="schedule" flex={1}>
                  <SizableText size="$2">Schedule</SizableText>
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Content value="activity" flex={1} overflow="scroll">
                <GroupActivityLogSidebar groupId={groupId} />
              </Tabs.Content>

              <Tabs.Content value="schedule" flex={1} overflow="scroll">
                <SharedFreeTimeSidebar groupId={groupId} />
              </Tabs.Content>
            </Tabs>
          </YStack>
        )}
      </XStack>
    </YStack>
  );
}
