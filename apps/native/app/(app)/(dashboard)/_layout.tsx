import { Stack } from "expo-router/stack";

export default function DashboardLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ title: "Home", headerLargeTitle: true }} />
			<Stack.Screen name="course/[courseId]" options={{ title: "Course" }} />
			<Stack.Screen name="doc/[id]" options={{ title: "Document" }} />
			<Stack.Screen name="upload/index" options={{ title: "Upload" }} />
			<Stack.Screen name="messages/[peerId]" options={{ title: "Message" }} />
		</Stack>
	);
}
