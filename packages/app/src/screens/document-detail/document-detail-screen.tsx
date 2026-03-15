"use client";

import { useState } from "react";
import {
	Button,
	H2,
	H4,
	SizableText,
	Spinner,
	Theme,
	View,
	XStack,
	YStack,
} from "@repo/ui";
import { BookOpen, FileText, GraduationCap } from "@tamagui/lucide-icons";
import { useDocument } from "../../hooks/use-upload";
import { useEnroll } from "../../hooks/use-enrollment";
import { useAppRouter } from "../../hooks/use-app-router";
import { useQueryClient } from "@tanstack/react-query";
import { TYPE_THEME, type ColorTheme } from "../../lib/deadline-theme";
import { PdfViewer, MarkdownViewer } from "../upload";

type DocTab = "data" | "pdf" | "markdown";

const STATUS_CONFIG: Record<string, { label: string; theme: ColorTheme }> = {
	confirmed: { label: "Confirmed", theme: "green" },
	completed: { label: "Completed", theme: "green" },
	processing: { label: "Processing", theme: "yellow" },
	awaiting_review: { label: "Awaiting Review", theme: "orange" },
	failed: { label: "Failed", theme: "red" },
	cancelled: { label: "Cancelled", theme: "gray" },
};

interface DocumentDetailScreenProps {
	docId: string;
}

