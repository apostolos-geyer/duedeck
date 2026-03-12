"use client";

import { SizableText, YStack } from "@repo/ui";
import { Upload } from "@tamagui/lucide-icons";

interface UploadCTAProps {
	onPress?: () => void;
}

export function UploadCTA({ onPress }: UploadCTAProps) {
	return (
		<YStack
			borderWidth={2}
			borderColor="$gray5"
			borderStyle="dashed"
			rounded="$4"
			p="$4"
			items="center"
			justify="center"
			gap="$3"
			hoverStyle={{ borderColor: "$purple7", bg: "$purple2" }}
			pressStyle={{ borderColor: "$purple8", bg: "$purple3" }}
			cursor="pointer"
			minH={120}
			$sm={{ p: "$6", minH: 160 }}
			onPress={onPress}
		>
			<Upload size={32} color="$gray9" />
			<SizableText size="$5" fontWeight="700" color="$gray11">
				Upload a Syllabus
			</SizableText>
			<SizableText size="$2" color="$gray9" text="center">
				Drop a PDF to automatically extract deadlines, exams, and grade
				weights
			</SizableText>
		</YStack>
	);
}
