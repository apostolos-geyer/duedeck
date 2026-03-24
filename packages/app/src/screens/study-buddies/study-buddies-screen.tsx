"use client";

import {
  Button,
  H3,
  SizableText,
  Spinner,
  XStack,
  YStack,
} from "@repo/ui";
import { ChevronRight } from "@tamagui/lucide-icons";
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
  useRemoveStudyGroupMember,
  useSchools,
  useStudyGroups,
} from "../../hooks/use-study-buddies";
import { CourseListCard } from "./course-list-card";
import { CreateCustomGroupSheet } from "./create-custom-group-sheet";
import { GroupCard } from "./group-card";
import { GroupChat } from "./group-chat";
import { InviteClassToStudyGroupSheet } from "./invite-class-to-study-group-sheet";
import { MemberList } from "./member-list";
import { SchoolCard } from "./school-card";
import { StudyGroupSettingsSheet } from "./study-group-settings-sheet";

type Level = "schools" | "courses" | "groups";

interface SchoolInfo {
  id: string;
  name: string;
  shortName: string;
}

interface CourseInfo {
  id: string;
  code: string;
  name: string;
}

type FocusedStudyGroup = {
  id: string;
  name: string;
  courseId: string;
  /** `null` = custom study group; set = this row is the section’s class chat. */
  sectionId: string | null;
  isPublic: boolean;
  maxMembers: number;
  createdById: string | null;
  members: Array<{
    userId: string;
    user: { name: string; image: string | null };
  }>;
};

interface DrillState {
  level: Level;
  selectedSchool?: SchoolInfo;
  selectedCourse?: CourseInfo;
  selectedGroupId?: string;
}

function toFocusedGroup(g: {
  id: string;
  name: string;
  courseId: string;
  sectionId: string | null;
  isPublic: boolean;
  maxMembers: number;
  createdById: string | null;
  members: FocusedStudyGroup["members"];
}): FocusedStudyGroup {
  return {
    id: g.id,
    name: g.name,
    courseId: g.courseId,
    sectionId: g.sectionId,
    isPublic: g.isPublic,
    maxMembers: g.maxMembers,
    createdById: g.createdById,
    members: g.members,
  };
}

function Breadcrumb({
  state,
  onNavigate,
}: {
  state: DrillState;
  onNavigate: (level: Level) => void;
}) {
  return (
    <XStack items="center" gap="$1" mb="$2">
      <SizableText
        size="$2"
        color={state.level === "schools" ? "$color12" : "$purple9"}
        fontWeight={state.level === "schools" ? "700" : "500"}
        cursor={state.level !== "schools" ? "pointer" : undefined}
        onPress={() => onNavigate("schools")}
        hoverStyle={state.level !== "schools" ? { opacity: 0.7 } : undefined}
      >
        Schools
      </SizableText>

      {state.selectedSchool && (
        <>
          <ChevronRight size={14} color="$gray8" />
          <SizableText
            size="$2"
            color={state.level === "courses" ? "$color12" : "$purple9"}
            fontWeight={state.level === "courses" ? "700" : "500"}
            cursor={state.level === "groups" ? "pointer" : undefined}
            onPress={() => onNavigate("courses")}
            hoverStyle={state.level === "groups" ? { opacity: 0.7 } : undefined}
          >
            {state.selectedSchool.shortName}
          </SizableText>
        </>
      )}

      {state.selectedCourse && state.level === "groups" && (
        <>
          <ChevronRight size={14} color="$gray8" />
          <SizableText size="$2" color="$color12" fontWeight="700">
            {state.selectedCourse.code}
          </SizableText>
        </>
      )}
    </XStack>
  );
}

function SchoolsList({ onSelect }: { onSelect: (school: SchoolInfo) => void }) {
  const { data: schools, isLoading } = useSchools();

  if (isLoading) {
    return (
      <YStack items="center" py="$6">
        <Spinner size="small" />
      </YStack>
    );
  }

  return (
    <YStack
      gap="$3"
      $sm={{ flexDirection: "row", gap: "$4", flexWrap: "wrap" }}
    >
      {(schools ?? []).map((school) => (
        <SchoolCard
          key={school.id}
          school={school}
          onPress={() => onSelect(school)}
        />
      ))}
    </YStack>
  );
}

