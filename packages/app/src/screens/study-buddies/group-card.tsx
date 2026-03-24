"use client";

import { Button, SizableText, View, XStack, YStack } from "@repo/ui";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    maxMembers: number;
    members: Array<{
      userId: string;
      user: { name: string; image: string | null };
    }>;
    _count?: { members: number };
  };
  selected: boolean;
  /** Viewer is already in this group — row opens the chat. */
  isMember: boolean;
  joinPending?: boolean;
  onJoin: () => void;
  onOpen: () => void;
}

export function GroupCard({
  group,
  selected,
  isMember,
  joinPending,
  onJoin,
  onOpen,
}: GroupCardProps) {
  const memberCount = group._count?.members ?? group.members.length;

  return (
    <YStack
      bg={selected ? "$purple2" : "$gray2"}
      rounded="$4"
      p="$4"
      gap="$2"
      {...(isMember
        ? {
            cursor: "pointer",
            hoverStyle: { bg: "$gray3" },
            pressStyle: { bg: "$gray4" },
            onPress: onOpen,
          }
        : { cursor: "default" })}
    >
      <XStack items="flex-start" justify="space-between" gap="$3">
        <YStack flex={1} minW={0} gap="$2">
          <SizableText size="$4" fontWeight="700" color="$color12">
            {group.name}
          </SizableText>

          <XStack items="center" gap="$2">
            <XStack>
              {group.members.map((member, index) => (
                <View
                  key={member.userId}
                  width={24}
                  height={24}
                  rounded="$10"
                  bg="$purple9"
                  items="center"
                  justify="center"
                  ml={index > 0 ? "$-1" : undefined}
                >
                  <SizableText size="$1" color="white" fontWeight="600">
                    {member.user.name.charAt(0)}
                  </SizableText>
                </View>
              ))}
            </XStack>
            <SizableText size="$2" color="$gray9">
              {memberCount}/{group.maxMembers} members
            </SizableText>
          </XStack>
        </YStack>

        {!isMember ? (
          <Button
            size="$3"
            theme="purple"
            disabled={joinPending}
            onPress={onJoin}
          >
            Join
          </Button>
        ) : (
          <SizableText size="$2" color="$purple10" fontWeight="600" self="center">
            Open
          </SizableText>
        )}
      </XStack>
    </YStack>
  );
}
