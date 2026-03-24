import { useLocalSearchParams } from "expo-router";
import { DocumentDetailScreen } from "@repo/app/screens/document-detail";

export default function DocPage() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <DocumentDetailScreen docId={id} />;
}
