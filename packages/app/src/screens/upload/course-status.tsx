"use client";

import { Button, H4, SizableText, View, XStack, YStack } from "@repo/ui";
import { BookOpen, CheckCircle, FileText, Upload, User } from "@tamagui/lucide-icons";
import type { BrowseCourse, BrowseSection } from "../../mock-data";
import { MOCK_DOCUMENTS, MOCK_DEADLINES } from "../../mock-data";

interface CourseStatusProps {
	course: BrowseCourse;
	section: BrowseSection;
	onEnroll: () => void;
	onUpload: () => void;
	onBack: () => void;
}

export function CourseStatus({ course, section, onEnroll, onUpload, onBack }: CourseStatusProps) {
	const docs = MOCK_DOCUMENTS.filter((d) => d.sectionId === section.id);
	const parsedDocs = docs.filter((d) => d.status === "completed");
	const deadlines = MOCK_DEADLINES.filter((d) => d.sectionId === section.id);
	const hasDocuments = parsedDocs.length > 0;

	return (
		<YStack gap="$5">
			<YStack gap="$2">
				<Button
					unstyled
					onPress={onBack}
					self="flex-start"
				>
					<SizableText size="$3" color="$purple9" fontWeight="600">
						&larr; Back to sections
					</SizableText>
				</Button>

				<XStack gap="$3" items="center">
					<View bg="$purple4" rounded="$4" p="$3">
						<BookOpen size={28} color="$purple9" />
					</View>
					<YStack>
						<H4 fontWeight="800" color="$color12">
							{course.code}
						</H4>
						<SizableText size="$3" color="$gray10">
							{course.name}
						</SizableText>
						<XStack gap="$1.5" items="center" mt="$1">
							<User size={12} color="$gray8" />
							<SizableText size="$2" color="$gray9">
								Sec {section.section} &mdash; {section.instructor}
							</SizableText>
						</XStack>
					</YStack>
				</XStack>
			</YStack>

			{hasDocuments ? (
				<YStack gap="$4">
					<YStack bg="$green3" rounded="$4" p="$5" gap="$3" items="center">
						<CheckCircle size={48} color="$green9" />
						<SizableText
							size="$5"
							fontWeight="700"
							color="$green11"
							text="center"
						>
							Course content available!
						</SizableText>
						<SizableText size="$3" color="$green10" text="center">
							This section already has {parsedDocs.length} parsed{" "}
							{parsedDocs.length === 1 ? "document" : "documents"} with{" "}
							{deadlines.length} deadlines extracted. You can enroll directly
							or upload a new syllabus.
						</SizableText>
					</YStack>

					<XStack
						gap="$3"
						$sm={{ flexDirection: "column" }}
					>
						<Button
							theme="green"
							flex={1}
							onPress={onEnroll}
							icon={<CheckCircle size={18} />}
						>
							Enroll Now
						</Button>
						<Button
							theme="purple"
							flex={1}
							onPress={onUpload}
							icon={<Upload size={18} />}
						>
							Upload New Syllabus
						</Button>
					</XStack>
				</YStack>
			) : (
				<YStack gap="$4">
					<YStack bg="$gray3" rounded="$4" p="$5" gap="$3" items="center">
						<FileText size={48} color="$gray8" />
						<SizableText
							size="$5"
							fontWeight="700"
							color="$color12"
							text="center"
						>
							No syllabus yet
						</SizableText>
						<SizableText size="$3" color="$gray9" text="center">
							No one has uploaded a syllabus for this section yet. Be the first!
						</SizableText>
					</YStack>

					<Button
						theme="purple"
						onPress={onUpload}
						icon={<Upload size={18} />}
					>
						Upload Syllabus
					</Button>
				</YStack>
			)}
		</YStack>
	);
}
