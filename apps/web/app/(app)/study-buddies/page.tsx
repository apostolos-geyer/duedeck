import { StudyBuddiesScreen } from "@repo/app/screens/study-buddies";

/** Avoid serving a stale RSC/SSR snapshot of this client tree after UI copy changes. */
export const dynamic = "force-dynamic";

export default async function StudyBuddiesPage({
	searchParams,
}: {
	searchParams: Promise<{ sectionId?: string }>;
}) {
	const { sectionId } = await searchParams;
	return <StudyBuddiesScreen initialSectionId={sectionId} />;
}
