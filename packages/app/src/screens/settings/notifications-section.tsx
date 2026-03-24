"use client";

import { useState } from "react";
import {
	AppCard,
	Button,
	Label,
	Paragraph,
	Separator,
	SizableText,
	Spinner,
	Switch,
	XStack,
	YStack,
} from "@repo/ui";
import { useReminderPreferences, useUpdateReminders } from "../../hooks/use-settings";

const TIMING_OPTIONS = [
	{ label: "1 hour", minutes: 60 },
	{ label: "1 day", minutes: 1440 },
	{ label: "3 days", minutes: 4320 },
] as const;

export function NotificationsSection() {
	const { data: prefs, isLoading } = useReminderPreferences();
	const updateReminders = useUpdateReminders();

	const pushPref = prefs?.find((p) => p.channel === "push");
	const emailPref = prefs?.find((p) => p.channel === "email");

	const [pushEnabled, setPushEnabled] = useState(pushPref?.enabled ?? false);
	const [emailEnabled, setEmailEnabled] = useState(emailPref?.enabled ?? false);
	const [selectedTiming, setSelectedTiming] = useState(
		pushPref?.offsetMinutes ?? 1440,
	);

	if (isLoading) {
		return (
			<YStack items="center" p="$4">
				<Spinner size="small" />
			</YStack>
		);
	}

	function handleTogglePush(val: boolean) {
		setPushEnabled(val);
		updateReminders.mutate({
			channel: "push",
			enabled: val,
			offsetMinutes: selectedTiming,
		});
	}

	function handleToggleEmail(val: boolean) {
		setEmailEnabled(val);
		updateReminders.mutate({
			channel: "email",
			enabled: val,
			offsetMinutes: selectedTiming,
		});
	}

	return (
		<AppCard size="lg">
			<YStack gap="$4">
				<XStack justify="space-between" items="center">
					<YStack gap="$1" shrink={1}>
						<Label fontWeight="700">Push Notifications</Label>
						<Paragraph size="$2" color="$gray10">
							Receive push alerts for upcoming deadlines
						</Paragraph>
					</YStack>
					<Switch
						checked={pushEnabled}
						onCheckedChange={handleTogglePush}
						size="$4"
					>
						<Switch.Thumb transition="bouncy" />
					</Switch>
				</XStack>

				<Separator />

				<XStack justify="space-between" items="center">
					<YStack gap="$1" shrink={1}>
						<Label fontWeight="700">Email Notifications</Label>
						<Paragraph size="$2" color="$gray10">
							Get email reminders before deadlines
						</Paragraph>
					</YStack>
					<Switch
						checked={emailEnabled}
						onCheckedChange={handleToggleEmail}
						size="$4"
					>
						<Switch.Thumb transition="bouncy" />
					</Switch>
				</XStack>

				<Separator />

				<YStack gap="$2">
					<Label fontWeight="700">Reminder Timing</Label>
					<Paragraph size="$2" color="$gray10">
						How far in advance to send reminders
					</Paragraph>
					<XStack gap="$2" flexWrap="wrap" mt="$1">
						{TIMING_OPTIONS.map((option) => (
							<Button
								key={option.minutes}
								theme={
									selectedTiming === option.minutes
										? "purple"
										: undefined
								}
								variant={
									selectedTiming === option.minutes
										? undefined
										: "outlined"
								}
								onPress={() => setSelectedTiming(option.minutes)}
							>
								{option.label}
							</Button>
						))}
					</XStack>
				</YStack>
			</YStack>
		</AppCard>
	);
}
