"use client";

import { SizableText, Theme, View, XStack } from "@repo/ui";
import type { Deadline } from "../../mock-data";

function getRelativeDate(dateStr: string): string {
	const now = new Date("2026-03-12");
	const due = new Date(dateStr);
	const diffMs = due.getTime() - now.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Tomorrow";
	if (diffDays <= 7) return `in ${diffDays} days`;
	return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTypeLabel(type: Deadline["type"]): string {
	const labels: Record<Deadline["type"], string> = {
		assignment: "Assignment",
		exam: "Exam",
		quiz: "Quiz",
		project: "Project",
		lab: "Lab",
	};
	return labels[type];
}

function isUrgent(dateStr: string): boolean {
	const now = new Date("2026-03-12");
	const due = new Date(dateStr);
	const diffMs = due.getTime() - now.getTime();
	const diffHours = diffMs / (1000 * 60 * 60);
	return diffHours >= 0 && diffHours <= 48;
}

interface DeadlineCardProps {
	deadline: Deadline;
	courseTheme: string;
}

export function DeadlineCard({ deadline, courseTheme }: DeadlineCardProps) {
	const urgent = isUrgent(deadline.dueDate);

	return (
		<Theme name={courseTheme as any}>
			<XStack
				bg={urgent ? "$red2" : "$gray2"}
				rounded="$3"
				p="$2"
				pl="$2"
				gap="$3"
				$sm={{ p: "$3" }}
				items="center"
				borderLeftWidth={4}
				borderLeftColor="$color9"
				hoverStyle={{ bg: urgent ? "$red3" : "$gray3" }}
				opacity={deadline.completed ? 0.5 : 1}
			>
				{/* Course code badge */}
				<View bg="$color9" rounded="$2" px="$2" py="$1">
					<SizableText size="$1" fontWeight="700" color="white">
						{deadline.courseCode}
					</SizableText>
				</View>

				{/* Title */}
				<SizableText
					flex={1}
					size="$3"
					fontWeight="600"
					color="$color12"
					textDecorationLine={deadline.completed ? "line-through" : "none"}
				>
					{deadline.title}
				</SizableText>

				{/* Type pill */}
				<View bg="$gray4" rounded="$10" px="$2" py="$1" display="none" $sm={{ display: "flex" }}>
					<SizableText size="$1" color="$gray11" fontWeight="500">
						{getTypeLabel(deadline.type)}
					</SizableText>
				</View>

				{/* Weight */}
				<View minW={40} display="none" $sm={{ display: "flex" }}>
					<SizableText size="$2" fontWeight="700" color="$gray10" text="right">
						{deadline.weight}%
					</SizableText>
				</View>

				{/* Due date */}
				<View minW={80}>
					<SizableText
						size="$2"
						fontWeight="600"
						color={urgent ? "$red10" : "$gray10"}
						text="right"
					>
						{getRelativeDate(deadline.dueDate)}
					</SizableText>
				</View>
			</XStack>
		</Theme>
	);
}
