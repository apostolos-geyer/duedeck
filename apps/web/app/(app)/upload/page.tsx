"use client";

import { useRouter } from "next/navigation";
import { UploadScreen } from "@repo/app/screens/upload";

export default function UploadPage() {
	const router = useRouter();
	return <UploadScreen onNavigateCourse={(courseId) => router.push(`/course/${courseId}`)} />;
}
