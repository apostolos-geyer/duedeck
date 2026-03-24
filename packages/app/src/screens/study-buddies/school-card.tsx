"use client";

import { BrutalistListItem } from "@repo/ui";
import { ChevronRight, GraduationCap } from "@tamagui/lucide-icons";

interface SchoolCardProps {
	school: {
		id: string;
		name: string;
		shortName: string;
	};
	onPress: () => void;
}

export function SchoolCard({ school, onPress }: SchoolCardProps) {
	return (
		<BrutalistListItem
			onPress={onPress}
			icon={<GraduationCap size={18} color="$purple9" />}
			title={school.shortName}
			subTitle={school.name}
			iconAfter={<ChevronRight size={16} color="$gray8" />}
		/>
	);
}
