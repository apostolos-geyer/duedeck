"use client";

import { useState } from "react";
import { Button, H4, Input, SizableText, Spinner, View, XStack, YStack } from "@repo/ui";
import { Search, Users, BookOpen } from "@tamagui/lucide-icons";
import { useUploadCourses } from "../../hooks/use-upload";

interface CourseSearchProps {
	onSelectCourse: (course: { id: string; code: string; name: string }) => void;
}

export function CourseSearch({ onSelectCourse }: CourseSearchProps) {
	const [query, setQuery] = useState("");
	const { data: courses, isLoading } = useUploadCourses(query || undefined);

	return (
		<YStack gap="$4">
			<YStack gap="$2">
				<H4 fontWeight="800" color="$color12">
					Find Your Course
				</H4>
				<SizableText size="$3" color="$gray9">
					Search for a course at your school to get started
				</SizableText>
			</YStack>

			<XStack gap="$2" items="center" bg="$gray2" rounded="$4" px="$3" py="$2">
				<Search size={18} color="$gray9" />
				<Input
					flex={1}
					placeholder="Search by course code or name..."
					value={query}
					onChangeText={setQuery}
					bg="transparent"
					borderWidth={0}
					size="$4"
					p="$0"
				/>
			</XStack>

			{isLoading ? (
				<YStack items="center" py="$6">
					<Spinner size="small" />
				</YStack>
			) : (
				<YStack gap="$2">
					{(courses ?? []).length === 0 ? (
						<YStack items="center" py="$6">
							<SizableText size="$3" color="$gray8">
								No courses found{query ? ` matching "${query}"` : ""}
							</SizableText>
						</YStack>
					) : (
						(courses ?? []).map((course) => (
							<Button
								key={course.id}
								unstyled
								onPress={() =>
									onSelectCourse({
										id: course.id,
										code: course.code,
										name: course.name,
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
										<SizableText
											size="$5"
											fontWeight="700"
											color="$color12"
										>
											{course.code}
										</SizableText>
										<SizableText size="$3" color="$gray10">
											{course.name}
										</SizableText>
									</YStack>

									<XStack gap="$4" items="center">
										<XStack gap="$1.5" items="center">
											<Users size={14} color="$gray8" />
											<SizableText size="$2" color="$gray9">
												{course.totalEnrollments}
											</SizableText>
										</XStack>
										<XStack gap="$1.5" items="center">
											<BookOpen size={14} color="$gray8" />
											<SizableText size="$2" color="$gray9">
												{course._count.sections}{" "}
												{course._count.sections === 1
													? "section"
													: "sections"}
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
