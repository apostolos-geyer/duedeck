import { StudyBuddiesScreen } from "@repo/app/screens/study-buddies";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";

export default function StudyBuddiesPage() {
	const router = useRouter();
	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<StudyBuddiesScreen
				onNavigateToChat={(groupId) => router.push(`/study-buddies/chat/${groupId}` as never)}
			/>
		</ScrollView>
	);
}
