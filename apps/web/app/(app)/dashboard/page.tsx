"use client";

import { useRouter } from "next/navigation";
import { DashboardScreen } from "@repo/app/screens/dashboard";

export default function DashboardPage() {
	const router = useRouter();
	return (
		<DashboardScreen
			onNavigateCourse={(courseId) => router.push(`/course/${courseId}`)}
			onNavigateUpload={() => router.push("/upload")}
		/>
	);
}
