"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrpc } from "../rpc/orpc-context";

export function useDashboardData() {
	const orpc = useOrpc();

	const enrolledSections = useQuery(orpc.sections.enrolled.queryOptions({}));
	const upcomingDeadlines = useQuery(
		orpc.deadlines.upcoming.queryOptions({ input: { days: 14 } }),
	);
	const courseTermsEnded = useQuery(
		orpc.deadlines.courseTermsEnded.queryOptions({}),
	);

	return {
		enrolledSections,
		upcomingDeadlines,
		courseTermsEnded,
		isLoading:
			enrolledSections.isLoading ||
			upcomingDeadlines.isLoading ||
			courseTermsEnded.isLoading,
	};
}