function CoursesList({
  schoolId,
  schoolName,
  onSelect,
}: {
  schoolId: string;
  schoolName: string;
  onSelect: (course: CourseInfo) => void;
}) {
  const { data: courses, isLoading } = useBrowseCourses(schoolId);

  if (isLoading) {
    return (
      <YStack items="center" py="$6">
        <Spinner size="small" />
      </YStack>
    );
  }

  return (
    <YStack gap="$3">
      <SizableText size="$4" color="$gray10">
        Courses at {schoolName}
      </SizableText>
      {(courses ?? []).map((course) => (
        <CourseListCard
          key={course.id}
          course={course}
          onPress={() => onSelect(course)}
        />
      ))}
    </YStack>
  );
}

function GroupsList({
  courseId,
  courseCode,
  selectedGroupId,
  onSelectGroup,
  onRemovedFromSelectedGroup,
}: {
  courseId: string;
  courseCode: string;
  selectedGroupId?: string;
  onSelectGroup: (groupId: string) => void;
  /** Current user was removed from the open group while browsing (e.g. kicked). */
  onRemovedFromSelectedGroup?: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: browseViewer } = useCurrentUser();
  const { data: groups, isLoading } = useStudyGroups(courseId);
  const joinStudyGroup = useJoinStudyGroup();
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <YStack items="center" py="$6">
        <Spinner size="small" />
      </YStack>
    );
  }

  const selectedGroup = (groups ?? []).find((g) => g.id === selectedGroupId);
  const viewerId = browseViewer?.id;

  return (
    <YStack gap="$4" flex={1} $md={{ flexDirection: "row", gap: "$5" }}>
      <YStack flex={1} minW={0} $md={{ minW: 280 }} gap="$3">
        <SizableText size="$3" color="$gray10">
          Study groups for {courseCode}
        </SizableText>
        {(groups ?? []).map((group) => {
          const isMember = Boolean(
            viewerId && group.members.some((m) => m.userId === viewerId),
          );
          return (
            <GroupCard
              key={group.id}
              group={group}
              selected={group.id === selectedGroupId}
              isMember={isMember}
              joinPending={joiningGroupId === group.id}
              onOpen={() => onSelectGroup(group.id)}
              onJoin={() => {
                setJoiningGroupId(group.id);
                joinStudyGroup.mutate(
                  { groupId: group.id },
                  {
                    onSettled: () => {
                      setJoiningGroupId(null);
                      void queryClient.invalidateQueries();
                    },
                    onSuccess: () => {
                      onSelectGroup(group.id);
                    },
                  },
                );
              }}
            />
          );
        })}
      </YStack>

      {selectedGroupId && selectedGroup && (
        <YStack flex={2} gap="$0">
          <MemberList
            members={selectedGroup.members}
            createdById={selectedGroup.createdById}
            viewerId={browseViewer?.id}
          />
          <GroupChat
            groupId={selectedGroupId}
            onRemovedFromGroup={() => {
              onRemovedFromSelectedGroup?.();
              void queryClient.invalidateQueries();
            }}
          />
        </YStack>
      )}
    </YStack>
  );
}

export interface StudyBuddiesScreenProps {
  /** Deep-link from course page: opens the section class chat after load. */
  initialSectionId?: string;
}

