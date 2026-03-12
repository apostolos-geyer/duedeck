"use client";

import { useCallback, useState } from "react";
import { Button, H2, SizableText, Spinner, YStack } from "@repo/ui";
import type { BrowseCourse, BrowseSection } from "../../mock-data";
import { CourseSearch } from "./course-search";
import { SectionPicker } from "./section-picker";
import { CourseStatus } from "./course-status";
import { DropZone } from "./drop-zone";

type Step = "search" | "pick-section" | "course-status" | "upload";

interface UploadScreenProps {
	onNavigateCourse?: (sectionId: string) => void;
	onUpload?: (input: { file: File; sectionId: string }) => Promise<void>;
	uploading?: boolean;
	uploadError?: string | null;
}

export function UploadScreen({
	onNavigateCourse,
	onUpload,
	uploading,
	uploadError,
}: UploadScreenProps) {
	const [step, setStep] = useState<Step>("search");
	const [selectedCourse, setSelectedCourse] = useState<BrowseCourse | null>(null);
	const [selectedSection, setSelectedSection] = useState<BrowseSection | null>(null);
	const [file, setFile] = useState<File | null>(null);

	const handleSelectCourse = useCallback((course: BrowseCourse) => {
		setSelectedCourse(course);
		setStep("pick-section");
	}, []);

	const handleSelectSection = useCallback((section: BrowseSection) => {
		setSelectedSection(section);
		setStep("course-status");
	}, []);

	const handleBackToSearch = useCallback(() => {
		setSelectedCourse(null);
		setSelectedSection(null);
		setStep("search");
	}, []);

	const handleBackToSections = useCallback(() => {
		setSelectedSection(null);
		setStep("pick-section");
	}, []);

	const handleEnroll = useCallback(() => {
		// TODO: enroll logic
	}, []);

	const handleGoToUpload = useCallback(() => {
		setStep("upload");
	}, []);

	const handleFileSelected = useCallback((f: File) => {
		setFile(f);
	}, []);

	const handleUpload = useCallback(() => {
		if (!file || !selectedSection || !onUpload) return;
		onUpload({ file, sectionId: selectedSection.id });
	}, [file, selectedSection, onUpload]);

	const getSubtitle = () => {
		switch (step) {
			case "search":
				return "Find your course and enroll or upload a syllabus";
			case "pick-section":
				return "Choose your section";
			case "course-status":
				return "Review section status and choose an action";
			case "upload":
				return "Upload a course syllabus PDF to automatically extract deadlines";
		}
	};

	return (
		<YStack gap="$5" maxW="$container.xxl" width="100%">
			<YStack gap="$1">
				<H2 fontWeight="800" color="$color12">
					Upload Syllabus
				</H2>
				<SizableText size="$3" color="$gray9">
					{getSubtitle()}
				</SizableText>
			</YStack>

			{step === "search" && (
				<CourseSearch onSelectCourse={handleSelectCourse} />
			)}

			{step === "pick-section" && selectedCourse && (
				<SectionPicker
					course={selectedCourse}
					onSelectSection={handleSelectSection}
					onBack={handleBackToSearch}
				/>
			)}

			{step === "course-status" && selectedCourse && selectedSection && (
				<CourseStatus
					course={selectedCourse}
					section={selectedSection}
					onEnroll={handleEnroll}
					onUpload={handleGoToUpload}
					onBack={handleBackToSections}
				/>
			)}

			{step === "upload" && (
				<YStack gap="$4">
					{selectedCourse && (
						<Button
							unstyled
							onPress={() => setStep("course-status")}
							self="flex-start"
						>
							<SizableText size="$3" color="$purple9" fontWeight="600">
								&larr; Back to {selectedCourse.code}
							</SizableText>
						</Button>
					)}

					<DropZone onFileSelected={handleFileSelected} />

					{uploadError && (
						<SizableText size="$3" color="$red9">
							{uploadError}
						</SizableText>
					)}

					<Button
						theme="purple"
						disabled={!file || uploading}
						opacity={file && !uploading ? 1 : 0.5}
						onPress={handleUpload}
					>
						{uploading ? (
							<>
								<Spinner size="small" color="white" />
								Uploading...
							</>
						) : (
							"Upload & Process"
						)}
					</Button>
				</YStack>
			)}
		</YStack>
	);
}
