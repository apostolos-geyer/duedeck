"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrpc } from "../rpc/orpc-context";

export function useCourseDetail(sectionId: string) {
	const orpc = useOrpc();

	const section = useQuery(
		orpc.sections.get.queryOptions({ input: { sectionId } }),
	);
	const deadlines = useQuery(
		orpc.deadlines.list.queryOptions({ input: { sectionId } }),
	);
	const gradeWeights = useQuery(
		orpc.gradeWeights.list.queryOptions({ input: { sectionId } }),
	);

	return {
		section,
		deadlines,
		gradeWeights,
		isLoading:
			section.isLoading || deadlines.isLoading || gradeWeights.isLoading,
	};
}
