import { DocumentDetailScreen } from "@repo/app/screens/document-detail";

export default async function DocPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <DocumentDetailScreen docId={id} />;
}
