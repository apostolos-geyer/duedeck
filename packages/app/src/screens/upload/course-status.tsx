"use client";

import { Button, H4, SizableText, View, XStack, YStack } from "@repo/ui";
import { BookOpen, CheckCircle, FileText, Upload, User } from "@tamagui/lucide-icons";

interface CourseStatusProps {
	course: { id: string; code: string; name: string };
	section: { id: string; section: string; instructor: string };
	onEnroll: () => void;
	onUpload: () => void;
	onBack: () => void;
}

export function CourseStatus({
	course,
	section,
	onEnroll,
	onUpload,
	onBack,
}: CourseStatusProps) {
	return (
		<YStack gap="$5">
			<YStack gap="$2">
				<Button unstyled onPress={onBack} self="flex-start">
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

			<YStack gap="$4">
				<YStack bg="$gray3" rounded="$4" p="$5" gap="$3" items="center">
					<FileText size={48} color="$gray8" />
					<SizableText
						size="$5"
						fontWeight="700"
						color="$color12"
						text="center"
					>
						Ready to get started
					</SizableText>
					<SizableText size="$3" color="$gray9" text="center">
						Enroll in this section or upload a syllabus to extract deadlines.
					</SizableText>
				</YStack>

				<XStack gap="$3" $sm={{ flexDirection: "column" }}>
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
						Upload Syllabus
					</Button>
				</XStack>
			</YStack>
		</YStack>
	);
}
