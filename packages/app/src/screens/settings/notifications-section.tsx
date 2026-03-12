"use client";

import { useState } from "react";
import { Button, H3, SizableText, Switch, XStack, YStack } from "@repo/ui";
import { MOCK_REMINDER_PREFERENCES } from "../../mock-data";

const TIMING_OPTIONS = [
	{ label: "1 hour", minutes: 60 },
	{ label: "1 day", minutes: 1440 },
	{ label: "3 days", minutes: 4320 },
] as const;

export function NotificationsSection() {
	const pushPref = MOCK_REMINDER_PREFERENCES.find(
		(p) => p.channel === "push",
	);
	const emailPref = MOCK_REMINDER_PREFERENCES.find(
		(p) => p.channel === "email",
	);

	const [pushEnabled, setPushEnabled] = useState(pushPref?.enabled ?? false);
	const [emailEnabled, setEmailEnabled] = useState(
		emailPref?.enabled ?? false,
	);
	const [selectedTiming, setSelectedTiming] = useState(
		pushPref?.offsetMinutes ?? 1440,
	);

	return (
		<YStack gap="$4">
			<H3 fontWeight="800" color="$color12">
				Notifications
			</H3>

			<YStack gap="$4">
				<XStack justify="space-between" items="center">
					<SizableText>Push Notifications</SizableText>
					<Switch
						checked={pushEnabled}
						onCheckedChange={setPushEnabled}
						size="$4"
					>
						<Switch.Thumb transition="bouncy" />
					</Switch>
				</XStack>

				<XStack justify="space-between" items="center">
					<SizableText>Email Notifications</SizableText>
					<Switch
						checked={emailEnabled}
						onCheckedChange={setEmailEnabled}
						size="$4"
					>
						<Switch.Thumb transition="bouncy" />
					</Switch>
				</XStack>

				<YStack gap="$2">
					<SizableText>Reminder Timing</SizableText>
					<XStack gap="$2" flexWrap="wrap">
						{TIMING_OPTIONS.map((option) => (
							<Button
								key={option.minutes}
								theme={
									selectedTiming === option.minutes ? "purple" : undefined
								}
								variant={
									selectedTiming === option.minutes ? undefined : "outlined"
								}
								onPress={() => setSelectedTiming(option.minutes)}
							>
								{option.label}
							</Button>
						))}
					</XStack>
				</YStack>
			</YStack>
		</YStack>
	);
}
