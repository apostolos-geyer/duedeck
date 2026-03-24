"use client";

import { useState } from "react";
import { SizableText, Tabs, YStack } from "@repo/ui";
import { ProfileSection } from "./profile-section";
import { NotificationsSection } from "./notifications-section";
import { CalendarsSection } from "./calendars-section";

const TABS = [
	{ key: "profile", label: "Profile" },
	{ key: "notifications", label: "Notifications" },
	{ key: "calendar", label: "Calendar" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function SettingsScreen() {
	const [activeTab, setActiveTab] = useState<TabKey>("profile");

	return (
		<YStack gap="$4" maxW="$container.xxl" width="100%">
			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as TabKey)}
				orientation="horizontal"
				flexDirection="column"
			>
				<Tabs.List gap="$2" mb="$4">
					{TABS.map((tab) => (
						<Tabs.Tab
							key={tab.key}
							value={tab.key}
							rounded={0}
							borderWidth={2}
							borderColor={activeTab === tab.key ? "$purple9" : "$gray6"}
							bg={activeTab === tab.key ? "$purple3" : "$gray1"}
							px="$4"
							py="$2"
						>
							<SizableText
								fontWeight="700"
								color={activeTab === tab.key ? "$purple11" : "$color12"}
							>
								{tab.label}
							</SizableText>
						</Tabs.Tab>
					))}
				</Tabs.List>

				<Tabs.Content value="profile">
					<ProfileSection />
				</Tabs.Content>

				<Tabs.Content value="notifications">
					<NotificationsSection />
				</Tabs.Content>

				<Tabs.Content value="calendar">
					<CalendarsSection />
				</Tabs.Content>
			</Tabs>
		</YStack>
	);
}
