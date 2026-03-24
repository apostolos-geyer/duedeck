import { Stack } from "expo-router/stack";

export default function GroupsLayout() {
	return (
		<Stack>
			<Stack.Screen name="study-buddies/index" options={{ title: "Study Groups", headerLargeTitle: true }} />
			<Stack.Screen name="study-buddies/chat/[groupId]" options={{ title: "Chat" }} />
		</Stack>
	);
}
