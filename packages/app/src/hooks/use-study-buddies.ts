"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useOrpc } from "../rpc/orpc-context";

export function useSchools() {
	const orpc = useOrpc();
	return useQuery(orpc.schools.list.queryOptions({}));
}

export function useBrowseCourses(schoolId: string) {
	const orpc = useOrpc();
	return useQuery(
		orpc.courses.list.queryOptions({ input: { schoolId } }),
	);
}

export function useStudyGroups(courseId: string) {
	const orpc = useOrpc();
	return useQuery(
		orpc.studyGroups.list.queryOptions({ input: { courseId } }),
	);
}

export function useMessages(groupId: string) {
	const orpc = useOrpc();
	return useQuery(
		orpc.messages.list.queryOptions({ input: { groupId } }),
	);
}

export function useSendMessage() {
	const orpc = useOrpc();
	return useMutation(orpc.messages.send.mutationOptions());
}
