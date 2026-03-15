"use client";

import { useMutation } from "@tanstack/react-query";
import { useOrpc } from "../rpc/orpc-context";

export function useEnroll() {
	const orpc = useOrpc();
	return useMutation(orpc.enrollments.enroll.mutationOptions());
}

export function useUnenroll() {
	const orpc = useOrpc();
	return useMutation(orpc.enrollments.unenroll.mutationOptions());
}
