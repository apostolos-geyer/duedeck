import { DashboardScreen } from "@repo/app/screens/dashboard";
import { ScrollView } from "react-native";

export default function DashboardPage() {
	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
			<DashboardScreen />
		</ScrollView>
	);
}
