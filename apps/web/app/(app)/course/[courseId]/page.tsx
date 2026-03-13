"use client";

import { use } from "react";
import { CourseDetailScreen } from "@repo/app/screens/course-detail";

export default function CourseDetailPage({
	params,
}: { params: Promise<{ courseId: string }> }) {
	const { courseId } = use(params);
	return <CourseDetailScreen sectionId={courseId} />;
}
