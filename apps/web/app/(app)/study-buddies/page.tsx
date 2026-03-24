"use client";

import { StudyBuddiesScreen } from "@repo/app/screens/study-buddies";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export default function StudyBuddiesPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const sectionId = searchParams.get("sectionId") ?? undefined;
	const groupId = searchParams.get("groupId") ?? undefined;

	const navigateToChat = useCallback(
		(gId: string) => {
			router.push(`/study-buddies/chat/${gId}`);
		},
		[router],
	);

	return (
		<StudyBuddiesScreen
			initialSectionId={sectionId}
			initialGroupId={groupId}
			onNavigateToChat={navigateToChat}
		/>
	);
}
