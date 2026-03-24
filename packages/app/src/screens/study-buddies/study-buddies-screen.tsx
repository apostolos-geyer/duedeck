"use client";

import {
  BrutalistListItem,
  Button,
  H4,
  Paragraph,
  Separator,
  SizableText,
  Spinner,
  Theme,
  XStack,
  YStack,
} from "@repo/ui";
import { AppCard } from "@repo/ui";
import { ChevronRight, MessageCircle, Users } from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useCurrentUser } from "../../hooks/use-settings";
import {
  useBrowseCourses,
  useDeleteStudyGroup,
  useEnsureClassChat,
  useJoinStudyGroup,
  useLeaveStudyGroup,
  useMyClassChats,
  useMyCustomStudyGroups,
  useSchools,
  useStudyGroups,
} from "../../hooks/use-study-buddies";
import { CreateCustomGroupSheet } from "./create-custom-group-sheet";
import { CourseListCard } from "./course-list-card";
import { GroupCard } from "./group-card";
import { SchoolCard } from "./school-card";

export interface StudyBuddiesScreenProps {
  initialSectionId?: string;
  initialGroupId?: string;
  onNavigateToChat?: (groupId: string) => void;
}

type Level = "schools" | "courses" | "groups";

interface DrillState {
  level: Level;
  selectedSchool?: { id: string; name: string; shortName: string };
  selectedCourse?: { id: string; code: string; name: string };
  selectedGroupId?: string;
}

