"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { isNotStudyGroupMemberError } from "../lib/study-group-rpc-error";
import { useOrpc } from "../rpc/orpc-context";

export function useSchools() {
  const orpc = useOrpc();
  return useQuery(orpc.schools.list.queryOptions({}));
}

export function useBrowseCourses(schoolId: string) {
  const orpc = useOrpc();
  return useQuery(orpc.courses.list.queryOptions({ input: { schoolId } }));
}

export function useStudyGroups(courseId: string) {
  const orpc = useOrpc();
  return useQuery(
    orpc.studyGroups.list.queryOptions({
      input: { courseId, customOnly: true },
    }),
  );
}

export function useEnrolledSectionsForStudy() {
  const orpc = useOrpc();
  return useQuery(orpc.sections.enrolled.queryOptions({}));
}

export function useMyCustomStudyGroups() {
  const orpc = useOrpc();
  return useQuery({
    ...orpc.studyGroups.myCustomGroups.queryOptions({}),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 12_000,
  });
}

export function useSectionClassmates(sectionId: string | undefined) {
  const orpc = useOrpc();
  return useQuery({
    ...orpc.sections.classmates.queryOptions({
      input: { sectionId: sectionId ?? "" },
    }),
    enabled: Boolean(sectionId),
  });
}

export function useInviteFromSectionToStudyGroup() {
  const orpc = useOrpc();
  return useMutation(orpc.studyGroups.inviteFromSection.mutationOptions());
}

export function useMessages(
  groupId: string,
  options?: { onRemovedFromGroup?: () => void },
) {
  const orpc = useOrpc();
  const queryClient = useQueryClient();
  const onRemovedRef = useRef(options?.onRemovedFromGroup);
  onRemovedRef.current = options?.onRemovedFromGroup;
  const handledRef = useRef(false);

  useEffect(() => {
    handledRef.current = false;
  }, [groupId]);

  const query = useQuery({
    ...orpc.messages.list.queryOptions({ input: { groupId } }),
    retry: false,
    refetchInterval: (q) =>
      q.state.error && isNotStudyGroupMemberError(q.state.error)
        ? false
        : 4_000,
  });

  useEffect(() => {
    if (!query.isError || !query.error || handledRef.current) return;
    if (!isNotStudyGroupMemberError(query.error)) return;
    handledRef.current = true;
    void queryClient.invalidateQueries();
    onRemovedRef.current?.();
  }, [query.isError, query.error, queryClient]);

  return query;
}

export function useSendMessage() {
  const orpc = useOrpc();
  return useMutation(orpc.messages.send.mutationOptions());
}

export function useMyClassChats() {
  const orpc = useOrpc();
  return useQuery(orpc.studyGroups.myClassChats.queryOptions({}));
}

export function useEnsureClassChat() {
  const orpc = useOrpc();
  return useMutation(orpc.studyGroups.ensureClassChat.mutationOptions());
}

export function useCreateStudyGroup() {
  const orpc = useOrpc();
  return useMutation(orpc.studyGroups.create.mutationOptions());
}

export function useUpdateStudyGroup() {
  const orpc = useOrpc();
  return useMutation(orpc.studyGroups.update.mutationOptions());
}

export function useRemoveStudyGroupMember() {
  const orpc = useOrpc();
  return useMutation(orpc.studyGroups.removeMember.mutationOptions());
}

export function useDeleteStudyGroup() {
  const orpc = useOrpc();
  return useMutation(orpc.studyGroups.delete.mutationOptions());
}

export function useLeaveStudyGroup() {
  const orpc = useOrpc();
  return useMutation(orpc.studyGroups.leave.mutationOptions());
}

export function useJoinStudyGroup() {
  const orpc = useOrpc();
  return useMutation(orpc.studyGroups.join.mutationOptions());
}

export function useStudyGroupSharedFreeTime(groupId: string) {
  const orpc = useOrpc();
  return useQuery({
    ...orpc.studyGroups.sharedFreeTime.queryOptions({
      input: { groupId },
    }),
    staleTime: 5 * 60_000,
  });
}

export function useStudyGroupActivityLog(groupId: string) {
  const orpc = useOrpc();
  return useQuery({
    ...orpc.studyGroups.activityLog.queryOptions({ input: { groupId } }),
    refetchInterval: 5_000,
  });
}
