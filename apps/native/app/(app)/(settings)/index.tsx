import { SettingsScreen } from "@repo/app/screens/settings";
import { ScrollView } from "react-native";

export default function SettingsPage() {
	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<SettingsScreen />
		</ScrollView>
	);
}
