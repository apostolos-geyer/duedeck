"use client";

import { AppCard, H3, ListItem, SizableText, View, XStack, YStack } from "@repo/ui";

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

function isOverdue(deadline: Deadline): boolean {
	return isPast(deadline.dueDate) && !deadline.completed;
}

export function DeadlineTimeline({ deadlines }: DeadlineTimelineProps) {
	const sorted = [...deadlines].sort(
		(a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
	);

	return (
		<AppCard size="md">
			<YStack gap="$3">
				<H3 fontFamily="$heading" fontWeight="800" color="$color12">
					Deadlines
				</H3>
				<YStack gap="$0">
					{sorted.map((deadline) => {
						const past =
							isPast(deadline.dueDate) && deadline.completed;
						const overdue = isOverdue(deadline);

						return (
							<ListItem
								key={deadline.id}
								bg={
									overdue
										? "$red2"
										: past
											? "$gray3"
											: "transparent"
								}
								rounded={0}
								py="$2"
								px="$3"
								borderBottomWidth={1}
								borderColor="$gray4"
								title={
									<SizableText
										size="$4"
										fontWeight="600"
										color="$color12"
										textDecorationLine={
											deadline.completed
												? "line-through"
												: "none"
										}
									>
										{deadline.title}
									</SizableText>
								}
								subTitle={
									<XStack gap="$2" items="center" mt="$1">
										<View
											bg="$gray4"
											rounded={0}
											px="$2"
											py="$1"
										>
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
											fontVariant={["tabular-nums"]}
										>
											{deadline.weight}%
										</SizableText>
									</XStack>
								}
								iconAfter={
									<SizableText
										size="$2"
										color="$gray10"
										fontVariant={["tabular-nums"]}
									>
										{formatDate(deadline.dueDate)}
									</SizableText>
								}
							/>
						);
					})}
				</YStack>
			</YStack>
		</AppCard>
	);
}
