"use client";

import { H3, YStack } from "@repo/ui";
import {
	MOCK_SECTIONS,
	MOCK_DEADLINES,
	MOCK_ENROLLMENTS,
	MOCK_COURSES,
	type CourseSection,
} from "../../mock-data";
import { StatsRow } from "./stats-row";
import { DeadlineCard } from "./deadline-card";
import { CourseCard } from "./course-card";
import { UploadCTA } from "./upload-cta";

const NOW = new Date("2026-03-12");
const CURRENT_TERM = "Winter 2026";
const CURRENT_USER = "user-1";

function isThisWeek(dateStr: string): boolean {
	const d = new Date(dateStr);
	const diffDays = (d.getTime() - NOW.getTime()) / (1000 * 60 * 60 * 24);
	return diffDays >= 0 && diffDays <= 7;
}

function isThisMonth(dateStr: string): boolean {
	const d = new Date(dateStr);
	return (
		d.getMonth() === NOW.getMonth() && d.getFullYear() === NOW.getFullYear()
	);
}

interface DashboardScreenProps {
	onNavigateCourse?: (sectionId: string) => void;
	onNavigateUpload?: () => void;
}

export function DashboardScreen({ onNavigateCourse, onNavigateUpload }: DashboardScreenProps) {
	// Get sections the user is enrolled in for the current term
	const enrolledSectionIds = MOCK_ENROLLMENTS
		.filter((e) => e.userId === CURRENT_USER)
		.map((e) => e.sectionId);

	const enrolledSections = MOCK_SECTIONS.filter(
		(s) => enrolledSectionIds.includes(s.id) && s.term === CURRENT_TERM,
	);

	const upcomingDeadlines = MOCK_DEADLINES.filter((d) => {
		const due = new Date(d.dueDate);
		const diffDays = (due.getTime() - NOW.getTime()) / (1000 * 60 * 60 * 24);
		return diffDays >= -1 && diffDays <= 14 && !d.completed;
	}).sort(
		(a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
	);

	const dueThisWeek = MOCK_DEADLINES.filter(
		(d) => !d.completed && isThisWeek(d.dueDate),
	).length;

	const examsThisMonth = MOCK_DEADLINES.filter(
		(d) => (d.type === "exam" || d.type === "quiz") && isThisMonth(d.dueDate),
	).length;

	const sectionThemeMap = new Map(
		MOCK_SECTIONS.map((s) => [s.id, s.theme]),
	);

	const courseMap = new Map(
		MOCK_COURSES.map((c) => [c.id, c]),
	);

	return (
		<YStack gap="$4" maxW="$container.full" width="100%" $md={{ gap: "$5" }}>
			{/* Stats */}
			<StatsRow
				dueThisWeek={dueThisWeek}
				examsThisMonth={examsThisMonth}
				totalCourses={enrolledSections.length}
			/>

			{/* Upcoming Deadlines */}
			<YStack gap="$3">
				<H3 fontWeight="800" color="$color12">
					Upcoming Deadlines
				</H3>
				<YStack gap="$2">
					{upcomingDeadlines.map((deadline) => (
						<DeadlineCard
							key={deadline.id}
							deadline={deadline}
							courseTheme={
								sectionThemeMap.get(deadline.sectionId) ?? "gray"
							}
						/>
					))}
					{upcomingDeadlines.length === 0 && (
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
				<YStack gap="$3" $sm={{ flexDirection: "row", gap: "$4", flexWrap: "wrap" }}>
					{enrolledSections.map((section) => {
						const course = courseMap.get(section.courseId);
						const nextDeadline = MOCK_DEADLINES.filter(
							(d) =>
								d.sectionId === section.id &&
								!d.completed &&
								new Date(d.dueDate) >= NOW,
						).sort(
							(a, b) =>
								new Date(a.dueDate).getTime() -
								new Date(b.dueDate).getTime(),
						)[0];
						return (
							<CourseCard
								key={section.id}
								section={section}
								course={course!}
								nextDeadline={nextDeadline}
								onPress={onNavigateCourse}
							/>
						);
					})}
				</YStack>
			</YStack>

			{/* Upload CTA */}
			<UploadCTA onPress={onNavigateUpload} />
		</YStack>
	);
}