export function StudyBuddiesScreen({
  initialSectionId,
  initialGroupId,
  onNavigateToChat,
}: StudyBuddiesScreenProps = {}) {
  const [drillState, setDrillState] = useState<DrillState>({ level: "schools" });
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: viewer } = useCurrentUser();
  const { data: myClasses, isLoading: classesLoading } = useMyClassChats();
  const { data: myCustomRows, isLoading: customLoading } = useMyCustomStudyGroups();
  const ensureClassChat = useEnsureClassChat();
  const leaveGroup = useLeaveStudyGroup();
  const deleteGroup = useDeleteStudyGroup();

  const handledInitialRef = useRef<string | null>(null);

  // Deep-link: if initialSectionId is provided, ensure class chat and navigate
  useEffect(() => {
    if (!initialSectionId) return;
    if (handledInitialRef.current === initialSectionId) return;
    handledInitialRef.current = initialSectionId;
    ensureClassChat.mutate(
      { sectionId: initialSectionId },
      {
        onSuccess: (g) => {
          onNavigateToChat?.(g.id);
        },
      },
    );
  }, [initialSectionId, ensureClassChat.mutate, onNavigateToChat]);

  // Deep-link: if initialGroupId, navigate directly
  useEffect(() => {
    if (!initialGroupId) return;
    if (handledInitialRef.current === initialGroupId) return;
    handledInitialRef.current = initialGroupId;
    onNavigateToChat?.(initialGroupId);
  }, [initialGroupId, onNavigateToChat]);

  function handleOpenClassChat(sectionId: string) {
    const row = myClasses?.find((r) => r.sectionId === sectionId);
    if (row?.classChat) {
      onNavigateToChat?.(row.classChat.id);
      return;
    }
    ensureClassChat.mutate(
      { sectionId },
      {
        onSuccess: (g) => {
          onNavigateToChat?.(g.id);
          void queryClient.invalidateQueries();
        },
      },
    );
  }

  return (
    <YStack gap="$4" maxW="$container.full" width="100%" p="$3" self="center">
      {/* Create group sheet */}
      <CreateCustomGroupSheet
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onCreated={(g) => {
          onNavigateToChat?.(g.id);
          void queryClient.invalidateQueries();
        }}
      />

      {/* New study group button */}
      <Button theme="purple" onPress={() => setCreateGroupOpen(true)}>
        New study group
      </Button>

      {/* Class Chats */}
      <YStack gap="$2">
        <H4 fontFamily="$heading" color="$color12">
          Class Chats
        </H4>
        {classesLoading ? (
          <YStack py="$4" items="center"><Spinner size="small" /></YStack>
        ) : (myClasses ?? []).length === 0 ? (
          <Paragraph size="$3" color="$gray9">
            Enroll in a course to see its class chat here.
          </Paragraph>
        ) : (
          <YStack gap="$1">
            {(myClasses ?? []).map((row) => (
              <BrutalistListItem
                key={row.sectionId}
                rounded={0}
                hoverStyle={{ bg: "$gray3" }}
                pressStyle={{ bg: "$gray4" }}
                cursor="pointer"
                onPress={() => handleOpenClassChat(row.sectionId)}
                disabled={ensureClassChat.isPending}
                icon={<MessageCircle size={18} color="$gray10" />}
                title={`${row.courseCode} · Sec ${row.sectionCode}`}
                subTitle={`${row.schoolShortName} · ${row.term}${row.classChat ? ` · ${row.classChat.members.length} in chat` : ""}`}
                iconAfter={<ChevronRight size={16} color="$gray8" />}
              />
            ))}
          </YStack>
        )}
      </YStack>

      <Separator />

      {/* Study Groups */}
      <YStack gap="$2">
        <H4 fontFamily="$heading" color="$color12">
          Study Groups
        </H4>
        <Paragraph size="$2" color="$gray10">
          Smaller groups you create or join.
        </Paragraph>
        {customLoading ? (
          <YStack py="$4" items="center"><Spinner size="small" /></YStack>
        ) : (myCustomRows ?? []).length === 0 ? (
          <Paragraph size="$3" color="$gray9">
            You're not in any study groups yet.
          </Paragraph>
        ) : (
          <YStack gap="$1">
            {(myCustomRows ?? []).map(({ group: g }) => {
              const isOwner = viewer?.id && g.createdById === viewer.id;
              const leavePending = leaveGroup.isPending && leaveGroup.variables?.groupId === g.id;
              const deletePending = deleteGroup.isPending && deleteGroup.variables?.groupId === g.id;

              return (
                <YStack key={g.id}>
                  <BrutalistListItem
                    rounded={0}
                    hoverStyle={{ bg: "$gray3" }}
                    pressStyle={{ bg: "$gray4" }}
                    cursor="pointer"
                    onPress={() => onNavigateToChat?.(g.id)}
                    icon={<Users size={18} color="$gray10" />}
                    title={g.name}
                    subTitle={`${g.course.code} · ${g.course.school.shortName} · ${g.members.length} members`}
                    iconAfter={
                      <XStack gap="$2" items="center">
                        {isOwner ? (
                          <Button
                            size="$2"
                            variant="outlined"
                            onPress={(e) => {
                              e.stopPropagation();
                              setConfirmingDelete(confirmingDelete === g.id ? null : g.id);
                            }}
                          >
                            <SizableText size="$1" color="$red10">Delete</SizableText>
                          </Button>
                        ) : (
                          <Button
                            size="$2"
                            variant="outlined"
                            disabled={leavePending}
                            onPress={(e) => {
                              e.stopPropagation();
                              leaveGroup.mutate(
                                { groupId: g.id },
                                { onSuccess: () => void queryClient.invalidateQueries() },
                              );
                            }}
                          >
                            {leavePending ? "Leaving…" : "Leave"}
                          </Button>
                        )}
                        <ChevronRight size={16} color="$gray8" />
                      </XStack>
                    }
                  />
                  {confirmingDelete === g.id && (
                    <AppCard variant="accent" size="sm" bg="$red2" borderColor="$red7" m="$2">
                      <Paragraph size="$2" color="$red11" fontWeight="600">
                        Delete "{g.name}" permanently? All messages and members are removed.
                      </Paragraph>
                      <XStack gap="$2" mt="$2">
                        <Button size="$2" variant="outlined" onPress={() => setConfirmingDelete(null)}>
                          Cancel
                        </Button>
                        <Theme name="red">
                          <Button
                            size="$2"
                            disabled={deletePending}
                            onPress={() => {
                              deleteGroup.mutate(
                                { groupId: g.id },
                                {
                                  onSuccess: () => {
                                    setConfirmingDelete(null);
                                    void queryClient.invalidateQueries();
                                  },
                                },
                              );
                            }}
                          >
                            {deletePending ? "Deleting…" : "Yes, delete"}
                          </Button>
                        </Theme>
                      </XStack>
                    </AppCard>
                  )}
                </YStack>
              );
            })}
          </YStack>
        )}
      </YStack>

      <Separator />

      {/* Browse */}
      <YStack gap="$3">
        <H4 fontFamily="$heading" color="$color12">
          Browse
        </H4>
        <Paragraph size="$2" color="$gray10">
          Find and join study groups at your school.
        </Paragraph>
        <BrowseSection
          state={drillState}
          onNavigate={(level) => {
            if (level === "schools") setDrillState({ level: "schools" });
            else if (level === "courses") setDrillState((s) => ({ level: "courses", selectedSchool: s.selectedSchool }));
          }}
          onSelectSchool={(school) => setDrillState({ level: "courses", selectedSchool: school })}
          onSelectCourse={(course) => setDrillState((s) => ({ ...s, level: "groups", selectedCourse: course }))}
          onSelectGroup={(groupId) => onNavigateToChat?.(groupId)}
          onJoinedGroup={(groupId) => {
            onNavigateToChat?.(groupId);
            void queryClient.invalidateQueries();
          }}
        />
      </YStack>
    </YStack>
  );
}

