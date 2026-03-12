"use client";

import { useState } from "react";
import { YStack } from "@repo/ui";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { CalendarSyncPanel } from "./calendar-sync-panel";

export function CalendarScreen() {
	const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026

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

	return (
		<YStack gap="$4" $md={{ gap: "$5" }} maxW="$container.full" width="100%">
			<CalendarHeader
				currentDate={currentDate}
				onPrev={handlePrev}
				onNext={handleNext}
			/>
			<CalendarGrid currentDate={currentDate} />
			<CalendarSyncPanel />
		</YStack>
	);
}
