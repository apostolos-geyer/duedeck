"use client";

import { Paragraph, SizableText, XStack } from "@repo/ui";
import { AppCard } from "@repo/ui";

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
		<AppCard variant="flat" size="sm">
			<XStack gap="$3" items="center" flexWrap="wrap">
				<Paragraph size="$3" color="$color12">
					<SizableText fontWeight="800" color="$red9" size="$5">
						{dueThisWeek}
					</SizableText>
					{" "}due this week
				</Paragraph>
				<SizableText size="$3" color="$gray7">·</SizableText>
				<Paragraph size="$3" color="$color12">
					<SizableText fontWeight="800" color="$orange9" size="$5">
						{examsThisMonth}
					</SizableText>
					{" "}exams this month
				</Paragraph>
				<SizableText size="$3" color="$gray7">·</SizableText>
				<Paragraph size="$3" color="$color12">
					<SizableText fontWeight="800" color="$purple9" size="$5">
						{totalCourses}
					</SizableText>
					{" "}courses
				</Paragraph>
			</XStack>
		</AppCard>
	);
}
