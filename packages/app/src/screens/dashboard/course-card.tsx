"use client";

import { H4, Paragraph, SizableText, Theme, XStack, YStack } from "@repo/ui";
import { AppCard } from "@repo/ui";

interface CourseCardProps {
	section: {
		id: string;
		section: string;
		instructor: string;
		theme: string;
		course: { code: string; name: string };
	};
	nextDeadline?: {
		title: string;
		dueDate: string | Date;
	};
	courseTermEnded?: boolean;
}

export function CourseCard({
	section,
	nextDeadline,
	courseTermEnded,
	...rest
}: CourseCardProps & Record<string, unknown>) {
	return (
		<Theme name={section.theme as any}>
			<AppCard
				{...rest}
				variant="outlined"
				size="sm"
				borderLeftWidth={4}
				borderLeftColor="$color9"
				hoverStyle={{ bg: "$gray2" }}
				pressStyle={{ bg: "$gray3" }}
				cursor="pointer"
			>
				<XStack justify="space-between" items="center" gap="$2">
					<YStack gap="$1" flex={1}>
						<H4 fontFamily="$heading" color="$color12">
							{section.course.code}
						</H4>
						<Paragraph size="$2" color="$gray10" numberOfLines={1}>
							{section.course.name}
						</Paragraph>
					</YStack>
					{courseTermEnded ? (
						<SizableText size="$1" color="$gray9" fontWeight="600">
							Ended
						</SizableText>
					) : nextDeadline ? (
						<YStack items="flex-end" gap={2}>
							<SizableText size="$1" color="$gray9">
								Next
							</SizableText>
							<SizableText size="$2" fontWeight="600" color="$color11">
								{new Date(nextDeadline.dueDate).toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								})}
							</SizableText>
						</YStack>
					) : null}
				</XStack>
			</AppCard>
		</Theme>
	);
}
