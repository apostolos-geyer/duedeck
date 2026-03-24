import { Stack } from "expo-router/stack";

export default function MessagesLayout() {
	return (
		<Stack>
			<Stack.Screen name="[peerId]" options={{ title: "Message" }} />
		</Stack>
	);
}
