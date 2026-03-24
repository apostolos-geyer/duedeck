import { useLocalSearchParams } from "expo-router";
import { DirectChatScreen } from "@repo/app/screens/messages";

export default function DirectMessagePage() {
	const { peerId } = useLocalSearchParams<{ peerId: string }>();
	return <DirectChatScreen peerUserId={peerId} />;
}
