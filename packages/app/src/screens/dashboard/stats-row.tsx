"use client";

import { H2, Paragraph, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui";

interface StatsRowProps {
	dueThisWeek: number;
	examsThisMonth: number;
	totalCourses: number;
}

function StatCard({
	value,
	label,
	color,
}: {
	value: number;
	label: string;
	color: string;
}) {
	return (
		<AppCard
			variant="elevated"
			size="md"
			flex={1}
			minW={0}
			borderTopWidth={4}
			borderTopColor={color as any}
		>
			<YStack gap="$1">
				<H2
					fontFamily="$heading"
					color={color as any}
				>
					{value}
				</H2>
				<Paragraph size="$2" color="$gray10" fontWeight="500">
					{label}
				</Paragraph>
			</YStack>
		</AppCard>
	);
}

export function StatsRow({
	dueThisWeek,
	examsThisMonth,
	totalCourses,
}: StatsRowProps) {
	return (
		<YStack gap="$3" $md={{ flexDirection: "row", gap: "$4" }}>
			<StatCard value={dueThisWeek} label="Due This Week" color="$red9" />
			<StatCard value={examsThisMonth} label="Exams This Month" color="$orange9" />
			<StatCard value={totalCourses} label="Courses" color="$purple9" />
		</YStack>
	);
}
