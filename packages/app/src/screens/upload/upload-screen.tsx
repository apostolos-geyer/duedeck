"use client";

import { useCallback, useState } from "react";
import { Button, H2, SizableText, YStack } from "@repo/ui";
import { CheckCircle } from "@tamagui/lucide-icons";
import type { BrowseCourse, BrowseSection } from "../../mock-data";
import { CourseSearch } from "./course-search";
import { SectionPicker } from "./section-picker";
import { CourseStatus } from "./course-status";
import { DropZone } from "./drop-zone";
import { ProcessingSteps } from "./processing-steps";
import { DeadlinePreview } from "./deadline-preview";

type Step = "search" | "pick-section" | "course-status" | "upload" | "processing" | "preview" | "done";

interface UploadScreenProps {
	onNavigateCourse?: (sectionId: string) => void;
}

const MOCK_CONTENT_HASH = "a7f3b2c9e1d4f8a0b5c6d7e8f9a0b1c2";

export function UploadScreen({ onNavigateCourse }: UploadScreenProps) {
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
		setStep("done");
	}, []);

	const handleGoToUpload = useCallback(() => {
		setStep("upload");
	}, []);

	const handleFileSelected = useCallback((f: File) => {
		setFile(f);
	}, []);

	const handleUpload = useCallback(() => {
		if (!file) return;
		setStep("processing");
	}, [file]);

	const handleProcessingComplete = useCallback(() => {
		setStep("preview");
	}, []);

	const handleConfirm = useCallback(() => {
		setStep("done");
	}, []);

	const handleCancel = useCallback(() => {
		setStep("upload");
		setFile(null);
	}, []);

	const handleViewCourse = useCallback(() => {
		if (selectedSection && onNavigateCourse) {
			onNavigateCourse(selectedSection.id);
		}
	}, [selectedSection, onNavigateCourse]);

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
			case "processing":
				return "Processing your syllabus...";
			case "preview":
				return "Review extracted deadlines before confirming";
			case "done":
				return "You're all set!";
		}
	};

	return (
		<YStack gap="$5" maxW="$container.xxl" width="100%">
			<YStack gap="$1">
				<H2 fontWeight="800" color="$color12">
					{step === "done" ? "All Done!" : "Upload Syllabus"}
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

					<Button
						theme="purple"
						disabled={!file}
						opacity={file ? 1 : 0.5}
						onPress={handleUpload}
					>
						Upload &amp; Process
					</Button>
				</YStack>
			)}

			{step === "processing" && (
				<ProcessingSteps onComplete={handleProcessingComplete} />
			)}

			{step === "preview" && (
				<DeadlinePreview
					courseInfo={
						selectedCourse
							? { code: selectedCourse.code, name: selectedCourse.name }
							: undefined
					}
					contentHash={MOCK_CONTENT_HASH}
					onConfirm={handleConfirm}
					onCancel={handleCancel}
				/>
			)}

			{step === "done" && selectedCourse && selectedSection && (
				<YStack items="center" gap="$4" py="$8">
					<CheckCircle size={64} color="$green9" />
					<SizableText size="$6" fontWeight="700" color="$color12">
						Enrolled in {selectedCourse.code} Sec {selectedSection.section} ({selectedSection.instructor})
					</SizableText>
					<SizableText size="$3" color="$gray9" text="center">
						Your deadlines have been imported and are ready to track.
					</SizableText>
					<Button theme="green" onPress={handleViewCourse}>
						View Course
					</Button>
				</YStack>
			)}
		</YStack>
	);
}