export function StudyBuddiesScreen({
  initialSectionId,
}: StudyBuddiesScreenProps = {}) {
  const [state, setState] = useState<DrillState>({ level: "schools" });
  const [focusedGroup, setFocusedGroup] = useState<FocusedStudyGroup | null>(
    null,
  );
  const [browseOpen, setBrowseOpen] = useState(false);
  const [createCustomGroupOpen, setCreateCustomGroupOpen] = useState(false);
  const [inviteFromClassOpen, setInviteFromClassOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [confirmingDeleteListGroupId, setConfirmingDeleteListGroupId] =
    useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: viewer } = useCurrentUser();
  const removeMember = useRemoveStudyGroupMember();
  const leaveStudyGroup = useLeaveStudyGroup();
  const deleteStudyGroup = useDeleteStudyGroup();
  const { data: myClasses, isLoading: myClassesLoading } = useMyClassChats();
  const { data: myCustomRows, isLoading: myCustomLoading } =
    useMyCustomStudyGroups();
  const ensureClassChat = useEnsureClassChat();
  const handledInitialSectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialSectionId) {
      handledInitialSectionRef.current = null;
      return;
    }
    if (handledInitialSectionRef.current === initialSectionId) return;
    handledInitialSectionRef.current = initialSectionId;
    ensureClassChat.mutate(
      { sectionId: initialSectionId },
      {
        onSuccess: (g) => setFocusedGroup(toFocusedGroup(g)),
      },
    );
  }, [initialSectionId, ensureClassChat.mutate]);

  function handleOpenClassChat(sectionId: string) {
    const row = myClasses?.find((r) => r.sectionId === sectionId);
    if (row?.classChat) {
      setFocusedGroup(toFocusedGroup(row.classChat));
      return;
    }
    ensureClassChat.mutate(
      { sectionId },
      {
        onSuccess: (g) => {
          setFocusedGroup(toFocusedGroup(g));
          void queryClient.invalidateQueries();
        },
      },
    );
  }

  function handleSelectSchool(school: SchoolInfo) {
    setState({ level: "courses", selectedSchool: school });
  }

  function handleSelectCourse(course: CourseInfo) {
    setState((prev) => ({
      ...prev,
      level: "groups",
      selectedCourse: course,
    }));
  }

  function handleNavigate(level: Level) {
    if (level === "schools") {
      setState({ level: "schools" });
    } else if (level === "courses") {
      setState((prev) => ({
        level: "courses",
        selectedSchool: prev.selectedSchool,
      }));
    }
  }

  if (focusedGroup) {
    const isCustomStudyGroup = focusedGroup.sectionId === null;
    /** Visibility, capacity, kicks, and settings apply only to custom study groups — never class chats. */
    const canManageCustomStudyGroup =
      isCustomStudyGroup &&
      viewer &&
      (focusedGroup.createdById === null ||
        focusedGroup.createdById === viewer.id);

    return (
      <YStack gap="$4" maxW="$container.full" width="100%" height="100%">
        <XStack items="center" gap="$3" flexWrap="wrap">
          <Button
            size="$3"
            variant="outlined"
            onPress={() => setFocusedGroup(null)}
          >
            Back
          </Button>
          <SizableText size="$4" fontWeight="800" color="$color12">
            {focusedGroup.name}
          </SizableText>
          {isCustomStudyGroup && !focusedGroup.isPublic ? (
            <SizableText size="$2" color="$gray9" fontWeight="600">
              Private
            </SizableText>
          ) : null}
          {focusedGroup.sectionId !== null ? (
            <Button
              size="$3"
              theme="purple"
              variant="outlined"
              onPress={() => setInviteFromClassOpen(true)}
            >
              Invite to study group
            </Button>
          ) : null}
          {canManageCustomStudyGroup ? (
            <Button
              size="$3"
              variant="outlined"
              onPress={() => setGroupSettingsOpen(true)}
            >
              Study group settings
            </Button>
          ) : null}
        </XStack>
        <MemberList
          members={focusedGroup.members}
          createdById={focusedGroup.createdById}
          viewerId={viewer?.id}
          canKick={canManageCustomStudyGroup}
          onKickMember={(userId) => {
            removeMember.mutate(
              { groupId: focusedGroup.id, userId },
              {
                onSuccess: () => {
                  void queryClient.invalidateQueries();
                  setFocusedGroup((prev) =>
                    prev
                      ? {
                          ...prev,
                          members: prev.members.filter(
                            (m) => m.userId !== userId,
                          ),
                        }
                      : prev,
                  );
                },
              },
            );
          }}
          kickPending={removeMember.isPending}
        />
        <YStack flex={1} minH={320} bg="$gray2" rounded="$4" overflow="hidden">
          <GroupChat
            groupId={focusedGroup.id}
            onRemovedFromGroup={() => {
              setFocusedGroup(null);
              void queryClient.invalidateQueries();
            }}
          />
        </YStack>

        {focusedGroup.sectionId !== null ? (
          <InviteClassToStudyGroupSheet
            open={inviteFromClassOpen}
            onOpenChange={setInviteFromClassOpen}
            sectionId={focusedGroup.sectionId}
            courseId={focusedGroup.courseId}
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
            createdById={focusedGroup.createdById}
            group={{
              id: focusedGroup.id,
              name: focusedGroup.name,
              maxMembers: focusedGroup.maxMembers,
              isPublic: focusedGroup.isPublic,
              members: focusedGroup.members,
            }}
            onSaved={(g) => setFocusedGroup(toFocusedGroup(g))}
            onDeleted={() => {
              setFocusedGroup(null);
              void queryClient.invalidateQueries();
            }}
          />
        ) : null}
      </YStack>
    );
  }

  return (
    <YStack gap="$4" maxW="$container.full" width="100%" height="100%">
      <H3 fontWeight="800" color="$color12">
        Study Buddies
      </H3>

      <SizableText size="$3" color="$gray10">
        Each class you’re enrolled in has one shared group chat with everyone in
        that section.
      </SizableText>

      <YStack gap="$2">
        <SizableText size="$4" fontWeight="700" color="$color12">
          Your class chats
        </SizableText>
        {myClassesLoading ? (
          <YStack items="center" py="$4">
            <Spinner size="small" />
          </YStack>
        ) : (myClasses ?? []).length === 0 ? (
          <SizableText size="$3" color="$gray9">
            Enroll in a course to see its class chat here.
          </SizableText>
        ) : (
          <YStack gap="$2">
            {(myClasses ?? []).map((row) => (
              <Button
                key={row.sectionId}
                size="$4"
                theme="purple"
                justify="flex-start"
                onPress={() => handleOpenClassChat(row.sectionId)}
                disabled={ensureClassChat.isPending}
              >
                <YStack items="flex-start" gap="$1">
                  <SizableText fontWeight="700" color="$color12">
                    {row.courseCode} · {row.term} · Sec {row.sectionCode}
                  </SizableText>
                  <SizableText size="$2" color="$gray10">
                    {row.schoolShortName} · {row.courseName}
                    {row.classChat
                      ? ` · ${row.classChat._count?.members ?? row.classChat.members.length} in chat`
                      : ""}
                  </SizableText>
                </YStack>
              </Button>
            ))}
          </YStack>
        )}
      </YStack>

      <YStack gap="$2">
        <SizableText size="$4" fontWeight="700" color="$color12">
          Your study groups
        </SizableText>
        <SizableText size="$2" color="$gray10">
          Smaller groups you create or join — not the same as your section’s
          class chat.
        </SizableText>
        {myCustomLoading ? (
          <YStack items="center" py="$4">
            <Spinner size="small" />
          </YStack>
        ) : (myCustomRows ?? []).length === 0 ? (
          <SizableText size="$3" color="$gray9">
            You’re not in any study groups yet. Create one for a course you’re
            enrolled in.
          </SizableText>
        ) : (
          <YStack gap="$2">
            {(myCustomRows ?? []).map(({ group: g }) => {
              const isOwner =
                Boolean(viewer?.id) &&
                Boolean(g.createdById) &&
                g.createdById === viewer?.id;
              const leavePending =
                leaveStudyGroup.isPending &&
                leaveStudyGroup.variables?.groupId === g.id;
              const deletePending =
                deleteStudyGroup.isPending &&
                deleteStudyGroup.variables?.groupId === g.id;

              return (
                <YStack key={g.id} gap="$2">
                  <XStack gap="$2" items="stretch" flexWrap="wrap">
                    <Button
                      flex={1}
                      minW={200}
                      size="$4"
                      variant="outlined"
                      justify="flex-start"
                      onPress={() => setFocusedGroup(toFocusedGroup(g))}
                    >
                      <YStack items="flex-start" gap="$1">
                        <SizableText fontWeight="700" color="$color12">
                          {g.name}
                        </SizableText>
                        <SizableText size="$2" color="$gray10">
                          {g.course.code} · {g.course.school.shortName} ·{" "}
                          {g._count?.members ?? g.members.length} members
                        </SizableText>
                      </YStack>
                    </Button>
                    {isOwner ? (
                      <Button
                        size="$3"
                        variant="outlined"
                        borderColor="$red8"
                        color="$red10"
                        alignSelf="center"
                        disabled={deletePending}
                        onPress={() =>
                          setConfirmingDeleteListGroupId((cur) =>
                            cur === g.id ? null : g.id,
                          )
                        }
                      >
                        Delete
                      </Button>
                    ) : (
                      <Button
                        size="$3"
                        variant="outlined"
                        alignSelf="center"
                        disabled={leavePending}
                        onPress={() => {
                          leaveStudyGroup.mutate(
                            { groupId: g.id },
                            {
                              onSuccess: () => {
                                if (focusedGroup?.id === g.id) {
                                  setFocusedGroup(null);
                                }
                                void queryClient.invalidateQueries();
                              },
                            },
                          );
                        }}
                      >
                        {leavePending ? "Leaving…" : "Leave"}
                      </Button>
                    )}
                  </XStack>
                  {confirmingDeleteListGroupId === g.id ? (
                    <YStack
                      gap="$2"
                      p="$3"
                      bg="$red2"
                      rounded="$3"
                      borderWidth={1}
                      borderColor="$red7"
                    >
                      <SizableText size="$2" color="$red11" fontWeight="600">
                        Delete “{g.name}” permanently? All messages and members
                        are removed. This cannot be undone.
                      </SizableText>
                      <XStack gap="$2" flexWrap="wrap">
                        <Button
                          size="$3"
                          variant="outlined"
                          disabled={deletePending}
                          onPress={() => setConfirmingDeleteListGroupId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="$3"
                          bg="$red9"
                          color="white"
                          disabled={deletePending}
                          onPress={() => {
                            deleteStudyGroup.mutate(
                              { groupId: g.id },
                              {
                                onSuccess: () => {
                                  setConfirmingDeleteListGroupId(null);
                                  if (focusedGroup?.id === g.id) {
                                    setFocusedGroup(null);
                                  }
                                  void queryClient.invalidateQueries();
                                },
                              },
                            );
                          }}
                        >
                          {deletePending ? "Deleting…" : "Yes, delete group"}
                        </Button>
                      </XStack>
                    </YStack>
                  ) : null}
                </YStack>
              );
            })}
          </YStack>
        )}
        <Button
          size="$3"
          theme="purple"
          onPress={() => setCreateCustomGroupOpen(true)}
        >
          New study group
        </Button>
      </YStack>

      <CreateCustomGroupSheet
        open={createCustomGroupOpen}
        onOpenChange={setCreateCustomGroupOpen}
        onCreated={(g) => {
          setFocusedGroup(toFocusedGroup(g));
          void queryClient.invalidateQueries();
        }}
      />

      <YStack gap="$2">
        <Button
          size="$3"
          variant="outlined"
          onPress={() => setBrowseOpen((o) => !o)}
        >
          {/* suppressHydrationWarning: dev can briefly serve an older SSR chunk than the client HMR bundle. */}
          <SizableText size="$3" suppressHydrationWarning>
            {browseOpen ? "Hide" : "Show"} schools
          </SizableText>
        </Button>

        {browseOpen && (
          <YStack gap="$4" pt="$2">
            {state.level !== "schools" && (
              <Breadcrumb state={state} onNavigate={handleNavigate} />
            )}

            {state.level === "schools" && (
              <SchoolsList onSelect={handleSelectSchool} />
            )}

            {state.level === "courses" && state.selectedSchool && (
              <CoursesList
                schoolId={state.selectedSchool.id}
                schoolName={state.selectedSchool.name}
                onSelect={handleSelectCourse}
              />
            )}

            {state.level === "groups" && state.selectedCourse && (
              <GroupsList
                courseId={state.selectedCourse.id}
                courseCode={state.selectedCourse.code}
                selectedGroupId={state.selectedGroupId}
                onSelectGroup={(groupId) =>
                  setState((prev) => ({ ...prev, selectedGroupId: groupId }))
                }
                onRemovedFromSelectedGroup={() =>
                  setState((prev) => ({ ...prev, selectedGroupId: undefined }))
                }
              />
            )}
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
