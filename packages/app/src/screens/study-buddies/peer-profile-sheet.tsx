"use client";

import { Button, SizableText, Spinner, YStack } from "@repo/ui";
import { Mail, MessageCircle, X } from "@tamagui/lucide-icons";
import { useEffect } from "react";
import { usePeerProfile } from "../../hooks/use-direct-messages";

interface PeerProfileSheetProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewerId?: string;
}

export function PeerProfileSheet({
  userId,
  open,
  onOpenChange,
  viewerId,
}: PeerProfileSheetProps) {
  const { data, isLoading, isError, error } = usePeerProfile(
    open ? userId : null,
  );

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !userId) return null;

  const isSelf = viewerId !== undefined && userId === viewerId;

  async function copyEmail() {
    if (!data?.email || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(data.email);
    } catch {
      /* ignore */
    }
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
        maxHeight="85vh"
        overflow="scroll"
        borderTopWidth={1}
        borderTopColor="$gray6"
      >
        <YStack height={4} width={44} bg="$gray6" rounded="$10" self="center" />
        <Button
          size="$2"
          circular
          alignSelf="flex-end"
          icon={X}
          onPress={() => onOpenChange(false)}
        />

        {isLoading && (
          <YStack py="$6" items="center">
            <Spinner />
          </YStack>
        )}

        {isError && (
          <SizableText color="$red10" size="$3">
            {error instanceof Error ? error.message : "Could not load profile"}
          </SizableText>
        )}

        {data && !isLoading && (
          <YStack gap="$4">
            <YStack gap="$1">
              <SizableText size="$6" fontWeight="800" color="$color12">
                {data.name}
              </SizableText>
              <SizableText size="$2" color="$gray10">
                Study group member
              </SizableText>
            </YStack>

            <YStack gap="$2">
              <SizableText size="$2" fontWeight="600" color="$color11">
                Contact email
              </SizableText>
              <SizableText
                size="$3"
                color="$color12"
                style={{ userSelect: "text" }}
              >
                {data.email}
              </SizableText>
              <YStack gap="$2" $sm={{ flexDirection: "row" }} flexWrap="wrap">
                <Button
                  size="$3"
                  theme="purple"
                  icon={Mail}
                  onPress={() => {
                    window.location.href = `mailto:${data.email}`;
                  }}
                >
                  Open in email
                </Button>
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => void copyEmail()}
                >
                  Copy email
                </Button>
              </YStack>
            </YStack>

            {!isSelf ? (
              <Button
                width="100%"
                theme="purple"
                icon={MessageCircle}
                onPress={() => {
                  onOpenChange(false);
                  window.location.assign(`/messages/${data.id}`);
                }}
              >
                Message in DueDeck
              </Button>
            ) : (
              <SizableText size="$2" color="$gray9">
                This is you — say hi to others from the member list above.
              </SizableText>
            )}
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
