"use client";

import { Button, H4, SizableText, Spinner, View, XStack, YStack } from "@repo/ui";
import { FileText, User, Users } from "@tamagui/lucide-icons";
import { useUploadSections } from "../../hooks/use-upload";

interface SectionPickerProps {
	course: { id: string; code: string; name: string };
	onSelectSection: (section: { id: string; section: string; instructor: string }) => void;
	onBack: () => void;
}

export function SectionPicker({ course, onSelectSection, onBack }: SectionPickerProps) {
	const { data: sections, isLoading } = useUploadSections(course.id);

	return (
		<YStack gap="$4">
			<YStack gap="$2">
				<Button unstyled onPress={onBack} self="flex-start">
					<SizableText size="$3" color="$purple9" fontWeight="600">
						&larr; Back to search
					</SizableText>
				</Button>

				<H4 fontWeight="800" color="$color12">
					{course.code} &mdash; Pick a Section
				</H4>
				<SizableText size="$3" color="$gray9">
					Choose your section for {course.name}
				</SizableText>
			</YStack>

			{isLoading ? (
				<YStack items="center" py="$6">
					<Spinner size="small" />
				</YStack>
			) : (
				<YStack gap="$2">
					{(sections ?? []).length === 0 ? (
						<YStack items="center" py="$6">
							<SizableText size="$3" color="$gray8">
								No sections available
							</SizableText>
						</YStack>
					) : (
						(sections ?? []).map((section) => (
							<Button
								key={section.id}
								unstyled
								onPress={() =>
									onSelectSection({
										id: section.id,
										section: section.section,
										instructor: section.instructor,
									})
								}
							>
								<XStack
									bg="$gray2"
									rounded="$4"
									p="$4"
									gap="$4"
									items="center"
									hoverStyle={{ bg: "$gray3" }}
									pressStyle={{ bg: "$gray4" }}
									cursor="pointer"
									width="100%"
									$sm={{ flexDirection: "column", items: "flex-start" }}
								>
									<YStack flex={1} gap="$1">
										<XStack gap="$2" items="center">
											<View bg="$purple4" rounded="$10" px="$2" py="$1">
												<SizableText
													size="$2"
													fontWeight="700"
													color="$purple11"
												>
													Sec {section.section}
												</SizableText>
											</View>
										</XStack>
										<XStack gap="$1.5" items="center">
											<User size={14} color="$gray8" />
											<SizableText size="$3" color="$gray10">
												{section.instructor}
											</SizableText>
										</XStack>
									</YStack>

									<XStack gap="$4" items="center">
										<XStack gap="$1.5" items="center">
											<Users size={14} color="$gray8" />
											<SizableText size="$2" color="$gray9">
												{section._count.enrollments} students
											</SizableText>
										</XStack>
										<XStack gap="$1.5" items="center">
											<FileText size={14} color="$gray8" />
											<SizableText size="$2" color="$gray9">
												{section._count.documents}{" "}
												{section._count.documents === 1
													? "doc"
													: "docs"}
											</SizableText>
										</XStack>
									</XStack>
								</XStack>
							</Button>
						))
					)}
				</YStack>
			)}
		</YStack>
	);
}
