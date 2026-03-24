"use client";

import { SizableText, Spinner, YStack } from "@repo/ui";
import { useStudyGroupActivityLog } from "../../hooks/use-study-buddies";

function firstName(full: string) {
  return full.split(/\s+/)[0] ?? full;
}

function formatActivityLine(
  type: string,
  subjectName: string,
  actorName: string | null,
): string {
  const s = firstName(subjectName);
  if (type === "member_left") {
    return `${s} left`;
  }
  if (type === "member_removed") {
    const a = actorName ? firstName(actorName) : "Someone";
    return `${s} was removed by ${a}`;
  }
  if (type === "member_joined") {
    if (actorName) {
      return `${s} joined · added by ${firstName(actorName)}`;
    }
    return `${s} joined`;
  }
  return `${s} — ${type}`;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface GroupActivityLogSidebarProps {
  groupId: string;
}

export function GroupActivityLogSidebar({
  groupId,
}: GroupActivityLogSidebarProps) {
  const {
    data: entries,
    isLoading,
    isError,
  } = useStudyGroupActivityLog(groupId);

  return (
    <YStack
      width="100%"
      borderTopWidth={1}
      borderTopColor="$gray6"
      bg="$gray2"
      p="$3"
      gap="$2"
      overflow="scroll"
      $md={{
        width: 260,
        borderTopWidth: 0,
        borderLeftWidth: 1,
        borderLeftColor: "$gray6",
      }}
      style={{
        maxHeight: 320,
      }}
    >
      <YStack gap="$1">
        <SizableText size="$4" fontWeight="800" color="$color12">
          Chat log
        </SizableText>
        <SizableText size="$1" color="$gray10">
          Joins, invites, and removals
        </SizableText>
      </YStack>

      {isLoading ? (
        <YStack py="$4" items="center">
          <Spinner size="small" />
        </YStack>
      ) : isError ? (
        <SizableText size="$2" color="$red10">
          Could not load activity.
        </SizableText>
      ) : (entries ?? []).length === 0 ? (
        <SizableText size="$2" color="$gray9">
          No activity yet.
        </SizableText>
      ) : (
        <YStack gap="$2">
          {(entries ?? []).map((row) => (
            <YStack key={row.id} gap="$1">
              <SizableText size="$2" color="$color12">
                {formatActivityLine(
                  row.type,
                  row.subject.name,
                  row.actor?.name ?? null,
                )}
              </SizableText>
              <SizableText size="$1" color="$gray9">
                {formatWhen(
                  row.createdAt instanceof Date
                    ? row.createdAt.toISOString()
                    : String(row.createdAt),
                )}
              </SizableText>
            </YStack>
          ))}
        </YStack>
      )}
    </YStack>
  );
}
