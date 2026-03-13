"use client";

import { Button, H4, SizableText, YStack } from "@repo/ui";
import { Link } from "../../components/link";

interface StudyGroupCTAProps {
	courseCode: string;
	courseId: string;
}

export function StudyGroupCTA({ courseCode, courseId }: StudyGroupCTAProps) {
	return (
		<YStack bg="$gray2" rounded="$4" p="$5" gap="$3">
			<H4 fontWeight="800" color="$color12">
				Find Study Partners
			</H4>
			<SizableText size="$3" color="$gray10">
				Connect with other {courseCode} students
			</SizableText>
			<Link href="/study-buddies" style={{ textDecoration: "none" }}>
				<Button theme="purple">Browse Study Groups</Button>
			</Link>
		</YStack>
	);
}
