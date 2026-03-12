"use client";

import { SizableText, Theme, YStack } from "@repo/ui";

interface StatCardProps {
	label: string;
	value: number;
	theme?: string;
}

function StatCard({ label, value, theme: themeName = "purple" }: StatCardProps) {
	return (
		<Theme name={themeName as any}>
			<YStack
				$sm={{ flex: 1 }}
				minW={0}
				bg="$gray2"
				rounded="$4"
				p="$4"
				gap="$1"
				borderTopWidth={3}
				borderTopColor="$color9"
			>
				<SizableText size="$10" fontWeight="800" color="$color9">
					{value}
				</SizableText>
				<SizableText size="$3" color="$gray10" fontWeight="500">
					{label}
				</SizableText>
			</YStack>
		</Theme>
	);
}

interface StatsRowProps {
	dueThisWeek: number;
	examsThisMonth: number;
	totalCourses: number;
}

export function StatsRow({
	dueThisWeek,
	examsThisMonth,
	totalCourses,
}: StatsRowProps) {
	return (
		<YStack gap="$3" $sm={{ flexDirection: "row", gap: "$4" }}>
			<StatCard label="Due This Week" value={dueThisWeek} theme="red" />
			<StatCard label="Exams This Month" value={examsThisMonth} theme="orange" />
			<StatCard label="Courses" value={totalCourses} theme="purple" />
		</YStack>
	);
}
