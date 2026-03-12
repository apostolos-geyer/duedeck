"use client";

import { SizableText, Theme, View, XStack, YStack } from "@repo/ui";
import { MOCK_DEADLINES, MOCK_SECTIONS } from "../../mock-data";
import type { CourseTheme } from "../../mock-data";

interface CalendarGridProps {
	currentDate: Date;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TODAY = new Date("2026-03-12");

export function CalendarGrid({ currentDate }: CalendarGridProps) {
	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();
	const firstDay = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	// Build a map of sectionId -> theme
	const sectionThemeMap = new Map(MOCK_SECTIONS.map((s) => [s.id, s.theme]));

	// Build a map of day number -> deadlines for this month
	const deadlinesByDay = new Map<
		number,
		{ id: string; theme: CourseTheme }[]
	>();
	for (const dl of MOCK_DEADLINES) {
		const due = new Date(dl.dueDate);
		if (due.getFullYear() === year && due.getMonth() === month) {
			const day = due.getDate();
			const existing = deadlinesByDay.get(day) ?? [];
			existing.push({
				id: dl.id,
				theme: sectionThemeMap.get(dl.sectionId) ?? "gray" as any,
			});
			deadlinesByDay.set(day, existing);
		}
	}

	// Build weeks array
	const weeks: (number | null)[][] = [];
	let currentWeek: (number | null)[] = [];

	for (let i = 0; i < firstDay; i++) {
		currentWeek.push(null);
	}

	for (let day = 1; day <= daysInMonth; day++) {
		currentWeek.push(day);
		if (currentWeek.length === 7) {
			weeks.push(currentWeek);
			currentWeek = [];
		}
	}

	if (currentWeek.length > 0) {
		while (currentWeek.length < 7) {
			currentWeek.push(null);
		}
		weeks.push(currentWeek);
	}

	const isToday = (day: number) =>
		day === TODAY.getDate() &&
		month === TODAY.getMonth() &&
		year === TODAY.getFullYear();

	return (
		<YStack gap="$1">
			{/* Day header row */}
			<XStack>
				{DAY_LABELS.map((label) => (
					<SizableText
						key={label}
						flex={1}
						size="$1"
						color="$gray9"
						text="center"
						fontWeight="600"
					>
						{label}
					</SizableText>
				))}
			</XStack>

			{/* Week rows */}
			{weeks.map((week, weekIdx) => (
				<XStack key={weekIdx}>
					{week.map((day, dayIdx) => (
						<YStack
							key={dayIdx}
							flex={1}
							minH={48}
							$sm={{ minH: 72 }}
							p="$1"
							rounded="$2"
							bg={day && isToday(day) ? "$purple2" : "transparent"}
							borderWidth={day && isToday(day) ? 2 : 0}
							borderColor={
								day && isToday(day) ? "$purple9" : "transparent"
							}
						>
							{day !== null && (
								<>
									<SizableText
										size="$2"
										fontWeight={isToday(day) ? "700" : "400"}
										color={isToday(day) ? "$purple9" : "$color12"}
									>
										{day}
									</SizableText>
									<XStack gap="$1" flexWrap="wrap" mt="$1">
										{(deadlinesByDay.get(day) ?? []).map((dl) => (
											<Theme key={dl.id} name={dl.theme}>
												<View
													width={6}
													height={6}
													rounded="$10"
													bg="$color9"
												/>
											</Theme>
										))}
									</XStack>
								</>
							)}
						</YStack>
					))}
				</XStack>
			))}
		</YStack>
	);
}