export function DocumentDetailScreen({ docId }: DocumentDetailScreenProps) {
	const router = useAppRouter();
	const queryClient = useQueryClient();
	const { data: doc, isLoading, error } = useDocument(docId);
	const enroll = useEnroll();
	const [activeTab, setActiveTab] = useState<DocTab>("data");

	if (isLoading) {
		return (
			<YStack flex={1} items="center" justify="center" gap="$3" p="$6">
				<Spinner size="large" color="$purple9" />
				<SizableText size="$3" color="$gray9">
					Loading document...
				</SizableText>
			</YStack>
		);
	}

	if (error || !doc) {
		return (
			<YStack gap="$3" p="$6">
				<SizableText color="$red9">
					{error?.message ?? "Document not found"}
				</SizableText>
				<Button theme="gray" onPress={() => router.push("/upload")}>
					Back to Upload
				</Button>
			</YStack>
		);
	}

	const section = doc.section;
	const course = section?.course;
	const school = course?.school;
	const deadlines = section?.deadlines ?? [];
	const gradeWeights = section?.gradeWeights ?? [];
	const isEnrolled = (section?.enrollments?.length ?? 0) > 0;
	const statusInfo = STATUS_CONFIG[doc.status] ?? {
		label: doc.status,
		theme: "gray" as ColorTheme,
	};

	return (
		<YStack gap="$5" maxW="$container.xxl" width="100%">
			{/* Header */}
			<YStack gap="$2">
				<XStack items="center" gap="$3">
					<FileText size={24} color="$purple9" />
					<H2 fontWeight="800" color="$color12">
						{doc.filename}
					</H2>
				</XStack>
				<XStack items="center" gap="$3">
					<Theme name={statusInfo.theme}>
						<View bg="$color9" rounded="$10" px="$2" py="$1">
							<SizableText size="$1" fontWeight="600" color="white">
								{statusInfo.label}
							</SizableText>
						</View>
					</Theme>
					<SizableText size="$2" color="$gray8">
						Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
					</SizableText>
				</XStack>
			</YStack>

			{/* Tab switcher */}
			<XStack gap="$2">
				<Button
					size="$3"
					theme={activeTab === "data" ? "purple" : "gray"}
					onPress={() => setActiveTab("data")}
				>
					Data
				</Button>
				<Button
					size="$3"
					theme={activeTab === "pdf" ? "purple" : "gray"}
					onPress={() => setActiveTab("pdf")}
				>
					PDF
				</Button>
				{doc.parsedS3Key && (
					<Button
						size="$3"
						theme={activeTab === "markdown" ? "purple" : "gray"}
						onPress={() => setActiveTab("markdown")}
					>
						Markdown
					</Button>
				)}
			</XStack>

			{/* Tab content */}
			{activeTab === "pdf" && (
				<PdfViewer s3Key={doc.s3Key} />
			)}

			{activeTab === "markdown" && doc.parsedS3Key && (
				<MarkdownViewer s3Key={doc.parsedS3Key} />
			)}

			{activeTab === "data" && (
				<YStack gap="$5">
					{/* Course info */}
					{section && course && (
						<XStack gap="$3" items="center" bg="$purple3" rounded="$4" p="$4">
							<View bg="$purple5" rounded="$4" p="$2">
								<BookOpen size={22} color="$purple11" />
							</View>
							<YStack flex={1}>
								<SizableText size="$5" fontWeight="700" color="$purple11">
									{course.code}
								</SizableText>
								<SizableText size="$3" color="$purple10">
									{course.name}
								</SizableText>
								<SizableText size="$2" color="$purple9">
									{school?.name} &middot; {section.section} &middot;{" "}
									{section.term} &middot; {section.instructor}
								</SizableText>
							</YStack>
						</XStack>
					)}

					{/* Deadlines */}
					{deadlines.length > 0 && (
						<YStack gap="$2">
							<H4 fontWeight="800" color="$color12">
								Deadlines ({deadlines.length})
							</H4>
							<YStack gap="$2" bg="$gray2" rounded="$4" p="$4">
								{deadlines.map((deadline, index) => (
									<XStack
										key={deadline.id}
										items="center"
										gap="$3"
										py="$2"
										borderBottomWidth={
											index < deadlines.length - 1 ? 1 : 0
										}
										borderBottomColor="$gray4"
									>
										<SizableText
											flex={1}
											size="$3"
											fontWeight="600"
											color="$color12"
										>
											{deadline.title}
										</SizableText>

										<View minW={100}>
											<SizableText size="$2" color="$gray10">
												{new Date(deadline.dueDate).toLocaleDateString()}
											</SizableText>
										</View>

										<Theme
											name={
												TYPE_THEME[deadline.type] ?? TYPE_THEME.other
											}
										>
											<View bg="$color4" rounded="$10" px="$2" py="$1">
												<SizableText
													size="$1"
													fontWeight="500"
													color="$color11"
												>
													{deadline.type}
												</SizableText>
											</View>
										</Theme>

										<View minW={50}>
											<SizableText
												size="$2"
												fontWeight="700"
												color="$gray10"
												text="right"
											>
												{deadline.weight}%
											</SizableText>
										</View>
									</XStack>
								))}
							</YStack>
						</YStack>
					)}

					{/* Grade weights */}
					{gradeWeights.length > 0 && (
						<YStack gap="$2">
							<XStack items="center" gap="$2">
								<GraduationCap size={20} color="$color12" />
								<H4 fontWeight="800" color="$color12">
									Grade Breakdown
								</H4>
							</XStack>
							<YStack gap="$2" bg="$gray2" rounded="$4" p="$4">
								{gradeWeights.map((weight, index) => (
									<XStack
										key={weight.id}
										items="center"
										gap="$3"
										py="$2"
										borderBottomWidth={
											index < gradeWeights.length - 1 ? 1 : 0
										}
										borderBottomColor="$gray4"
									>
										<SizableText
											flex={1}
											size="$3"
											fontWeight="600"
											color="$color12"
										>
											{weight.label}
										</SizableText>

										<Theme
											name={
												TYPE_THEME[weight.type] ?? TYPE_THEME.other
											}
										>
											<View bg="$color4" rounded="$10" px="$2" py="$1">
												<SizableText
													size="$1"
													fontWeight="500"
													color="$color11"
												>
													{weight.type}
												</SizableText>
											</View>
										</Theme>

										<View minW={50}>
											<SizableText
												size="$2"
												fontWeight="700"
												color="$gray10"
												text="right"
											>
												{weight.weight}%
											</SizableText>
										</View>
									</XStack>
								))}
							</YStack>
						</YStack>
					)}
				</YStack>
			)}

			{/* Actions */}
			<XStack gap="$3">
				{section && !isEnrolled && (
					<Button
						theme="green"
						onPress={() =>
							enroll.mutate(
								{ sectionId: section.id },
								{
									onSuccess: () =>
										queryClient.invalidateQueries(),
								},
							)
						}
						disabled={enroll.isPending}
					>
						{enroll.isPending ? "Enrolling..." : "Enroll in Course"}
					</Button>
				)}
				{section && (
					<Button
						theme="purple"
						onPress={() => router.push(`/course/${section.id}`)}
					>
						View Course
					</Button>
				)}
				<Button
					variant="outlined"
					onPress={() => router.push("/dashboard")}
				>
					Dashboard
				</Button>
			</XStack>
		</YStack>
	);
}
