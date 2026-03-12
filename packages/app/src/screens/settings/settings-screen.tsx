"use client";

import { Separator, YStack } from "@repo/ui";
import { ProfileSection } from "./profile-section";
import { NotificationsSection } from "./notifications-section";
import { CalendarsSection } from "./calendars-section";
import { SubscriptionSection } from "./subscription-section";

export function SettingsScreen() {
	return (
		<YStack gap="$4" $md={{ gap: "$6" }} maxW="$container.xxl" width="100%">
			<ProfileSection />
			<Separator />
			<NotificationsSection />
			<Separator />
			<CalendarsSection />
			<Separator />
			<SubscriptionSection />
		</YStack>
	);
}
