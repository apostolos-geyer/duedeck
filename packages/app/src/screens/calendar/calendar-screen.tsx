"use client";

import { useState } from "react";
import { Spinner, YStack } from "@repo/ui";
import { useCalendarDeadlines } from "../../hooks/use-calendar-data";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { CalendarSyncPanel } from "./calendar-sync-panel";

export function CalendarScreen() {
	const [currentDate, setCurrentDate] = useState(
		() => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
	);
	const { data: deadlines, isLoading } = useCalendarDeadlines();

	function handlePrev() {
		setCurrentDate(
			(prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
		);
	}

	function handleNext() {
		setCurrentDate(
			(prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
		);
	}

	if (isLoading) {
		return (
			<YStack flex={1} items="center" justify="center" p="$6">
				<Spinner size="large" />
			</YStack>
		);
	}

	return (
		<YStack gap="$4" $md={{ gap: "$5" }} maxW="$container.full" width="100%">
			<CalendarHeader
				currentDate={currentDate}
				onPrev={handlePrev}
				onNext={handleNext}
			/>
			<CalendarGrid currentDate={currentDate} deadlines={deadlines ?? []} />
			<CalendarSyncPanel />
		</YStack>
	);
}
