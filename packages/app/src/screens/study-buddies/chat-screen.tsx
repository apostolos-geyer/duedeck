"use client";

import {
  Button,
  H4,
  SizableText,
  Spinner,
  View,
  XStack,
  YStack,
} from "@repo/ui";
import { ArrowLeft, Settings, UserPlus } from "@tamagui/lucide-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentUser } from "../../hooks/use-settings";
import { useMyClassChats, useRemoveStudyGroupMember } from "../../hooks/use-study-buddies";
import { useOrpc } from "../../rpc/orpc-context";
import { CreateCustomGroupSheet } from "./create-custom-group-sheet";
import { GroupChat } from "./group-chat";
import { InviteClassToStudyGroupSheet } from "./invite-class-to-study-group-sheet";
import { MemberList } from "./member-list";
import { StudyGroupSettingsSheet } from "./study-group-settings-sheet";

export interface ChatScreenProps {
  groupId: string;
  onNavigateBack?: () => void;
}

export function ChatScreen({ groupId, onNavigateBack }: ChatScreenProps) {
  const orpc = useOrpc();
  const queryClient = useQueryClient();
  const { data: viewer } = useCurrentUser();
  const { data: myClasses } = useMyClassChats();
  const removeMember = useRemoveStudyGroupMember();

  const { data: group, isLoading } = useQuery(
    orpc.studyGroups.get.queryOptions({ input: { groupId } }),
  );

  const [inviteFromClassOpen, setInviteFromClassOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [createCustomGroupOpen, setCreateCustomGroupOpen] = useState(false);

  if (isLoading) {
    return (
      <YStack flex={1} items="center" justify="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (!group) {
    return (
      <YStack flex={1} items="center" justify="center" gap="$3">
        <SizableText size="$4" color="$gray10">
          Group not found or you are not a member.
        </SizableText>
        {onNavigateBack ? (
          <Button size="$3" variant="outlined" onPress={onNavigateBack}>
            Go back
          </Button>
        ) : null}
      </YStack>
    );
  }

  const isCustomStudyGroup = group.sectionId === null;
  const canManageCustomStudyGroup =
    isCustomStudyGroup &&
    viewer &&
    (group.createdById === null || group.createdById === viewer.id);

  const inviteSectionId =
    group.sectionId ??
    myClasses?.find((r: any) => r.courseId === group.courseId)?.sectionId;

  function handleBack() {
    if (onNavigateBack) {
      onNavigateBack();
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  }

  return (
    <YStack flex={1} height="100%">
      {/* Header */}
      <YStack gap="$2" p="$3" borderBottomWidth={2} borderColor="$gray5">
        <XStack items="center" gap="$3" flexWrap="wrap">
          <Button
            size="$3"
            variant="outlined"
            icon={ArrowLeft}
            onPress={handleBack}
          >
            Back
          </Button>
          <H4 fontFamily="$heading" color="$color12" flex={1}>
            {group.name}
          </H4>
          {isCustomStudyGroup && !group.isPublic ? (
            <SizableText size="$2" color="$gray9" fontWeight="600">
              Private
            </SizableText>
          ) : null}
        </XStack>

        {/* Member avatars */}
        <XStack items="center" gap="$2">
          <XStack items="center">
            {group.members.slice(0, 5).map((member, i) => (
              <View
                key={member.userId}
                width={28}
                height={28}
                rounded={14}
                bg="$purple6"
                items="center"
                justify="center"
                borderWidth={2}
                borderColor="$background"
                ml={i > 0 ? -8 : 0}
                z={5 - i}
              >
                <SizableText size="$1" color="$color1" fontWeight="700">
                  {member.user.name.charAt(0).toUpperCase()}
                </SizableText>
              </View>
            ))}
          </XStack>
          <SizableText size="$2" color="$gray10">
            {group.members.length} member{group.members.length !== 1 ? "s" : ""}
          </SizableText>
        </XStack>

        {/* Action buttons */}
        <XStack gap="$2" flexWrap="wrap">
          {isCustomStudyGroup && inviteSectionId ? (
            <Button
              size="$3"
              theme="purple"
              variant="outlined"
              icon={UserPlus}
              onPress={() => setInviteFromClassOpen(true)}
            >
              Invite
            </Button>
          ) : null}
          {canManageCustomStudyGroup ? (
            <Button
              size="$3"
              variant="outlined"
              icon={Settings}
              onPress={() => setGroupSettingsOpen(true)}
            >
              Settings
            </Button>
          ) : null}
        </XStack>
      </YStack>

      {/* Members */}
      <MemberList
        members={group.members}
        createdById={group.createdById}
        viewerId={viewer?.id}
        canKick={canManageCustomStudyGroup ? true : undefined}
        onKickMember={(userId) => {
          removeMember.mutate(
            { groupId: group.id, userId },
            {
              onSuccess: () => {
                void queryClient.invalidateQueries();
              },
            },
          );
        }}
        kickPending={removeMember.isPending}
      />

      {/* Chat */}
      <YStack flex={1} minH={320} bg="$gray2" overflow="hidden">
        <GroupChat
          groupId={group.id}
          onRemovedFromGroup={() => {
            handleBack();
            void queryClient.invalidateQueries();
          }}
        />
      </YStack>

      {/* Sheets */}
      {isCustomStudyGroup && inviteSectionId ? (
        <InviteClassToStudyGroupSheet
          open={inviteFromClassOpen}
          onOpenChange={setInviteFromClassOpen}
          sectionId={inviteSectionId}
          courseId={group.courseId}
          onRequestCreateGroup={() => {
            setInviteFromClassOpen(false);
            setCreateCustomGroupOpen(true);
          }}
        />
      ) : null}

      {canManageCustomStudyGroup ? (
        <StudyGroupSettingsSheet
          open={groupSettingsOpen}
          onOpenChange={setGroupSettingsOpen}
          viewerId={viewer?.id}
          createdById={group.createdById}
          group={{
            id: group.id,
            name: group.name,
            maxMembers: group.maxMembers,
            isPublic: group.isPublic,
            members: group.members,
          }}
          onSaved={() => {
            void queryClient.invalidateQueries();
          }}
          onDeleted={() => {
            handleBack();
            void queryClient.invalidateQueries();
          }}
        />
      ) : null}

      <CreateCustomGroupSheet
        open={createCustomGroupOpen}
        onOpenChange={setCreateCustomGroupOpen}
        onCreated={() => {
          void queryClient.invalidateQueries();
        }}
      />
    </YStack>
  );
}
