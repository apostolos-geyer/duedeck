"use client";

import { Button, Input, SizableText, XStack, YStack } from "@repo/ui";
import { X } from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  useDeleteStudyGroup,
  useUpdateStudyGroup,
} from "../../hooks/use-study-buddies";

export interface StudyGroupSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewerId?: string;
  /** When set and equal to `viewerId`, the user may delete the group (creator only). */
  createdById: string | null;
  group: {
    id: string;
    name: string;
    maxMembers: number;
    isPublic: boolean;
    members: unknown[];
    _count?: { members: number };
  };
  onSaved: (g: {
    id: string;
    name: string;
    courseId: string;
    sectionId: string | null;
    isPublic: boolean;
    maxMembers: number;
    createdById: string | null;
    members: Array<{
      userId: string;
      user: { name: string; image: string | null };
    }>;
  }) => void;
  /** Called after the creator successfully deletes the group. */
  onDeleted?: () => void;
}

export function StudyGroupSettingsSheet({
  open,
  onOpenChange,
  viewerId,
  createdById,
  group,
  onSaved,
  onDeleted,
}: StudyGroupSettingsSheetProps) {
  const [name, setName] = useState(group.name);
  const [maxStr, setMaxStr] = useState(String(group.maxMembers));
  const [isPublic, setIsPublic] = useState(group.isPublic);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const queryClient = useQueryClient();
  const update = useUpdateStudyGroup();
  const del = useDeleteStudyGroup();

  const isCreator =
    Boolean(viewerId) && Boolean(createdById) && viewerId === createdById;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setName(group.name);
      setMaxStr(String(group.maxMembers));
      setIsPublic(group.isPublic);
      setDeleteConfirmOpen(false);
    }
  }, [open, group.name, group.maxMembers, group.isPublic]);

  if (!open) return null;

  const memberCount = group._count?.members ?? group.members.length;

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const maxParsed = Number.parseInt(maxStr, 10);
    if (!Number.isFinite(maxParsed)) return;
    const maxMembers = Math.min(250, Math.max(2, maxParsed));
    if (maxMembers < memberCount) return;

    update.mutate(
      {
        groupId: group.id,
        name: trimmed,
        maxMembers,
        isPublic,
      },
      {
        onSuccess: (g) => {
          void queryClient.invalidateQueries();
          onOpenChange(false);
          onSaved(g);
        },
      },
    );
  }

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
          Study group settings
        </SizableText>
        <SizableText size="$2" color="$gray10">
          Only for custom study groups. Section class chats are always shared
          with the whole class and are not configurable here.
        </SizableText>

        <YStack gap="$2">
          <SizableText size="$2" fontWeight="600" color="$color11">
            Name
          </SizableText>
          <Input value={name} onChangeText={setName} />
        </YStack>

        <YStack gap="$2">
          <SizableText size="$2" fontWeight="600" color="$color11">
            Max members ({memberCount} now)
          </SizableText>
          <Input
            keyboardType="numeric"
            value={maxStr}
            onChangeText={setMaxStr}
          />
          <SizableText size="$1" color="$gray9">
            Between 2 and 250. Cannot go below the current member count.
          </SizableText>
        </YStack>

        <YStack gap="$2">
          <SizableText size="$2" fontWeight="600" color="$color11">
            Visibility
          </SizableText>
          <XStack gap="$2" flexWrap="wrap">
            <Button
              size="$3"
              theme={isPublic ? "purple" : undefined}
              variant={isPublic ? undefined : "outlined"}
              onPress={() => setIsPublic(true)}
            >
              Public
            </Button>
            <Button
              size="$3"
              theme={!isPublic ? "purple" : undefined}
              variant={!isPublic ? undefined : "outlined"}
              onPress={() => setIsPublic(false)}
            >
              Private
            </Button>
          </XStack>
          <SizableText size="$2" color="$gray10">
            For this custom study group only: public appears in course browse;
            private is invite-only for people already in the course.
          </SizableText>
        </YStack>

        <Button
          theme="purple"
          disabled={
            !name.trim() ||
            update.isPending ||
            Math.min(250, Math.max(2, Number.parseInt(maxStr, 10) || 0)) <
              memberCount
          }
          onPress={handleSave}
        >
          {update.isPending ? "Saving…" : "Save"}
        </Button>

        {isCreator ? (
          <YStack gap="$2" pt="$2" borderTopWidth={1} borderTopColor="$gray6">
            <SizableText size="$2" fontWeight="600" color="$red10">
              Danger zone
            </SizableText>
            <SizableText size="$2" color="$gray10">
              Only you (the creator) can delete this study group. All messages
              and members are removed. This cannot be undone.
            </SizableText>
            {!deleteConfirmOpen ? (
              <Button
                size="$3"
                variant="outlined"
                borderColor="$red8"
                color="$red10"
                onPress={() => setDeleteConfirmOpen(true)}
              >
                Delete study group
              </Button>
            ) : (
              <YStack gap="$2">
                <SizableText size="$2" color="$red10" fontWeight="600">
                  Delete “{group.name}” permanently?
                </SizableText>
                <XStack gap="$2" flexWrap="wrap">
                  <Button
                    size="$3"
                    variant="outlined"
                    onPress={() => setDeleteConfirmOpen(false)}
                    disabled={del.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="$3"
                    bg="$red9"
                    color="white"
                    disabled={del.isPending}
                    onPress={() => {
                      del.mutate(
                        { groupId: group.id },
                        {
                          onSuccess: () => {
                            void queryClient.invalidateQueries();
                            onOpenChange(false);
                            onDeleted?.();
                          },
                        },
                      );
                    }}
                  >
                    {del.isPending ? "Deleting…" : "Yes, delete group"}
                  </Button>
                </XStack>
              </YStack>
            )}
          </YStack>
        ) : null}
      </YStack>
    </YStack>
  );
}
