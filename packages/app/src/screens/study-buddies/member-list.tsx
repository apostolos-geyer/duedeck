"use client";

import { Button, SizableText, View, XStack, YStack } from "@repo/ui";
import { UserMinus } from "@tamagui/lucide-icons";
import { useState } from "react";
import { useCurrentUser } from "../../hooks/use-settings";
import { PeerProfileSheet } from "./peer-profile-sheet";

interface MemberListProps {
  members: Array<{
    userId: string;
    user: { name: string; image: string | null };
  }>;
  /** When set, members are tagged Creator vs Member. Omit for class chats (no creator record). */
  createdById?: string | null;
  /**
   * When true with `onKickMember`, managers can remove others. Intended only for
   * custom study groups — never pass for section class chats.
   */
  viewerId?: string;
  canKick?: boolean;
  onKickMember?: (userId: string) => void;
  kickPending?: boolean;
}

function Tag({
  label,
  variant,
}: {
  label: string;
  variant: "creator" | "member" | "you";
}) {
  const bg =
    variant === "creator"
      ? "$purple4"
      : variant === "you"
        ? "$gray4"
        : "$gray3";
  const color =
    variant === "creator"
      ? "$purple11"
      : variant === "you"
        ? "$color11"
        : "$gray10";

  return (
    <View px="$2" py="$1" rounded="$2" bg={bg}>
      <SizableText size="$1" fontWeight="700" color={color}>
        {label}
      </SizableText>
    </View>
  );
}

export function MemberList({
  members,
  createdById,
  viewerId,
  canKick,
  onKickMember,
  kickPending,
}: MemberListProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const sheetOpen = selectedUserId !== null;
  const { data: viewer } = useCurrentUser();
  const effectiveViewerId = viewerId ?? viewer?.id;
  const showRoleTags = Boolean(createdById);

  return (
    <>
      <XStack
        gap="$4"
        p="$3"
        borderBottomWidth={1}
        borderBottomColor="$gray5"
        items="flex-start"
        flexWrap="wrap"
      >
        {members.map((member) => {
          const isCreator = showRoleTags && member.userId === createdById;
          const isYou = Boolean(
            effectiveViewerId && member.userId === effectiveViewerId,
          );
          const showRemove =
            canKick &&
            onKickMember &&
            effectiveViewerId &&
            member.userId !== effectiveViewerId;

          return (
            <YStack
              key={member.userId}
              items="center"
              gap="$2"
              minW={108}
              maxW={120}
            >
              <YStack
                items="center"
                gap="$1.5"
                cursor="pointer"
                hoverStyle={{ opacity: 0.9 }}
                pressStyle={{ opacity: 0.75 }}
                onPress={() => setSelectedUserId(member.userId)}
              >
                <View
                  width={40}
                  height={40}
                  rounded="$10"
                  bg={isCreator ? "$purple9" : "$purple7"}
                  items="center"
                  justify="center"
                  borderWidth={isCreator ? 2 : 0}
                  borderColor="$purple4"
                >
                  <SizableText size="$3" color="white" fontWeight="700">
                    {member.user.name.charAt(0)}
                  </SizableText>
                </View>
                <SizableText
                  size="$2"
                  color="$color12"
                  fontWeight="600"
                  textAlign="center"
                  style={{ maxWidth: 104 }}
                >
                  {member.user.name.split(" ")[0]}
                </SizableText>
                <XStack gap="$1" flexWrap="wrap" justify="center" maxW={112}>
                  {showRoleTags ? (
                    isCreator ? (
                      <Tag label="Creator" variant="creator" />
                    ) : (
                      <Tag label="Member" variant="member" />
                    )
                  ) : null}
                  {isYou ? <Tag label="You" variant="you" /> : null}
                </XStack>
              </YStack>
              {showRemove ? (
                <Button
                  size="$2"
                  circular
                  variant="outlined"
                  icon={UserMinus}
                  disabled={kickPending}
                  opacity={kickPending ? 0.5 : 1}
                  borderColor="$red8"
                  color="$red10"
                  hoverStyle={{
                    bg: "$red2",
                    borderColor: "$red9",
                  }}
                  aria-label={`Remove ${member.user.name} from group`}
                  onPress={() => onKickMember(member.userId)}
                />
              ) : null}
            </YStack>
          );
        })}
      </XStack>

      <PeerProfileSheet
        userId={selectedUserId}
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) setSelectedUserId(null);
        }}
        viewerId={viewer?.id}
      />
    </>
  );
}
