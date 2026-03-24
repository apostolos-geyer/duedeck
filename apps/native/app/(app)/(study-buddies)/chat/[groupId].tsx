import { useLocalSearchParams } from "expo-router";
import { ChatScreen } from "@repo/app/screens/study-buddies";

export default function GroupChatPage() {
	const { groupId } = useLocalSearchParams<{ groupId: string }>();
	return <ChatScreen groupId={groupId} />;
}
