"use client";

import {
	H3,
	Paragraph,
	Separator,
	Spinner,
	YStack,
} from "@repo/ui";
import { AppCard, EmptyState } from "@repo/ui";
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
			(d.type === "exam" || d.type === "quiz") && isThisMonth(d.dueDate),
	).length;

	return (
		<YStack gap="$4" maxW="$container.full" width="100%">
			{/* Compact stats line */}
			<StatsRow
				dueThisWeek={dueThisWeek}
				examsThisMonth={examsThisMonth}
				totalCourses={sections.length}
			/>

			{/* Two-column layout on desktop, single column mobile */}
			<YStack gap="$4" $md={{ flexDirection: "row", gap: "$5" }}>
				{/* LEFT: Deadlines (60% on desktop) */}
				<YStack gap="$3" $md={{ flex: 3, minW: 0 }}>
					<H3 fontFamily="$heading" color="$color12">
						Upcoming Deadlines
					</H3>

					{deadlines.length === 0 ? (
						<EmptyState
							title="No deadlines yet"
							description="Upload a syllabus to automatically extract your deadlines."
						/>
					) : (
						<AppCard variant="outlined" size="sm" p="$0">
							{deadlines.map((deadline, i) => (
								<YStack key={deadline.id}>
									{i > 0 && <Separator />}
									<DeadlineCard deadline={deadline} />
								</YStack>
							))}
						</AppCard>
					)}
				</YStack>

				{/* RIGHT: Courses + Upload (40% on desktop) */}
				<YStack gap="$3" $md={{ flex: 2, minW: 0 }}>
					<H3 fontFamily="$heading" color="$color12">
						My Courses
					</H3>

					{sections.length === 0 ? (
						<Link href="/upload" style={{ textDecoration: "none" }}>
							<UploadCTA />
						</Link>
					) : (
						<YStack gap="$2">
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
										style={{ textDecoration: "none" }}
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
					)}
				</YStack>
			</YStack>
		</YStack>
	);
}
