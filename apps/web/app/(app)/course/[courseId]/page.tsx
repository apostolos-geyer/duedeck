"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { CourseDetailScreen } from "@repo/app/screens/course-detail";

export default function CourseDetailPage({
	params,
}: { params: Promise<{ courseId: string }> }) {
	const { courseId } = use(params);
	const router = useRouter();
	return (
		<CourseDetailScreen
			sectionId={courseId}
			onNavigateStudyBuddies={() => router.push("/study-buddies")}
		/>
	);
}
