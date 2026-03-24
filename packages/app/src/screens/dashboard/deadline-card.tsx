"use client";

import { BrutalistListItem, Paragraph, SizableText, Theme, View } from "@repo/ui";

interface DeadlineCardProps {
	deadline: {
		id: string;
		sectionId: string;
		title: string;
		dueDate: string | Date;
		type: string;
		weight: number;
		completed: boolean;
		section?: {
			theme?: string;
			course?: { code: string };
		};
	};
}

function getRelativeDate(dateStr: string | Date): string {
	const now = new Date();
	const due = new Date(dateStr);
	const diffMs = due.getTime() - now.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Tomorrow";
	if (diffDays <= 7) return `in ${diffDays} days`;
	return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr: string | Date): boolean {
	return new Date(dateStr).getTime() < Date.now();
}

function isUrgent(dateStr: string | Date): boolean {
	const diffMs = new Date(dateStr).getTime() - Date.now();
	const diffHours = diffMs / (1000 * 60 * 60);
	return diffHours >= 0 && diffHours <= 48;
}

export function DeadlineCard({ deadline }: DeadlineCardProps) {
	const courseCode = deadline.section?.course?.code ?? "";
	const courseTheme = deadline.section?.theme ?? "gray";
	const overdue = !deadline.completed && isOverdue(deadline.dueDate);
	const urgent = !deadline.completed && !overdue && isUrgent(deadline.dueDate);
	const relDate = getRelativeDate(deadline.dueDate);

	return (
		<Theme name={courseTheme as any}>
			<BrutalistListItem
				rounded={0}
				borderLeftWidth={3}
				borderLeftColor="$color9"
				bg={overdue ? "$red2" : "transparent"}
				hoverStyle={{ bg: overdue ? "$red3" : "$gray2" }}
				pressStyle={{ bg: "$gray3" }}
				opacity={deadline.completed ? 0.5 : 1}
				py="$2"
				px="$3"
				icon={
					<View
						bg="$color9"
						rounded={0}
						px="$2"
						py="$1"
					>
						<SizableText size="$1" fontWeight="700" color="white">
							{courseCode}
						</SizableText>
					</View>
				}
				title={
					<Paragraph
						size="$3"
						fontWeight="500"
						color="$color12"
						textDecorationLine={deadline.completed ? "line-through" : "none"}
					>
						{deadline.title}
					</Paragraph>
				}
				subTitle={
					<SizableText size="$1" color="$gray9">
						{deadline.type} · {deadline.weight}%
					</SizableText>
				}
				iconAfter={
					<Paragraph
						size="$2"
						fontWeight="600"
						color={overdue ? "$red10" : urgent ? "$orange10" : "$gray10"}
					>
						{relDate}
					</Paragraph>
				}
			/>
		</Theme>
	);
}
