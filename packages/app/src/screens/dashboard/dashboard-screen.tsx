"use client";

import { H3, Spinner, YStack } from "@repo/ui";
import { useDashboardData } from "../../hooks/use-dashboard-data";
import { Link } from "../../components/link";
import { StatsRow } from "./stats-row";
import { DeadlineCard } from "./deadline-card";
import { CourseCard } from "./course-card";
import { UploadCTA } from "./upload-cta";

function isThisWeek(date: Date | string): boolean {
	const now = new Date();
	const d = new Date(date);
	const diffDays = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
	return diffDays >= 0 && diffDays <= 7;
}

function isThisMonth(date: Date | string): boolean {
	const now = new Date();
	const d = new Date(date);
	return (
		d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
	);
}

export function DashboardScreen() {
	const { enrolledSections, upcomingDeadlines, courseTermsEnded, isLoading } =
		useDashboardData();

	if (isLoading) {
		return (
			<YStack flex={1} items="center" justify="center" p="$6">
				<Spinner size="large" />
			</YStack>
		);
	}

	const sections = enrolledSections.data ?? [];
	const deadlines = upcomingDeadlines.data ?? [];
	const termsEndedBySection = courseTermsEnded.data ?? {};

	const dueThisWeek = deadlines.filter(
		(d) => !d.completed && isThisWeek(d.dueDate),
	).length;

	const examsThisMonth = deadlines.filter(
		(d) =>
			(d.type === "exam" || d.type === "quiz") &&
			isThisMonth(d.dueDate),
	).length;

	return (
		<YStack gap="$4" maxW="$container.full" width="100%" $md={{ gap: "$5" }}>
			{/* Stats */}
			<StatsRow
				dueThisWeek={dueThisWeek}
				examsThisMonth={examsThisMonth}
				totalCourses={sections.length}
			/>

			{/* Upcoming Deadlines */}
			<YStack gap="$3">
				<H3 fontWeight="800" color="$color12">
					Upcoming Deadlines
				</H3>
				<YStack gap="$2">
					{deadlines.map((deadline) => (
						<DeadlineCard
							key={deadline.id}
							deadline={deadline}
						/>
					))}
					{deadlines.length === 0 && (
						<YStack p="$4" items="center">
							<H3 color="$gray9">No upcoming deadlines</H3>
						</YStack>
					)}
				</YStack>
			</YStack>

			{/* My Courses */}
			<YStack gap="$3">
				<H3 fontWeight="800" color="$color12">
					My Courses
				</H3>
				<YStack
					gap="$3"
					$sm={{ flexDirection: "row", gap: "$4", flexWrap: "wrap" }}
				>
					{sections.map((section) => {
						const sectionDeadlines = deadlines.filter(
							(d) =>
								d.sectionId === section.id &&
								!d.completed &&
								new Date(d.dueDate) >= new Date(),
						);
						const nextDeadline = sectionDeadlines[0];
						return (
							<Link
								key={section.id}
								href={`/course/${section.id}`}
								style={{ textDecoration: "none", flex: "1 1 280px", maxWidth: 360 }}
							>
								<CourseCard
									section={section}
									nextDeadline={nextDeadline}
									courseTermEnded={
										termsEndedBySection[section.id] ?? false
									}
								/>
							</Link>
						);
					})}
				</YStack>
			</YStack>

			{/* Upload CTA */}
			<Link href="/upload" style={{ textDecoration: "none" }}>
				<UploadCTA />
			</Link>
		</YStack>
	);
}
