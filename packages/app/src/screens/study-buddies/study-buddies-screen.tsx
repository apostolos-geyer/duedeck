"use client";

import { useState } from "react";
import { Button, H3, SizableText, Spinner, XStack, YStack } from "@repo/ui";
import { ChevronRight } from "@tamagui/lucide-icons";
import {
	useSchools,
	useBrowseCourses,
	useStudyGroups,
} from "../../hooks/use-study-buddies";
import { SchoolCard } from "./school-card";
import { CourseListCard } from "./course-list-card";
import { GroupCard } from "./group-card";
import { GroupChat } from "./group-chat";
import { MemberList } from "./member-list";

type Level = "schools" | "courses" | "groups";

interface SchoolInfo {
	id: string;
	name: string;
	shortName: string;
}

interface CourseInfo {
	id: string;
	code: string;
	name: string;
}

interface DrillState {
	level: Level;
	selectedSchool?: SchoolInfo;
	selectedCourse?: CourseInfo;
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
				hoverStyle={
					state.level !== "schools" ? { opacity: 0.7 } : undefined
				}
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
						hoverStyle={
							state.level === "groups" ? { opacity: 0.7 } : undefined
						}
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

function SchoolsList({
	onSelect,
}: {
	onSelect: (school: SchoolInfo) => void;
}) {
	const { data: schools, isLoading } = useSchools();

	if (isLoading) {
		return (
			<YStack items="center" py="$6">
				<Spinner size="small" />
			</YStack>
		);
	}

	return (
		<YStack
			gap="$3"
			$sm={{ flexDirection: "row", gap: "$4", flexWrap: "wrap" }}
		>
			{(schools ?? []).map((school) => (
				<SchoolCard
					key={school.id}
					school={school}
					onPress={() => onSelect(school)}
				/>
			))}
		</YStack>
	);
}

function CoursesList({
	schoolId,
	schoolName,
	onSelect,
}: {
	schoolId: string;
	schoolName: string;
	onSelect: (course: CourseInfo) => void;
}) {
	const { data: courses, isLoading } = useBrowseCourses(schoolId);

	if (isLoading) {
		return (
			<YStack items="center" py="$6">
				<Spinner size="small" />
			</YStack>
		);
	}

	return (
		<YStack gap="$3">
			<SizableText size="$4" color="$gray10">
				Courses at {schoolName}
			</SizableText>
			{(courses ?? []).map((course) => (
				<CourseListCard
					key={course.id}
					course={course}
					onPress={() => onSelect(course)}
				/>
			))}
		</YStack>
	);
}

function GroupsList({
	courseId,
	courseCode,
	selectedGroupId,
	onSelectGroup,
}: {
	courseId: string;
	courseCode: string;
	selectedGroupId?: string;
	onSelectGroup: (groupId: string) => void;
}) {
	const { data: groups, isLoading } = useStudyGroups(courseId);

	if (isLoading) {
		return (
			<YStack items="center" py="$6">
				<Spinner size="small" />
			</YStack>
		);
	}

	const selectedGroup = (groups ?? []).find(
		(g) => g.id === selectedGroupId,
	);

	return (
		<YStack gap="$4" flex={1} $md={{ flexDirection: "row", gap: "$5" }}>
			{/* Left panel: groups */}
			<YStack flex={1} minW={0} $md={{ minW: 280 }} gap="$3">
				<SizableText size="$3" color="$gray10">
					Study groups for {courseCode}
				</SizableText>
				{(groups ?? []).map((group) => (
					<GroupCard
						key={group.id}
						group={group}
						selected={group.id === selectedGroupId}
						onSelect={() => onSelectGroup(group.id)}
					/>
				))}
				<Button theme="purple" onPress={() => {}}>
					Create Group
				</Button>
			</YStack>

			{/* Right panel: chat */}
			{selectedGroupId && selectedGroup && (
				<YStack flex={2} gap="$0">
					<MemberList members={selectedGroup.members} />
					<GroupChat groupId={selectedGroupId} />
				</YStack>
			)}
		</YStack>
	);
}

export function StudyBuddiesScreen() {
	const [state, setState] = useState<DrillState>({ level: "schools" });

	function handleSelectSchool(school: SchoolInfo) {
		setState({ level: "courses", selectedSchool: school });
	}

	function handleSelectCourse(course: CourseInfo) {
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

	return (
		<YStack gap="$4" maxW="$container.full" width="100%" height="100%">
			<H3 fontWeight="800" color="$color12">
				Study Buddies
			</H3>

			{state.level !== "schools" && (
				<Breadcrumb state={state} onNavigate={handleNavigate} />
			)}

			{state.level === "schools" && (
				<SchoolsList onSelect={handleSelectSchool} />
			)}

			{state.level === "courses" && state.selectedSchool && (
				<CoursesList
					schoolId={state.selectedSchool.id}
					schoolName={state.selectedSchool.name}
					onSelect={handleSelectCourse}
				/>
			)}

			{state.level === "groups" && state.selectedCourse && (
				<GroupsList
					courseId={state.selectedCourse.id}
					courseCode={state.selectedCourse.code}
					selectedGroupId={state.selectedGroupId}
					onSelectGroup={(groupId) =>
						setState((prev) => ({ ...prev, selectedGroupId: groupId }))
					}
				/>
			)}
		</YStack>
	);
}
