"use client";

import { Button, SizableText, XStack } from "@repo/ui";
import { ChevronLeft, ChevronRight } from "@tamagui/lucide-icons";

interface CalendarHeaderProps {
	currentDate: Date;
	onPrev: () => void;
	onNext: () => void;
}

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export function CalendarHeader({
	currentDate,
	onPrev,
	onNext,
}: CalendarHeaderProps) {
	const label = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

	return (
		<XStack items="center" gap="$3">
			<Button
				size="$3"
				circular
				icon={<ChevronLeft size={20} />}
				onPress={onPrev}
			/>
			<SizableText size="$6" fontWeight="700" color="$color12">
				{label}
			</SizableText>
			<Button
				size="$3"
				circular
				icon={<ChevronRight size={20} />}
				onPress={onNext}
			/>
		</XStack>
	);
}
