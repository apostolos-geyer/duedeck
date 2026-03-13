"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useOrpc } from "../rpc/orpc-context";

export function useCurrentUser() {
	const orpc = useOrpc();
	return useQuery(orpc.users.me.queryOptions({}));
}

export function useUpdateProfile() {
	const orpc = useOrpc();
	return useMutation(orpc.settings.updateProfile.mutationOptions());
}

export function useReminderPreferences() {
	const orpc = useOrpc();
	return useQuery(orpc.settings.reminderPreferences.queryOptions({}));
}

export function useToggleCalendar() {
	const orpc = useOrpc();
	return useMutation(orpc.settings.toggleCalendar.mutationOptions());
}

export function useUpdateReminders() {
	const orpc = useOrpc();
	return useMutation(orpc.settings.updateReminders.mutationOptions());
}
