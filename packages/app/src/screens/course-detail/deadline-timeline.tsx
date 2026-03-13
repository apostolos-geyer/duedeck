"use client";

import { H3, SizableText, View, XStack, YStack } from "@repo/ui";

interface Deadline {
	id: string;
	title: string;
	dueDate: string | Date;
	type: string;
	weight: number;
	completed: boolean;
}

interface DeadlineTimelineProps {
	deadlines: Deadline[];
}

function getTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		assignment: "Assignment",
		exam: "Exam",
		quiz: "Quiz",
		project: "Project",
		lab: "Lab",
	};
	return labels[type] ?? type;
}

function formatDate(dateStr: string | Date): string {
	return new Date(dateStr).toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

function isPast(dateStr: string | Date): boolean {
	return new Date(dateStr) < new Date();
}

export function DeadlineTimeline({ deadlines }: DeadlineTimelineProps) {
	const sorted = [...deadlines].sort(
		(a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
	);

	return (
		<YStack gap="$3">
			<H3 fontWeight="800" color="$color12">
				Deadlines
			</H3>
			<YStack gap="$0" pl="$2">
				{sorted.map((deadline, i) => {
					const past = isPast(deadline.dueDate) || deadline.completed;
					const isLast = i === sorted.length - 1;

					return (
						<XStack key={deadline.id} gap="$3" opacity={past ? 0.5 : 1}>
							{/* Timeline column: dot + line */}
							<YStack items="center" width={12}>
								<View
									width={12}
									height={12}
									rounded="$10"
									bg={past ? "$gray6" : "$color9"}
									mt="$1"
									shrink={0}
								/>
								{!isLast && (
									<View width={2} grow={1} bg="$gray4" minH={32} />
								)}
							</YStack>

							{/* Content */}
							<YStack gap="$1" pb="$4" shrink={1}>
								<SizableText
									size="$4"
									fontWeight="600"
									color="$color12"
									textDecorationLine={
										deadline.completed ? "line-through" : "none"
									}
								>
									{deadline.title}
								</SizableText>
								<SizableText size="$2" color="$gray10">
									{formatDate(deadline.dueDate)}
								</SizableText>
								<XStack gap="$2" items="center" mt="$1">
									<View bg="$gray4" rounded="$10" px="$2" py="$1">
										<SizableText
											size="$1"
											color="$gray11"
											fontWeight="500"
										>
											{getTypeLabel(deadline.type)}
										</SizableText>
									</View>
									<SizableText
										size="$2"
										fontWeight="700"
										color="$gray10"
									>
										{deadline.weight}%
									</SizableText>
								</XStack>
							</YStack>
						</XStack>
					);
				})}
			</YStack>
		</YStack>
	);
}
