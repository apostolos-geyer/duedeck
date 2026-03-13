"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrpc } from "../rpc/orpc-context";

export function useCalendarDeadlines() {
	const orpc = useOrpc();
	return useQuery(
		orpc.deadlines.upcoming.queryOptions({ input: { days: 60 } }),
	);
}

export function useCalendarConnections() {
	const orpc = useOrpc();
	return useQuery(orpc.settings.calendarConnections.queryOptions({}));
}
