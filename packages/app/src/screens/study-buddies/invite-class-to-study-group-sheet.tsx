"use client";

import { Button, SizableText, Spinner, XStack, YStack } from "@repo/ui";
import { X } from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "../../hooks/use-settings";
import {
  useInviteFromSectionToStudyGroup,
  useMyCustomStudyGroups,
  useSectionClassmates,
} from "../../hooks/use-study-buddies";

interface InviteClassToStudyGroupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  courseId: string;
  onRequestCreateGroup?: () => void;
}

export function InviteClassToStudyGroupSheet({
  open,
  onOpenChange,
  sectionId,
  courseId,
  onRequestCreateGroup,
}: InviteClassToStudyGroupSheetProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [statusLine, setStatusLine] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: viewer } = useCurrentUser();
  const { data: myRows, isLoading: groupsLoading } = useMyCustomStudyGroups();
  const { data: classmates, isLoading: rosterLoading } = useSectionClassmates(
    open ? sectionId : undefined,
  );
  const invite = useInviteFromSectionToStudyGroup();

  const groupsForCourse = useMemo(
    () =>
      (myRows ?? []).map((r) => r.group).filter((g) => g.courseId === courseId),
    [myRows, courseId],
  );

  const selectedGroup = useMemo(
    () => groupsForCourse.find((g) => g.id === selectedGroupId) ?? null,
    [groupsForCourse, selectedGroupId],
  );

  const memberIds = useMemo(
    () => new Set(selectedGroup?.members.map((m) => m.userId) ?? []),
    [selectedGroup],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSelectedGroupId(null);
      setSelectedUserIds([]);
      setStatusLine(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || groupsForCourse.length === 0) return;
    setSelectedGroupId((prev) =>
      prev && groupsForCourse.some((g) => g.id === prev)
        ? prev
        : (groupsForCourse[0]?.id ?? null),
    );
  }, [open, groupsForCourse]);

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }

  function handleInvite() {
    if (!selectedGroupId || selectedUserIds.length === 0) return;
    setStatusLine(null);
    invite.mutate(
      {
        groupId: selectedGroupId,
        sectionId,
        userIds: selectedUserIds,
      },
      {
        onSuccess: (res) => {
          void queryClient.invalidateQueries();
          const parts: string[] = [];
          if (res.added > 0) parts.push(`Added ${res.added}`);
          if (res.skippedAlreadyMember > 0) {
            parts.push(`${res.skippedAlreadyMember} already in the group`);
          }
          if (res.skippedFull > 0) {
            parts.push(`${res.skippedFull} skipped (group full)`);
          }
          if (res.skippedNotInSection > 0) {
            parts.push(`${res.skippedNotInSection} not in this section`);
          }
          setStatusLine(parts.join(" · ") || "No changes");
          setSelectedUserIds([]);
          if (res.added > 0) {
            onOpenChange(false);
          }
        },
      },
    );
  }

  if (!open) return null;

  const rosterBusy = groupsLoading || rosterLoading;
  const selectableClassmates = (classmates ?? []).filter(
    (c) => c.userId !== viewer?.id,
  );

  return (
    <YStack
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200_000,
      }}
      justify="flex-end"
    >
      <YStack
        flex={1}
        onPress={() => onOpenChange(false)}
        cursor="pointer"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      />
      <YStack
        bg="$background"
        borderTopLeftRadius="$4"
        borderTopRightRadius="$4"
        p="$4"
        gap="$3"
        overflow="scroll"
        borderTopWidth={1}
        borderTopColor="$gray6"
        style={{ maxHeight: "88vh" }}
      >
        <YStack height={4} width={44} bg="$gray6" rounded="$10" self="center" />
        <XStack justify="flex-end" width="100%">
          <Button
            size="$2"
            circular
            icon={X}
            onPress={() => onOpenChange(false)}
          />
        </XStack>

        <SizableText size="$5" fontWeight="800" color="$color12">
          Invite to a study group
        </SizableText>
        <SizableText size="$2" color="$gray10">
          Choose one of your study groups for this course, then select
          classmates from this section to add.
        </SizableText>

        {rosterBusy ? (
          <YStack py="$6" items="center">
            <Spinner />
          </YStack>
        ) : groupsForCourse.length === 0 ? (
          <YStack gap="$3">
            <SizableText size="$3" color="$gray9">
              You don’t have a study group for this course yet. Create one
              first, then you can invite people from the class chat.
            </SizableText>
            {onRequestCreateGroup ? (
              <Button theme="purple" onPress={onRequestCreateGroup}>
                Create study group
              </Button>
            ) : null}
          </YStack>
        ) : (
          <>
            <YStack gap="$2">
              <SizableText size="$2" fontWeight="600" color="$color11">
                Study group
              </SizableText>
              {groupsForCourse.map((g) => (
                <Button
                  key={g.id}
                  size="$3"
                  variant={g.id === selectedGroupId ? undefined : "outlined"}
                  theme={g.id === selectedGroupId ? "purple" : undefined}
                  justify="flex-start"
                  onPress={() => setSelectedGroupId(g.id)}
                >
                  <YStack items="flex-start" gap="$1">
                    <SizableText fontWeight="700" color="$color12">
                      {g.name}
                    </SizableText>
                    <SizableText size="$2" color="$gray10">
                      {g._count?.members ?? g.members.length} members
                      {g.maxMembers ? ` · max ${g.maxMembers}` : ""}
                    </SizableText>
                  </YStack>
                </Button>
              ))}
            </YStack>

            <YStack gap="$2">
              <SizableText size="$2" fontWeight="600" color="$color11">
                Classmates
              </SizableText>
              {selectableClassmates.length === 0 ? (
                <SizableText size="$3" color="$gray9">
                  No other students in this section yet.
                </SizableText>
              ) : (
                selectableClassmates.map((c) => {
                  const inGroup = memberIds.has(c.userId);
                  const selected = selectedUserIds.includes(c.userId);
                  return (
                    <Button
                      key={c.userId}
                      size="$3"
                      variant={selected ? undefined : "outlined"}
                      theme={selected ? "purple" : undefined}
                      disabled={inGroup}
                      justify="flex-start"
                      onPress={() => {
                        if (!inGroup) toggleUser(c.userId);
                      }}
                    >
                      <XStack
                        justify="space-between"
                        width="100%"
                        items="center"
                      >
                        <SizableText
                          fontWeight="600"
                          color={inGroup ? "$gray9" : "$color12"}
                        >
                          {c.name}
                        </SizableText>
                        {inGroup ? (
                          <SizableText size="$2" color="$gray9">
                            In group
                          </SizableText>
                        ) : null}
                      </XStack>
                    </Button>
                  );
                })
              )}
            </YStack>

            <Button
              theme="purple"
              disabled={
                !selectedGroupId ||
                selectedUserIds.length === 0 ||
                invite.isPending
              }
              onPress={handleInvite}
            >
              Add to study group
            </Button>
            {statusLine ? (
              <SizableText size="$2" color="$gray10">
                {statusLine}
              </SizableText>
            ) : null}
          </>
        )}
      </YStack>
    </YStack>
  );
}
