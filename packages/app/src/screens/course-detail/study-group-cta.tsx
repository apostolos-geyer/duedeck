"use client";

import { AppCard, Button, H4, Paragraph, YStack } from "@repo/ui";
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
		<AppCard variant="accent" size="md">
			<YStack gap="$3">
				<H4 fontFamily="$heading" fontWeight="800" color="$color12">
					Class chat
				</H4>
				<Paragraph size="$3" color="$gray10">
					Group chat with everyone enrolled in this section of{" "}
					{courseCode}.
				</Paragraph>
				{isEnrolled ? (
					<Link
						href={`/study-buddies?sectionId=${encodeURIComponent(sectionId)}`}
						style={{ textDecoration: "none" }}
					>
						<Button theme="purple">Open class chat</Button>
					</Link>
				) : (
					<Paragraph size="$3" color="$gray9">
						Enroll in this course to join the class chat.
					</Paragraph>
				)}
				<Link href="/study-buddies" style={{ textDecoration: "none" }}>
					<Button variant="outlined" size="$3">
						All study buddies
					</Button>
				</Link>
			</YStack>
		</AppCard>
	);
}
