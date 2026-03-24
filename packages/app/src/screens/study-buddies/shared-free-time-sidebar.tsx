"use client";

import { Button, SizableText, Spinner, YStack } from "@repo/ui";
import { RefreshCw } from "@tamagui/lucide-icons";
import { Link } from "../../components/link";
import { useStudyGroupSharedFreeTime } from "../../hooks/use-study-buddies";

function formatWindow(startIso: string, endIso: string): string {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const date = s.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const t0 = s.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const t1 = e.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${t0}–${t1}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

interface SharedFreeTimeSidebarProps {
  groupId: string;
}

export function SharedFreeTimeSidebar({ groupId }: SharedFreeTimeSidebarProps) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useStudyGroupSharedFreeTime(groupId);

  return (
    <YStack
      width="100%"
      maxHeight={320}
      $md={{
        width: 300,
        maxHeight: "100%",
        flexShrink: 0,
        borderTopWidth: 0,
        borderLeftWidth: 1,
        borderLeftColor: "$gray6",
      }}
      borderTopWidth={1}
      borderTopColor="$gray6"
      bg="$gray2"
      p="$3"
      gap="$3"
      overflow="scroll"
    >
      <YStack gap="$1">
        <SizableText size="$4" fontWeight="800" color="$color12">
          Shared free time
        </SizableText>
        <SizableText size="$1" color="$gray10">
          Next 7 days · Google Calendar (primary)
        </SizableText>
      </YStack>

      <Button
        size="$2"
        variant="outlined"
        icon={RefreshCw}
        onPress={() => void refetch()}
        disabled={isFetching}
      >
        {isFetching ? "Updating…" : "Refresh"}
      </Button>

      {isLoading && (
        <YStack py="$4" items="center">
          <Spinner size="small" />
        </YStack>
      )}

      {isError && (
        <SizableText size="$2" color="$red10">
          {error instanceof Error
            ? error.message
            : "Could not load availability"}
        </SizableText>
      )}

      {data && !isLoading && (
        <YStack gap="$3">
          {!data.viewerHasGoogleCalendar ? (
            <YStack gap="$2">
              <SizableText size="$2" color="$gray11">
                Connect Google Calendar in Settings to compare your availability
                with the group.
              </SizableText>
              <Link href="/settings" style={{ textDecoration: "none" }}>
                <Button size="$2" theme="purple">
                  Calendar settings
                </Button>
              </Link>
              {data.viewerCalendarError ? (
                <SizableText size="$1" color="$gray9">
                  {data.viewerCalendarError}
                </SizableText>
              ) : null}
            </YStack>
          ) : null}

          {data.buddies.length === 0 ? (
            <SizableText size="$2" color="$gray9">
              No other members in this chat yet.
            </SizableText>
          ) : (
            data.buddies.map((b) => (
              <YStack
                key={b.userId}
                gap="$1"
                p="$2"
                bg="$background"
                rounded="$3"
                borderWidth={1}
                borderColor="$gray5"
              >
                <SizableText size="$3" fontWeight="700" color="$color12">
                  {b.name}
                </SizableText>
                {!b.hasGoogleCalendar ? (
                  <SizableText size="$1" color="$gray9">
                    Google Calendar not connected — can&apos;t compare
                  </SizableText>
                ) : !data.viewerHasGoogleCalendar ? null : b.totalSharedMinutes ===
                  0 ? (
                  <SizableText size="$1" color="$gray9">
                    No overlapping free time in this window
                  </SizableText>
                ) : (
                  <>
                    <SizableText size="$2" fontWeight="600" color="$purple10">
                      {formatDuration(b.totalSharedMinutes)} together
                    </SizableText>
                    <YStack gap="$1">
                      {b.sharedFreeWindows.map((w) => (
                        <SizableText
                          key={`${w.start}-${w.end}`}
                          size="$1"
                          color="$gray11"
                        >
                          {formatWindow(w.start, w.end)}
                        </SizableText>
                      ))}
                    </YStack>
                  </>
                )}
              </YStack>
            ))
          )}
        </YStack>
      )}
    </YStack>
  );
}
