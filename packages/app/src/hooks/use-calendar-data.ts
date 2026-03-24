"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrpc } from "../rpc/orpc-context";

/** Local start/end of the calendar month (matches grid month navigation). */
function monthRangeIso(viewMonth: Date): { from: string; to: string } {
	const y = viewMonth.getFullYear();
	const m = viewMonth.getMonth();
	const from = new Date(y, m, 1, 0, 0, 0, 0);
	const to = new Date(y, m + 1, 0, 23, 59, 59, 999);
	return { from: from.toISOString(), to: to.toISOString() };
}

/** Deadlines for the visible month only (enrolled sections), including completed — aligns with course timeline. */
export function useCalendarDeadlines(viewMonth: Date) {
	const orpc = useOrpc();
	const { from, to } = useMemo(() => monthRangeIso(viewMonth), [
		viewMonth.getFullYear(),
		viewMonth.getMonth(),
	]);

	return useQuery(
		orpc.deadlines.inRange.queryOptions({ input: { from, to } }),
	);
}

export function useCalendarConnections() {
	const orpc = useOrpc();
	return useQuery(orpc.settings.calendarConnections.queryOptions({}));
}
