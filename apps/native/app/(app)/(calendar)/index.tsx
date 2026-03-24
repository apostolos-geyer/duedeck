import { CalendarScreen } from "@repo/app/screens/calendar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CalendarPage() {
	return (
		<SafeAreaView style={{ flex: 1 }} edges={["top"]}>
			<CalendarScreen />
		</SafeAreaView>
	);
}
