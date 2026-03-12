"use client";

import { Button, H4, SizableText, YStack } from "@repo/ui";

interface StudyGroupCTAProps {
	courseCode: string;
	courseId: string;
	onPress?: () => void;
}

export function StudyGroupCTA({ courseCode, courseId, onPress }: StudyGroupCTAProps) {
	return (
		<YStack bg="$gray2" rounded="$4" p="$5" gap="$3">
			<H4 fontWeight="800" color="$color12">
				Find Study Partners
			</H4>
			<SizableText size="$3" color="$gray10">
				Connect with other {courseCode} students
			</SizableText>
			<Button theme="purple" onPress={onPress}>
				Browse Study Groups
			</Button>
		</YStack>
	);
}
