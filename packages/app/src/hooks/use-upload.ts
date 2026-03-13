"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useOrpc } from "../rpc/orpc-context";

export function useUploadCourses(search?: string) {
	const orpc = useOrpc();
	return useQuery({
		...orpc.courses.list.queryOptions({ input: { search } }),
		enabled: !search || search.length > 0,
	});
}

export function useUploadSections(courseId: string) {
	const orpc = useOrpc();
	return useQuery(
		orpc.sections.list.queryOptions({ input: { courseId } }),
	);
}

export function useDocument(docId: string) {
	const orpc = useOrpc();
	return useQuery(
		orpc.documents.get.queryOptions({ input: { docId } }),
	);
}

export function usePresign() {
	const orpc = useOrpc();
	return useMutation(orpc.uploads.presign.mutationOptions());
}

export function useStartDocument() {
	const orpc = useOrpc();
	return useMutation(orpc.documents.start.mutationOptions());
}

export function useConfirmDocument() {
	const orpc = useOrpc();
	return useMutation(orpc.documents.confirm.mutationOptions());
}

export function useCancelDocument() {
	const orpc = useOrpc();
	return useMutation(orpc.documents.cancel.mutationOptions());
}
