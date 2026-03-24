"use client";

import { Button, H4, SizableText, YStack } from "@repo/ui";
import { Link } from "../../components/link";

interface StudyGroupCTAProps {
	courseCode: string;
	sectionId: string;
	isEnrolled: boolean;
}

export function StudyGroupCTA({
	courseCode,
	sectionId,
	isEnrolled,
}: StudyGroupCTAProps) {
	return (
		<YStack bg="$gray2" rounded="$4" p="$5" gap="$3">
			<H4 fontWeight="800" color="$color12">
				Class chat
			</H4>
			<SizableText size="$3" color="$gray10">
				Group chat with everyone enrolled in this section of {courseCode}.
			</SizableText>
			{isEnrolled ? (
				<Link
					href={`/study-buddies?sectionId=${encodeURIComponent(sectionId)}`}
					style={{ textDecoration: "none" }}
				>
					<Button theme="purple">Open class chat</Button>
				</Link>
			) : (
				<SizableText size="$3" color="$gray9">
					Enroll in this course to join the class chat.
				</SizableText>
			)}
			<Link href="/study-buddies" style={{ textDecoration: "none" }}>
				<Button variant="outlined" size="$3">
					All study buddies
				</Button>
			</Link>
		</YStack>
	);
}
