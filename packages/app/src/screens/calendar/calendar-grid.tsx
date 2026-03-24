"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SizableText, Theme, View, XStack, YStack } from "@repo/ui";
import { Link } from "../../components/link";
import { TYPE_THEME } from "../../lib/deadline-theme";

export interface CalendarDeadlineItem {
	id: string;
	title: string;
	dueDate: string | Date;
	type: string;
	weight: number;
	completed: boolean;
	sectionId: string;
	section?: {
		theme?: string;
		course?: { id: string; code?: string; name?: string };
	};
}

interface CalendarGridProps {
	currentDate: Date;
	deadlines: CalendarDeadlineItem[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DaySummary = {
	id: string;
	title: string;
	type: string;
	weight: number;
	completed: boolean;
	theme: string;
	sectionId: string;
	courseLabel: string;
};

function getTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		assignment: "Assignment",
		exam: "Exam",
		quiz: "Quiz",
		project: "Project",
		participation: "Participation",
		other: "Other",
	};
	return labels[type] ?? type;
}

export function CalendarGrid({ currentDate, deadlines }: CalendarGridProps) {
	const today = new Date();
	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();
	const firstDay = new Date(year, month, 1).getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();

	const [hoverDay, setHoverDay] = useState<number | null>(null);
	const [pinnedDay, setPinnedDay] = useState<number | null>(null);

	useEffect(() => {
		setHoverDay(null);
		setPinnedDay(null);
	}, [year, month]);

	const deadlinesByDay = useMemo(() => {
		const map = new Map<number, DaySummary[]>();
		for (const dl of deadlines) {
			const due = new Date(dl.dueDate);
			if (due.getFullYear() === year && due.getMonth() === month) {
				const day = due.getDate();
				const course = dl.section?.course;
				const courseLabel =
					course?.code?.trim() ||
					course?.name?.trim() ||
					"Course";
				const existing = map.get(day) ?? [];
				existing.push({
					id: dl.id,
					title: dl.title,
					type: dl.type,
					weight: dl.weight,
					completed: dl.completed,
					theme: dl.section?.theme ?? "gray",
					sectionId: dl.sectionId,
					courseLabel,
				});
				map.set(day, existing);
			}
		}
		return map;
	}, [deadlines, year, month]);

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
		day === today.getDate() &&
		month === today.getMonth() &&
		year === today.getFullYear();

	const displayDay = hoverDay ?? pinnedDay;

	const handleDayClick = useCallback(
		(day: number) => {
			const items = deadlinesByDay.get(day);
			if (!items?.length) return;
			setPinnedDay((p) => (p === day ? null : day));
		},
		[deadlinesByDay],
	);

	const handleMouseEnterDay = useCallback((day: number) => {
		if (deadlinesByDay.get(day)?.length) {
			setHoverDay(day);
		}
	}, [deadlinesByDay]);

	const handleMouseLeaveDay = useCallback(() => {
		setHoverDay(null);
	}, []);

	const gridBorderColor = "$gray6";

	return (
		<YStack gap="$2">
			<XStack borderBottomWidth={1} borderBottomColor={gridBorderColor} pb="$2">
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

			<YStack
				borderTopWidth={1}
				borderLeftWidth={1}
				borderColor={gridBorderColor}
				rounded="$3"
				overflow="visible"
			>
			{weeks.map((week, weekIdx) => (
				<XStack key={weekIdx} overflow="visible">
					{week.map((day, dayIdx) => {
						const items = day !== null ? deadlinesByDay.get(day) ?? [] : [];
						const hasDeadlines = items.length > 0;
						const showDetail =
							day !== null &&
							displayDay === day &&
							hasDeadlines;

						return (
							<YStack
								key={dayIdx}
								flex={1}
								minH={48}
								$sm={{ minH: 88 }}
								p="$1"
								position="relative"
								overflow="visible"
								borderRightWidth={1}
								borderBottomWidth={1}
								borderColor={gridBorderColor}
								bg={
									day !== null && isToday(day) ? "$purple2" : "transparent"
								}
								{...(day !== null && hasDeadlines
									? {
											onMouseEnter: () => handleMouseEnterDay(day),
											onMouseLeave: handleMouseLeaveDay,
										}
									: {})}
							>
								{day !== null && (
									<YStack
										gap="$1"
										cursor={hasDeadlines ? "pointer" : "default"}
										pressStyle={
											hasDeadlines ? { opacity: 0.85 } : undefined
										}
										onPress={
											hasDeadlines
												? () => handleDayClick(day)
												: undefined
										}
									>
										<SizableText
											size="$2"
											fontWeight={isToday(day) ? "700" : "400"}
											color={isToday(day) ? "$purple9" : "$color12"}
										>
											{day}
										</SizableText>
										<XStack gap="$1" flexWrap="wrap" mt="$1">
											{items.map((dl) => (
												<Theme key={dl.id} name={dl.theme as never}>
													<View
														width={8}
														height={8}
														rounded="$10"
														bg="$color9"
														opacity={dl.completed ? 0.45 : 1}
														hoverStyle={
															hasDeadlines
																? { scale: 1.15, opacity: 1 }
																: undefined
														}
														animation="quick"
														aria-label={`${dl.title}, ${dl.courseLabel}${dl.completed ? ", completed" : ""}`}
													/>
												</Theme>
											))}
										</XStack>
									</YStack>
								)}

								{showDetail && (
									<Theme name="purple">
										<YStack
											position="absolute"
											l={0}
											r={0}
											t="100%"
											mt="$1"
											zIndex={200}
											bg="$purple2"
											borderWidth={1}
											borderColor="$purple7"
											rounded="$4"
											p="$2"
											gap="$2"
											shadowColor="$purple4"
											shadowOffset={{ width: 0, height: 6 }}
											shadowOpacity={0.22}
											shadowRadius={12}
											elevation={12}
											maxH={260}
											overflow="scroll"
											minW={200}
										>
											<SizableText
												size="$1"
												fontWeight="800"
												color="$purple11"
												letterSpacing={0.6}
												textTransform="uppercase"
											>
												Due this day
											</SizableText>
											{items.map((dl) => {
												const typeTheme =
													TYPE_THEME[dl.type] ?? TYPE_THEME.other;
												return (
													<YStack
														key={dl.id}
														bg="$background"
														rounded="$3"
														p="$2"
														pl="$2"
														borderLeftWidth={3}
														borderLeftColor="$purple9"
														gap="$1"
														opacity={dl.completed ? 0.72 : 1}
													>
														<XStack gap="$2" items="center" flexWrap="wrap">
															<Link
																href={`/course/${dl.sectionId}`}
																style={{ textDecoration: "none", flex: 1, minWidth: 0 }}
															>
																<SizableText
																	size="$3"
																	fontWeight="700"
																	color="$purple11"
																	numberOfLines={2}
																	hoverStyle={{
																		color: "$purple12",
																		textDecorationLine: "underline",
																	}}
																	textDecorationLine={
																		dl.completed ? "line-through" : "none"
																	}
																>
																	{dl.title}
																</SizableText>
															</Link>
															<Theme name={typeTheme}>
																<View
																	bg="$color4"
																	rounded="$10"
																	px="$2"
																	py="$1"
																>
																	<SizableText
																		size="$1"
																		fontWeight="600"
																		color="$color11"
																	>
																		{getTypeLabel(dl.type)}
																	</SizableText>
																</View>
															</Theme>
														</XStack>
														<XStack gap="$2" flexWrap="wrap" items="center">
															<SizableText size="$2" color="$gray10">
																{dl.courseLabel}
																{dl.completed ? " · Done" : ""}
															</SizableText>
															<SizableText
																size="$2"
																fontWeight="700"
																color="$gray11"
															>
																{dl.weight}%
															</SizableText>
														</XStack>
													</YStack>
												);
											})}
										</YStack>
									</Theme>
								)}
							</YStack>
						);
					})}
				</XStack>
			))}
			</YStack>
		</YStack>
	);
}