/* ── Browse sub-section ── */

function BrowseSection({
  state,
  onNavigate,
  onSelectSchool,
  onSelectCourse,
  onSelectGroup,
  onJoinedGroup,
}: {
  state: DrillState;
  onNavigate: (level: Level) => void;
  onSelectSchool: (s: { id: string; name: string; shortName: string }) => void;
  onSelectCourse: (c: { id: string; code: string; name: string }) => void;
  onSelectGroup: (groupId: string) => void;
  onJoinedGroup: (groupId: string) => void;
}) {
  const { data: schools, isLoading: schoolsLoading } = useSchools();

  if (state.level === "schools") {
    if (schoolsLoading) return <YStack py="$4" items="center"><Spinner size="small" /></YStack>;
    return (
      <YStack gap="$2">
        {(schools ?? []).map((school) => (
          <SchoolCard key={school.id} school={school} onPress={() => onSelectSchool(school)} />
        ))}
      </YStack>
    );
  }

  if (state.level === "courses" && state.selectedSchool) {
    return (
      <YStack gap="$2">
        <Breadcrumb items={[
          { label: "Schools", onPress: () => onNavigate("schools") },
          { label: state.selectedSchool.shortName },
        ]} />
        <CoursesList schoolId={state.selectedSchool.id} onSelect={onSelectCourse} />
      </YStack>
    );
  }

  if (state.level === "groups" && state.selectedCourse && state.selectedSchool) {
    return (
      <YStack gap="$2">
        <Breadcrumb items={[
          { label: "Schools", onPress: () => onNavigate("schools") },
          { label: state.selectedSchool.shortName, onPress: () => onNavigate("courses") },
          { label: state.selectedCourse.code },
        ]} />
        <BrowseGroupsList
          courseId={state.selectedCourse.id}
          onSelectGroup={onSelectGroup}
          onJoinedGroup={onJoinedGroup}
        />
      </YStack>
    );
  }

  return null;
}

function Breadcrumb({ items }: { items: Array<{ label: string; onPress?: () => void }> }) {
  return (
    <XStack items="center" gap="$1" mb="$1">
      {items.map((item, i) => (
        <XStack key={item.label} items="center" gap="$1">
          {i > 0 && <ChevronRight size={14} color="$gray8" />}
          <SizableText
            size="$2"
            color={item.onPress ? "$purple9" : "$color12"}
            fontWeight={item.onPress ? "500" : "700"}
            cursor={item.onPress ? "pointer" : undefined}
            onPress={item.onPress}
            hoverStyle={item.onPress ? { opacity: 0.7 } : undefined}
          >
            {item.label}
          </SizableText>
        </XStack>
      ))}
    </XStack>
  );
}

function CoursesList({ schoolId, onSelect }: { schoolId: string; onSelect: (c: { id: string; code: string; name: string }) => void }) {
  const { data: courses, isLoading } = useBrowseCourses(schoolId);
  if (isLoading) return <YStack py="$4" items="center"><Spinner size="small" /></YStack>;
  return (
    <YStack gap="$1">
      {(courses ?? []).map((course) => (
        <CourseListCard key={course.id} course={course} onPress={() => onSelect(course)} />
      ))}
    </YStack>
  );
}

function BrowseGroupsList({
  courseId,
  onSelectGroup,
  onJoinedGroup,
}: {
  courseId: string;
  onSelectGroup: (groupId: string) => void;
  onJoinedGroup: (groupId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { data: viewer } = useCurrentUser();
  const { data: groups, isLoading } = useStudyGroups(courseId);
  const joinGroup = useJoinStudyGroup();
  const [joiningId, setJoiningId] = useState<string | null>(null);

  if (isLoading) return <YStack py="$4" items="center"><Spinner size="small" /></YStack>;

  return (
    <YStack gap="$1">
      {(groups ?? []).map((group) => {
        const isMember = viewer?.id && group.members.some((m) => m.userId === viewer.id);
        return (
          <GroupCard
            key={group.id}
            group={group}
            selected={false}
            isMember={!!isMember}
            joinPending={joiningId === group.id}
            onOpen={() => onSelectGroup(group.id)}
            onJoin={() => {
              setJoiningId(group.id);
              joinGroup.mutate(
                { groupId: group.id },
                {
                  onSettled: () => {
                    setJoiningId(null);
                    void queryClient.invalidateQueries();
                  },
                  onSuccess: () => onJoinedGroup(group.id),
                },
              );
            }}
          />
        );
      })}
    </YStack>
  );
}
