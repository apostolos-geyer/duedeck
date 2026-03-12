"use client";

import { Button, H4, SizableText, Theme, View, XStack, YStack } from "@repo/ui";
import { BookOpen } from "@tamagui/lucide-icons";

interface MockDeadline {
	title: string;
	date: string;
	type: string;
	weight: number;
	theme: string;
}

const MOCK_DEADLINES: MockDeadline[] = [
	{ title: "Assignment 1", date: "Jan 23, 2026", type: "Assignment", weight: 8, theme: "blue" },
	{ title: "Midterm Exam", date: "Feb 13, 2026", type: "Exam", weight: 25, theme: "red" },
	{ title: "Assignment 2", date: "Mar 6, 2026", type: "Assignment", weight: 8, theme: "blue" },
	{ title: "Group Project", date: "Mar 27, 2026", type: "Project", weight: 20, theme: "purple" },
	{ title: "Final Exam", date: "Apr 15, 2026", type: "Exam", weight: 35, theme: "red" },
];

interface CourseInfo {
	code: string;
	name: string;
}

interface DeadlinePreviewProps {
	courseInfo?: CourseInfo;
	contentHash?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function DeadlinePreview({
	courseInfo,
	contentHash,
	onConfirm,
	onCancel,
}: DeadlinePreviewProps) {
	return (
		<YStack gap="$4">
			{courseInfo && (
				<XStack gap="$3" items="center" bg="$purple3" rounded="$4" p="$4">
					<View bg="$purple5" rounded="$4" p="$2">
						<BookOpen size={22} color="$purple11" />
					</View>
					<YStack flex={1}>
						<SizableText size="$5" fontWeight="700" color="$purple11">
							{courseInfo.code}
						</SizableText>
						<SizableText size="$3" color="$purple10">
							{courseInfo.name}
						</SizableText>
					</YStack>
				</XStack>
			)}

			{contentHash && (
				<SizableText size="$2" color="$gray8">
					Content hash: {contentHash}
				</SizableText>
			)}

			<YStack gap="$2">
				<H4 fontWeight="800" color="$color12">
					Extracted Deadlines
				</H4>
				<SizableText size="$3" color="$gray9">
					We found the following deadlines in your syllabus. Review them
					before adding to your course.
				</SizableText>
			</YStack>

			<YStack gap="$2" bg="$gray2" rounded="$4" p="$4">
				{MOCK_DEADLINES.map((deadline) => (
					<XStack
						key={deadline.title}
						items="center"
						gap="$3"
						py="$2"
						borderBottomWidth={1}
						borderBottomColor="$gray4"
					>
						<SizableText
							flex={1}
							size="$3"
							fontWeight="600"
							color="$color12"
						>
							{deadline.title}
						</SizableText>

						<View minW={100}>
							<SizableText size="$2" color="$gray10">
								{deadline.date}
							</SizableText>
						</View>

						<Theme name={deadline.theme as any}>
							<View bg="$color4" rounded="$10" px="$2" py="$1">
								<SizableText size="$1" fontWeight="500" color="$color11">
									{deadline.type}
								</SizableText>
							</View>
						</Theme>

						<View minW={50}>
							<SizableText
								size="$2"
								fontWeight="700"
								color="$gray10"
								text="right"
							>
								{deadline.weight}%
							</SizableText>
						</View>
					</XStack>
				))}
			</YStack>

			<XStack gap="$3" justify="flex-end">
				<Button variant="outlined" onPress={onCancel}>
					Cancel
				</Button>
				<Button theme="purple" onPress={onConfirm}>
					Confirm &amp; Add Course
				</Button>
			</XStack>
		</YStack>
	);
}
