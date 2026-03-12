"use client";

import { useState } from "react";
import { Button, H3, SizableText, XStack, YStack } from "@repo/ui";
import { ChevronRight } from "@tamagui/lucide-icons";
import {
	MOCK_SCHOOLS,
	MOCK_BROWSE_COURSES,
	MOCK_STUDY_GROUPS,
} from "../../mock-data";
import type { School, BrowseCourse } from "../../mock-data";
import { SchoolCard } from "./school-card";
import { CourseListCard } from "./course-list-card";
import { GroupCard } from "./group-card";
import { GroupChat } from "./group-chat";
import { MemberList } from "./member-list";

type Level = "schools" | "courses" | "groups";

interface DrillState {
	level: Level;
	selectedSchool?: School;
	selectedCourse?: BrowseCourse;
	selectedGroupId?: string;
}

function Breadcrumb({
	state,
	onNavigate,
}: {
	state: DrillState;
	onNavigate: (level: Level) => void;
}) {
	return (
		<XStack items="center" gap="$1" mb="$2">
			<SizableText
				size="$2"
				color={state.level === "schools" ? "$color12" : "$purple9"}
				fontWeight={state.level === "schools" ? "700" : "500"}
				cursor={state.level !== "schools" ? "pointer" : undefined}
				onPress={() => onNavigate("schools")}
				hoverStyle={state.level !== "schools" ? { opacity: 0.7 } : undefined}
			>
				Schools
			</SizableText>

			{state.selectedSchool && (
				<>
					<ChevronRight size={14} color="$gray8" />
					<SizableText
						size="$2"
						color={state.level === "courses" ? "$color12" : "$purple9"}
						fontWeight={state.level === "courses" ? "700" : "500"}
						cursor={state.level === "groups" ? "pointer" : undefined}
						onPress={() => onNavigate("courses")}
						hoverStyle={state.level === "groups" ? { opacity: 0.7 } : undefined}
					>
						{state.selectedSchool.shortName}
					</SizableText>
				</>
			)}

			{state.selectedCourse && state.level === "groups" && (
				<>
					<ChevronRight size={14} color="$gray8" />
					<SizableText size="$2" color="$color12" fontWeight="700">
						{state.selectedCourse.code}
					</SizableText>
				</>
			)}
		</XStack>
	);
}

export function StudyBuddiesScreen() {
	const [state, setState] = useState<DrillState>({ level: "schools" });

	function handleSelectSchool(school: School) {
		setState({ level: "courses", selectedSchool: school });
	}

	function handleSelectCourse(course: BrowseCourse) {
		setState((prev) => ({
			...prev,
			level: "groups",
			selectedCourse: course,
		}));
	}

	function handleNavigate(level: Level) {
		if (level === "schools") {
			setState({ level: "schools" });
		} else if (level === "courses") {
			setState((prev) => ({
				level: "courses",
				selectedSchool: prev.selectedSchool,
			}));
		}
	}

	const selectedGroup = MOCK_STUDY_GROUPS.find(
		(g) => g.id === state.selectedGroupId,
	);

	return (
		<YStack gap="$4" maxW="$container.full" width="100%" height="100%">
			<H3 fontWeight="800" color="$color12">
				Study Buddies
			</H3>

			{state.level !== "schools" && (
				<Breadcrumb state={state} onNavigate={handleNavigate} />
			)}

			{/* Level 1: Schools */}
			{state.level === "schools" && (
				<YStack gap="$3" $sm={{ flexDirection: "row", gap: "$4", flexWrap: "wrap" }}>
					{MOCK_SCHOOLS.map((school) => (
						<SchoolCard
							key={school.id}
							school={school}
							onPress={() => handleSelectSchool(school)}
						/>
					))}
				</YStack>
			)}

			{/* Level 2: Courses at School */}
			{state.level === "courses" && state.selectedSchool && (
				<YStack gap="$3">
					<SizableText size="$4" color="$gray10">
						Courses at {state.selectedSchool.name}
					</SizableText>
					{MOCK_BROWSE_COURSES.filter(
						(c) => c.schoolId === state.selectedSchool!.id,
					).map((course) => (
						<CourseListCard
							key={course.id}
							course={course}
							onPress={() => handleSelectCourse(course)}
						/>
					))}
				</YStack>
			)}

			{/* Level 3: Groups for Course */}
			{state.level === "groups" && state.selectedCourse && (
				<YStack gap="$4" flex={1} $md={{ flexDirection: "row", gap: "$5" }}>
					{/* Left panel: groups */}
					<YStack flex={1} minW={0} $md={{ minW: 280 }} gap="$3">
						<SizableText size="$3" color="$gray10">
							Study groups for {state.selectedCourse.code}
						</SizableText>
						{MOCK_STUDY_GROUPS.filter(
							(g) => g.courseCode === state.selectedCourse!.code,
						).map((group) => (
							<GroupCard
								key={group.id}
								group={group}
								selected={group.id === state.selectedGroupId}
								onSelect={() =>
									setState((prev) => ({
										...prev,
										selectedGroupId: group.id,
									}))
								}
							/>
						))}
						<Button theme="purple" onPress={() => {}}>
							Create Group
						</Button>
					</YStack>

					{/* Right panel: chat */}
					{state.selectedGroupId && selectedGroup && (
						<YStack flex={2} gap="$0">
							<MemberList members={selectedGroup.members} />
							<GroupChat groupId={state.selectedGroupId} />
						</YStack>
					)}
				</YStack>
			)}
		</YStack>
	);
}
