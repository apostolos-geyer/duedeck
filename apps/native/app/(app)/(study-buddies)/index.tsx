import { StudyBuddiesScreen } from "@repo/app/screens/study-buddies";
import { ScrollView } from "react-native";

export default function StudyBuddiesPage() {
	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<StudyBuddiesScreen />
		</ScrollView>
	);
}
