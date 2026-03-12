"use client";

import { useMemo, useState } from "react";
import { Button, H4, Input, SizableText, View, XStack, YStack } from "@repo/ui";
import { Search, Users, BookOpen } from "@tamagui/lucide-icons";
import type { BrowseCourse } from "../../mock-data";
import { MOCK_BROWSE_COURSES } from "../../mock-data";

interface CourseSearchProps {
	onSelectCourse: (course: BrowseCourse) => void;
}

export function CourseSearch({ onSelectCourse }: CourseSearchProps) {
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		if (!query.trim()) return MOCK_BROWSE_COURSES;
		const q = query.toLowerCase();
		return MOCK_BROWSE_COURSES.filter(
			(c) =>
				c.code.toLowerCase().includes(q) ||
				c.name.toLowerCase().includes(q),
		);
	}, [query]);

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

			<YStack gap="$2">
				{filtered.length === 0 ? (
					<YStack items="center" py="$6">
						<SizableText size="$3" color="$gray8">
							No courses found matching &quot;{query}&quot;
						</SizableText>
					</YStack>
				) : (
					filtered.map((course) => (
						<Button
							key={course.id}
							unstyled
							onPress={() => onSelectCourse(course)}
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
									<SizableText size="$5" fontWeight="700" color="$color12">
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
											{course.studentCount}
										</SizableText>
									</XStack>
									<XStack gap="$1.5" items="center">
										<BookOpen size={14} color="$gray8" />
										<SizableText size="$2" color="$gray9">
											{course.sectionCount} {course.sectionCount === 1 ? "section" : "sections"}
										</SizableText>
									</XStack>
								</XStack>
							</XStack>
						</Button>
					))
				)}
			</YStack>
		</YStack>
	);
}
