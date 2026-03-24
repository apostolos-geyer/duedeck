import { useLocalSearchParams } from "expo-router";
import { CourseDetailScreen } from "@repo/app/screens/course-detail";

export default function CourseDetailPage() {
	const { courseId } = useLocalSearchParams<{ courseId: string }>();
	return <CourseDetailScreen sectionId={courseId} />;
}
