"use client";

import { Paragraph } from "@repo/ui";
import { AppCard } from "@repo/ui";
import { Upload } from "@tamagui/lucide-icons";

export function UploadCTA() {
	return (
		<AppCard
			variant="outlined"
			size="md"
			borderStyle="dashed"
			items="center"
			justify="center"
			gap="$2"
			hoverStyle={{ borderColor: "$purple7", bg: "$purple2" }}
			pressStyle={{ borderColor: "$purple8", bg: "$purple3" }}
			cursor="pointer"
		>
			<Upload size={24} color="$gray9" />
			<Paragraph size="$3" fontWeight="600" color="$gray11">
				Upload a Syllabus
			</Paragraph>
			<Paragraph size="$2" color="$gray9" text="center">
				Drop a PDF to extract deadlines and grade weights
			</Paragraph>
		</AppCard>
	);
}
