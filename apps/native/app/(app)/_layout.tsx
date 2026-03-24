import { useSession } from "@repo/auth/client";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { YStack, Spinner } from "@repo/ui";

export default function AppLayout() {
	const { data: session, isPending } = useSession();

	if (isPending) {
		return (
			<YStack flex={1} items="center" justify="center">
				<Spinner size="large" />
			</YStack>
		);
	}

	if (!session) {
		return <Redirect href="/(auth)" />;
	}

	return (
		<NativeTabs>
			<NativeTabs.Trigger name="(dashboard)">
				<NativeTabs.Trigger.Icon sf="house.fill" md="home" />
				<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="(calendar)">
				<NativeTabs.Trigger.Icon sf="calendar" md="event" />
				<NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="(study-buddies)">
				<NativeTabs.Trigger.Icon sf="person.2.fill" md="group" />
				<NativeTabs.Trigger.Label>Groups</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="(settings)">
				<NativeTabs.Trigger.Icon sf="gear" md="settings" />
				<NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
