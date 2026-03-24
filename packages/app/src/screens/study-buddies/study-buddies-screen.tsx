"use client";

import {
  Button,
  H4,
  ListItem,
  Paragraph,
  Separator,
  Spinner,
  SizableText,
  Theme,
  XStack,
  YStack,
  useMedia,
} from "@repo/ui";
import { EmptyState } from "@repo/ui";
import { ChevronRight, ArrowLeft, MessageCircle, Users } from "@tamagui/lucide-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
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
  /** `null` = custom study group; set = this row is the section's class chat. */
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
    <YStack gap="$2">
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
    <YStack gap="$2">
      <Paragraph size="$2" color="$gray10">
        Courses at {schoolName}
      </Paragraph>
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
    <YStack gap="$3" flex={1}>
      <Paragraph size="$2" color="$gray10">
        Study groups for {courseCode}
      </Paragraph>
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

/* ─────────────────────────────────────────────────────────── */
/*  Left sidebar panel content (shared between mobile + desk) */
/* ─────────────────────────────────────────────────────────── */

function LeftPanelContent({
  myClasses,
  myClassesLoading,
  myCustomRows,
  myCustomLoading,
  viewer,
  focusedGroup,
  ensureClassChatPending,
  onOpenClassChat,
  onFocusGroup,
  onCreateCustomGroup,
  leaveStudyGroup,
  deleteStudyGroup,
  confirmingDeleteListGroupId,
  setConfirmingDeleteListGroupId,
  queryClient,
  setFocusedGroup,
  // Browse
  drillState,
  onSelectSchool,
  onSelectCourse,
  onNavigate,
  onSelectBrowseGroup,
  onRemovedFromSelectedBrowseGroup,
}: {
  myClasses: any;
  myClassesLoading: boolean;
  myCustomRows: any;
  myCustomLoading: boolean;
  viewer: any;
  focusedGroup: FocusedStudyGroup | null;
  ensureClassChatPending: boolean;
  onOpenClassChat: (sectionId: string) => void;
  onFocusGroup: (g: FocusedStudyGroup) => void;
  onCreateCustomGroup: () => void;
  leaveStudyGroup: any;
  deleteStudyGroup: any;
  confirmingDeleteListGroupId: string | null;
  setConfirmingDeleteListGroupId: (id: string | null) => void;
  queryClient: any;
  setFocusedGroup: (next: FocusedStudyGroup | null | ((prev: FocusedStudyGroup | null) => FocusedStudyGroup | null)) => void;
  drillState: DrillState;
  onSelectSchool: (school: SchoolInfo) => void;
  onSelectCourse: (course: CourseInfo) => void;
  onNavigate: (level: Level) => void;
  onSelectBrowseGroup: (groupId: string) => void;
  onRemovedFromSelectedBrowseGroup: () => void;
}) {
  return (
    <YStack gap="$4" p="$3">
      {/* New study group button */}
      <Button
        size="$3"
        theme="purple"
        onPress={onCreateCustomGroup}
      >
        New study group
      </Button>

      {/* ── Class Chats ── */}
      <YStack gap="$2">
        <H4 fontFamily="$heading" color="$color12">
          Class Chats
        </H4>
        {myClassesLoading ? (
          <YStack items="center" py="$4">
            <Spinner size="small" />
          </YStack>
        ) : (myClasses ?? []).length === 0 ? (
          <Paragraph size="$2" color="$gray9">
            Enroll in a course to see its class chat here.
          </Paragraph>
        ) : (
          <YStack>
            {(myClasses ?? []).map((row: any) => (
              <ListItem
                key={row.sectionId}
                title={`${row.courseCode} · Sec ${row.sectionCode}`}
                subTitle={`${row.schoolShortName} · ${row.term}${row.classChat ? ` · ${row.classChat._count?.members ?? row.classChat.members.length} in chat` : ""}`}
                icon={MessageCircle}
                iconAfter={ChevronRight}
                rounded={0}
                borderWidth={0}
                borderBottomWidth={2}
                borderColor="$gray5"
                hoverStyle={{ bg: "$gray3" }}
                pressStyle={{ bg: "$gray4" }}
                cursor="pointer"
                disabled={ensureClassChatPending}
                bg={focusedGroup?.sectionId === row.sectionId ? "$purple2" : undefined}
                onPress={() => onOpenClassChat(row.sectionId)}
              />
            ))}
          </YStack>
        )}
      </YStack>

      <Separator borderColor="$gray6" />

      {/* ── Study Groups ── */}
      <YStack gap="$2">
        <H4 fontFamily="$heading" color="$color12">
          Study Groups
        </H4>
        <Paragraph size="$2" color="$gray10">
          Smaller groups you create or join.
        </Paragraph>
        {myCustomLoading ? (
          <YStack items="center" py="$4">
            <Spinner size="small" />
          </YStack>
        ) : (myCustomRows ?? []).length === 0 ? (
          <Paragraph size="$2" color="$gray9">
            You're not in any study groups yet.
          </Paragraph>
        ) : (
          <YStack>
            {(myCustomRows ?? []).map(({ group: g }: { group: any }) => {
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
                <YStack key={g.id}>
                  <ListItem
                    title={g.name}
                    subTitle={`${g.course.code} · ${g.course.school.shortName} · ${g._count?.members ?? g.members.length} members`}
                    icon={Users}
                    rounded={0}
                    borderWidth={0}
                    borderBottomWidth={2}
                    borderColor="$gray5"
                    hoverStyle={{ bg: "$gray3" }}
                    pressStyle={{ bg: "$gray4" }}
                    cursor="pointer"
                    bg={focusedGroup?.id === g.id ? "$purple2" : undefined}
                    onPress={() => onFocusGroup(toFocusedGroup(g))}
                    iconAfter={
                      <XStack gap="$2" items="center">
                        {isOwner ? (
                          <Theme name="red">
                            <Button
                              size="$2"
                              variant="outlined"
                              disabled={deletePending}
                              onPress={(e: any) => {
                                e.stopPropagation?.();
                                setConfirmingDeleteListGroupId(
                                  confirmingDeleteListGroupId === g.id ? null : g.id,
                                );
                              }}
                            >
                              Delete
                            </Button>
                          </Theme>
                        ) : (
                          <Button
                            size="$2"
                            variant="outlined"
                            disabled={leavePending}
                            onPress={(e: any) => {
                              e.stopPropagation?.();
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
                            {leavePending ? "Leaving..." : "Leave"}
                          </Button>
                        )}
                      </XStack>
                    }
                  />
                  {confirmingDeleteListGroupId === g.id ? (
                    <YStack
                      gap="$2"
                      p="$3"
                      bg="$red2"
                      rounded={0}
                      borderWidth={2}
                      borderColor="$red7"
                    >
                      <Paragraph size="$2" color="$red11" fontWeight="600">
                        Delete &ldquo;{g.name}&rdquo; permanently? All messages and
                        members are removed. This cannot be undone.
                      </Paragraph>
                      <XStack gap="$2" flexWrap="wrap">
                        <Button
                          size="$3"
                          variant="outlined"
                          disabled={deletePending}
                          onPress={() => setConfirmingDeleteListGroupId(null)}
                        >
                          Cancel
                        </Button>
                        <Theme name="red">
                          <Button
                            size="$3"
                            bg="$red9"
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
                            {deletePending ? "Deleting..." : "Yes, delete group"}
                          </Button>
                        </Theme>
                      </XStack>
                    </YStack>
                  ) : null}
                </YStack>
              );
            })}
          </YStack>
        )}
      </YStack>

      <Separator borderColor="$gray6" />

      {/* ── Browse ── */}
      <YStack gap="$2">
        <H4 fontFamily="$heading" color="$color12">
          Browse
        </H4>

        {drillState.level !== "schools" && (
          <Breadcrumb state={drillState} onNavigate={onNavigate} />
        )}

        {drillState.level === "schools" && (
          <SchoolsList onSelect={onSelectSchool} />
        )}

        {drillState.level === "courses" && drillState.selectedSchool && (
          <CoursesList
            schoolId={drillState.selectedSchool.id}
            schoolName={drillState.selectedSchool.name}
            onSelect={onSelectCourse}
          />
        )}

        {drillState.level === "groups" && drillState.selectedCourse && (
          <GroupsList
            courseId={drillState.selectedCourse.id}
            courseCode={drillState.selectedCourse.code}
            selectedGroupId={drillState.selectedGroupId}
            onSelectGroup={onSelectBrowseGroup}
            onRemovedFromSelectedGroup={onRemovedFromSelectedBrowseGroup}
          />
        )}
      </YStack>
    </YStack>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Right panel: focused group view                       */
/* ─────────────────────────────────────────────────────── */

function RightPanelContent({
  focusedGroup,
  viewer,
  isDesktop,
  setFocusedGroup,
  setInviteFromClassOpen,
  setGroupSettingsOpen,
  removeMember,
  queryClient,
  myClasses,
  inviteFromClassOpen,
  setCreateCustomGroupOpen,
  groupSettingsOpen,
}: {
  focusedGroup: FocusedStudyGroup;
  viewer: any;
  isDesktop: boolean;
  setFocusedGroup: (next: FocusedStudyGroup | null | ((prev: FocusedStudyGroup | null) => FocusedStudyGroup | null)) => void;
  setInviteFromClassOpen: (v: boolean) => void;
  setGroupSettingsOpen: (v: boolean) => void;
  removeMember: any;
  queryClient: any;
  myClasses: any;
  inviteFromClassOpen: boolean;
  setCreateCustomGroupOpen: (v: boolean) => void;
  groupSettingsOpen: boolean;
}) {
  const isCustomStudyGroup = focusedGroup.sectionId === null;
  const canManageCustomStudyGroup =
    isCustomStudyGroup &&
    viewer &&
    (focusedGroup.createdById === null ||
      focusedGroup.createdById === viewer.id);

  return (
    <YStack flex={1} height="100%">
      {/* Header */}
      <YStack gap="$2" p="$3" borderBottomWidth={2} borderColor="$gray5">
        <XStack items="center" gap="$3" flexWrap="wrap">
          {!isDesktop && (
            <Button
              size="$3"
              variant="outlined"
              icon={ArrowLeft}
              onPress={() => setFocusedGroup(null)}
            >
              Back
            </Button>
          )}
          <H4 fontFamily="$heading" color="$color12" flex={1}>
            {focusedGroup.name}
          </H4>
          {isCustomStudyGroup && !focusedGroup.isPublic ? (
            <SizableText size="$2" color="$gray9" fontWeight="600">
              Private
            </SizableText>
          ) : null}
        </XStack>
        <XStack gap="$2" flexWrap="wrap">
          {isCustomStudyGroup ? (
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
              Settings
            </Button>
          ) : null}
        </XStack>
      </YStack>

      {/* Members */}
      <MemberList
        members={focusedGroup.members}
        createdById={focusedGroup.createdById}
        viewerId={viewer?.id}
        canKick={canManageCustomStudyGroup ? true : undefined}
        onKickMember={(userId) => {
          removeMember.mutate(
            { groupId: focusedGroup.id, userId },
            {
              onSuccess: () => {
                void queryClient.invalidateQueries();
                setFocusedGroup((prev: FocusedStudyGroup | null) =>
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

      {/* Chat */}
      <YStack flex={1} minH={320} bg="$gray2" overflow="hidden">
        <GroupChat
          groupId={focusedGroup.id}
          onRemovedFromGroup={() => {
            setFocusedGroup(null);
            void queryClient.invalidateQueries();
          }}
        />
      </YStack>

      {/* Sheets */}
      {(() => {
        const inviteSectionId = focusedGroup.sectionId
          ?? myClasses?.find((r: any) => r.courseId === focusedGroup.courseId)?.sectionId;
        return isCustomStudyGroup && inviteSectionId ? (
          <InviteClassToStudyGroupSheet
            open={inviteFromClassOpen}
            onOpenChange={setInviteFromClassOpen}
            sectionId={inviteSectionId}
            courseId={focusedGroup.courseId}
            onRequestCreateGroup={() => {
              setInviteFromClassOpen(false);
              setCreateCustomGroupOpen(true);
            }}
          />
        ) : null;
      })()}

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

/* ─────────────────────────────────────────────────────── */
/*  Main screen                                           */
/* ─────────────────────────────────────────────────────── */

export interface StudyBuddiesScreenProps {
  /** Deep-link from course page: opens the section class chat after load. */
  initialSectionId?: string;
  /** Deep-link: opens a specific study group chat after load. */
  initialGroupId?: string;
}

export function StudyBuddiesScreen({
  initialSectionId,
  initialGroupId,
}: StudyBuddiesScreenProps = {}) {
  const media = useMedia();
  const isDesktop = media.md; // true when viewport >= 768px

  const [state, setState] = useState<DrillState>({ level: "schools" });
  const [focusedGroup, setFocusedGroupRaw] = useState<FocusedStudyGroup | null>(
    null,
  );

  /** Wrapper that syncs the URL whenever the focused group changes. */
  const setFocusedGroup = useCallback(
    (
      next:
        | FocusedStudyGroup
        | null
        | ((prev: FocusedStudyGroup | null) => FocusedStudyGroup | null),
    ) => {
      setFocusedGroupRaw((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          if (value) {
            url.searchParams.set("groupId", value.id);
            url.searchParams.delete("sectionId");
          } else {
            url.searchParams.delete("groupId");
            url.searchParams.delete("sectionId");
          }
          window.history.replaceState({}, "", url.toString());
        }
        return value;
      });
    },
    [],
  );
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

  // Restore focused group from ?groupId= deep-link
  const handledInitialGroupRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialGroupId || myClassesLoading || myCustomLoading) return;
    if (handledInitialGroupRef.current === initialGroupId) return;
    handledInitialGroupRef.current = initialGroupId;
    // Check class chats
    const classRow = myClasses?.find(
      (r) => r.classChat?.id === initialGroupId,
    );
    if (classRow?.classChat) {
      setFocusedGroup(toFocusedGroup(classRow.classChat));
      return;
    }
    // Check custom groups
    const customRow = myCustomRows?.find(
      (r) => r.group.id === initialGroupId,
    );
    if (customRow) {
      setFocusedGroup(toFocusedGroup(customRow.group));
    }
  }, [initialGroupId, myClasses, myCustomRows, myClassesLoading, myCustomLoading, setFocusedGroup]);

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

  /* shared left-panel props */
  const leftPanelProps = {
    myClasses,
    myClassesLoading,
    myCustomRows,
    myCustomLoading,
    viewer,
    focusedGroup,
    ensureClassChatPending: ensureClassChat.isPending,
    onOpenClassChat: handleOpenClassChat,
    onFocusGroup: (g: FocusedStudyGroup) => setFocusedGroup(g),
    onCreateCustomGroup: () => setCreateCustomGroupOpen(true),
    leaveStudyGroup,
    deleteStudyGroup,
    confirmingDeleteListGroupId,
    setConfirmingDeleteListGroupId,
    queryClient,
    setFocusedGroup,
    drillState: state,
    onSelectSchool: handleSelectSchool,
    onSelectCourse: handleSelectCourse,
    onNavigate: handleNavigate,
    onSelectBrowseGroup: (groupId: string) =>
      setState((prev) => ({ ...prev, selectedGroupId: groupId })),
    onRemovedFromSelectedBrowseGroup: () =>
      setState((prev) => ({ ...prev, selectedGroupId: undefined })),
  };

  /* ─── Desktop: two-column layout ─── */
  if (isDesktop) {
    return (
      <YStack width="100%" height="100%">
        <XStack flex={1} overflow="hidden">
          {/* Left panel */}
          <YStack
            width={300}
            minW={300}
            maxW={300}
            height="100%"
            overflow="scroll"
            borderRightWidth={2}
            borderColor="$gray6"
            bg="$gray1"
          >
            <LeftPanelContent {...leftPanelProps} />
          </YStack>

          {/* Right panel */}
          <YStack flex={1} height="100%" overflow="hidden">
            {focusedGroup ? (
              <RightPanelContent
                focusedGroup={focusedGroup}
                viewer={viewer}
                isDesktop={isDesktop}
                setFocusedGroup={setFocusedGroup}
                setInviteFromClassOpen={setInviteFromClassOpen}
                setGroupSettingsOpen={setGroupSettingsOpen}
                removeMember={removeMember}
                queryClient={queryClient}
                myClasses={myClasses}
                inviteFromClassOpen={inviteFromClassOpen}
                setCreateCustomGroupOpen={setCreateCustomGroupOpen}
                groupSettingsOpen={groupSettingsOpen}
              />
            ) : (
              <EmptyState
                title="Select a group to start chatting"
                description="Pick a class chat or study group from the sidebar to view messages and members."
              />
            )}
          </YStack>
        </XStack>

        <CreateCustomGroupSheet
          open={createCustomGroupOpen}
          onOpenChange={setCreateCustomGroupOpen}
          onCreated={(g) => {
            setFocusedGroup(toFocusedGroup(g));
            void queryClient.invalidateQueries();
          }}
        />
      </YStack>
    );
  }

  /* ─── Mobile: single-panel toggle ─── */
  if (focusedGroup) {
    return (
      <YStack width="100%" height="100%">
        <RightPanelContent
          focusedGroup={focusedGroup}
          viewer={viewer}
          isDesktop={false}
          setFocusedGroup={setFocusedGroup}
          setInviteFromClassOpen={setInviteFromClassOpen}
          setGroupSettingsOpen={setGroupSettingsOpen}
          removeMember={removeMember}
          queryClient={queryClient}
          myClasses={myClasses}
          inviteFromClassOpen={inviteFromClassOpen}
          setCreateCustomGroupOpen={setCreateCustomGroupOpen}
          groupSettingsOpen={groupSettingsOpen}
        />

        <CreateCustomGroupSheet
          open={createCustomGroupOpen}
          onOpenChange={setCreateCustomGroupOpen}
          onCreated={(g) => {
            setFocusedGroup(toFocusedGroup(g));
            void queryClient.invalidateQueries();
          }}
        />
      </YStack>
    );
  }

  return (
    <YStack width="100%" height="100%" gap="$2">
      <YStack flex={1} overflow="scroll">
        <LeftPanelContent {...leftPanelProps} />
      </YStack>

      <CreateCustomGroupSheet
        open={createCustomGroupOpen}
        onOpenChange={setCreateCustomGroupOpen}
        onCreated={(g) => {
          setFocusedGroup(toFocusedGroup(g));
          void queryClient.invalidateQueries();
        }}
      />
    </YStack>
  );
}
