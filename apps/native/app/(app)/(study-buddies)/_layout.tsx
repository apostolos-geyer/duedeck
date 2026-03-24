import { Stack } from "expo-router/stack";

export default function StudyBuddiesLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ title: "Study Groups", headerLargeTitle: true }} />
			<Stack.Screen name="chat/[groupId]" options={{ title: "Chat" }} />
		</Stack>
	);
}
