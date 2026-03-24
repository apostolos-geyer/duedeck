"use client";

import { Button, Input, SizableText, Spinner, XStack, YStack } from "@repo/ui";
import { ArrowLeft, X } from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  useCreateStudyGroup,
  useEnrolledSectionsForStudy,
} from "../../hooks/use-study-buddies";

type CourseOption = { id: string; code: string; name: string };

function uniqueCoursesFromEnrollments(
  sections: Array<{ course: { id: string; code: string; name: string } }>,
): CourseOption[] {
  const map = new Map<string, CourseOption>();
  for (const s of sections) {
    const c = s.course;
    if (!map.has(c.id)) {
      map.set(c.id, { id: c.id, code: c.code, name: c.name });
    }
  }
  return [...map.values()];
}

interface CreateCustomGroupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (group: {
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
}

export function CreateCustomGroupSheet({
  open,
  onOpenChange,
  onCreated,
}: CreateCustomGroupSheetProps) {
  const [step, setStep] = useState<"pick" | "name">("pick");
  const [picked, setPicked] = useState<CourseOption | null>(null);
  const [groupName, setGroupName] = useState("");
  const [maxMembersStr, setMaxMembersStr] = useState("12");
  const [isPublic, setIsPublic] = useState(true);

  const queryClient = useQueryClient();
  const { data: enrolled, isLoading } = useEnrolledSectionsForStudy();
  const createStudyGroup = useCreateStudyGroup();

  const courses = useMemo(
    () => uniqueCoursesFromEnrollments(enrolled ?? []),
    [enrolled],
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
      setStep("pick");
      setPicked(null);
      setGroupName("");
      setMaxMembersStr("12");
      setIsPublic(true);
    }
  }, [open]);

  if (!open) return null;

  function handleCreate() {
    const name = groupName.trim();
    if (!picked || !name) return;
    const maxParsed = Number.parseInt(maxMembersStr, 10);
    const maxMembers = Number.isFinite(maxParsed)
      ? Math.min(250, Math.max(2, maxParsed))
      : 6;
    createStudyGroup.mutate(
      { courseId: picked.id, name, maxMembers, isPublic },
      {
        onSuccess: (g) => {
          void queryClient.invalidateQueries();
          onOpenChange(false);
          onCreated?.({
            id: g.id,
            name: g.name,
            courseId: g.courseId,
            sectionId: g.sectionId,
            isPublic: g.isPublic,
            maxMembers: g.maxMembers,
            createdById: g.createdById,
            members: g.members.map((m) => ({
              userId: m.userId,
              user: {
                name: m.user.name,
                image: m.user.image,
              },
            })),
          });
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
        <XStack justify="space-between" items="center" width="100%">
          {step === "name" ? (
            <Button
              size="$2"
              variant="outlined"
              icon={ArrowLeft}
              onPress={() => {
                setStep("pick");
                setPicked(null);
              }}
            >
              Back
            </Button>
          ) : (
            <XStack width={72} />
          )}
          <Button
            size="$2"
            circular
            icon={X}
            onPress={() => onOpenChange(false)}
          />
        </XStack>

        <SizableText size="$5" fontWeight="800" color="$color12">
          New study group
        </SizableText>
        <SizableText size="$2" color="$gray10">
          Separate from your class chat. Public groups appear in course browse;
          private ones are invite-only.
        </SizableText>

        {isLoading ? (
          <YStack py="$6" items="center">
            <Spinner />
          </YStack>
        ) : step === "pick" ? (
          <YStack gap="$2">
            {courses.length === 0 ? (
              <SizableText size="$3" color="$gray9">
                Enroll in a course first to create a study group for it.
              </SizableText>
            ) : (
              courses.map((c) => (
                <Button
                  key={c.id}
                  size="$4"
                  justify="flex-start"
                  variant="outlined"
                  onPress={() => {
                    setPicked(c);
                    setStep("name");
                  }}
                >
                  <YStack items="flex-start" gap="$1">
                    <SizableText fontWeight="700" color="$color12">
                      {c.code}
                    </SizableText>
                    <SizableText size="$2" color="$gray10">
                      {c.name}
                    </SizableText>
                  </YStack>
                </Button>
              ))
            )}
          </YStack>
        ) : (
          picked && (
            <YStack gap="$3">
              <YStack gap="$1">
                <SizableText size="$2" color="$gray10">
                  Course
                </SizableText>
                <SizableText fontWeight="700" color="$color12">
                  {picked.code} · {picked.name}
                </SizableText>
              </YStack>
              <YStack gap="$2">
                <SizableText size="$2" fontWeight="600" color="$color11">
                  Group name
                </SizableText>
                <Input
                  placeholder="e.g. Exam cram Sunday"
                  value={groupName}
                  onChangeText={setGroupName}
                />
              </YStack>
              <YStack gap="$2">
                <SizableText size="$2" fontWeight="600" color="$color11">
                  Max members
                </SizableText>
                <Input
                  keyboardType="numeric"
                  placeholder="2–250"
                  value={maxMembersStr}
                  onChangeText={setMaxMembersStr}
                />
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
              </YStack>
              <Button
                theme="purple"
                disabled={!groupName.trim() || createStudyGroup.isPending}
                onPress={handleCreate}
              >
                Create study group
              </Button>
            </YStack>
          )
        )}
      </YStack>
    </YStack>
  );
}
