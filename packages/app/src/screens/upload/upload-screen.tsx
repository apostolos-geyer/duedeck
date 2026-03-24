"use client";

import { useCallback, useState } from "react";
import {
	AppCard,
	Button,
	H4,
	Paragraph,
	SizableText,
	Spinner,
	View,
	XStack,
	YStack,
} from "@repo/ui";
import { AlertCircle } from "@tamagui/lucide-icons";
import { usePresign, useStartDocument, useCancelActiveDocuments } from "../../hooks/use-upload";
import { useAppRouter } from "../../hooks/use-app-router";
import { useActiveRun } from "../../contexts/active-run-context";
import { DropZone } from "./drop-zone";

export function UploadScreen() {
	const router = useAppRouter();
	const presign = usePresign();
	const startDoc = useStartDocument();
	const cancelActive = useCancelActiveDocuments();
	const { run, startRun } = useActiveRun();

	const [file, setFile] = useState<File | null>(null);
	const [showConflict, setShowConflict] = useState(false);
	const [forceFullReprocess, setForceFullReprocess] = useState(false);

	const uploading = presign.isPending || startDoc.isPending;
	const uploadError = presign.error ?? startDoc.error;

	const handleFileSelected = useCallback((f: File) => {
		setFile(f);
	}, []);

	const doUpload = useCallback(async () => {
		if (!file) return;

		presign.reset();
		startDoc.reset();

		const { url, key } = await presign.mutateAsync({
			filename: file.name,
			contentType: file.type || "application/pdf",
		});

		await fetch(url, {
			method: "PUT",
			body: file,
			headers: { "Content-Type": file.type || "application/pdf" },
		});

		const { runId } = await startDoc.mutateAsync({
			s3Key: key,
			filename: file.name,
			...(forceFullReprocess ? { forceFullReprocess: true } : {}),
		});

		startRun(runId);
		router.push(`/upload/${runId}`);
	}, [file, presign, startDoc, startRun, router, forceFullReprocess]);

	const handleUpload = useCallback(async () => {
		if (run && run.status === "processing") {
			setShowConflict(true);
			return;
		}
		await doUpload();
	}, [run, doUpload]);

	const handleCancelAndUpload = useCallback(async () => {
		setShowConflict(false);
		await cancelActive.mutateAsync(undefined);
		await doUpload();
	}, [cancelActive, doUpload]);

	return (
		<YStack gap="$5" maxW="$container.xxl" width="100%" p="$3" self="center">
			{showConflict && (
				<AppCard variant="accent" size="md">
					<YStack gap="$3">
						<XStack gap="$2" items="center">
							<AlertCircle size={18} color="$orange11" />
							<SizableText size="$3" fontWeight="600" color="$orange11">
								A document is currently being processed
							</SizableText>
						</XStack>
						<Paragraph size="$2" color="$orange10">
							Starting a new upload will cancel the current processing. Continue?
						</Paragraph>
						<XStack gap="$3">
							<Button
								theme="orange"
								size="$3"
								onPress={handleCancelAndUpload}
								disabled={cancelActive.isPending}
							>
								{cancelActive.isPending ? (
									<Spinner size="small" />
								) : (
									"Continue with New Upload"
								)}
							</Button>
							<Button
								variant="outlined"
								size="$3"
								onPress={() => setShowConflict(false)}
							>
								Go Back
							</Button>
						</XStack>
					</YStack>
				</AppCard>
			)}

			<XStack gap="$5" flexDirection="column" $md={{ flexDirection: "row" }}>
				{/* Left column: Drop zone */}
				<YStack flex={3}>
					<AppCard size="lg">
						<DropZone onFileSelected={handleFileSelected} />
					</AppCard>
				</YStack>

				{/* Right column: Instructions + options */}
				<YStack flex={2} gap="$4">
					<AppCard size="md">
						<YStack gap="$3">
							<H4 fontFamily="$heading" fontWeight="800" color="$color12">
								Instructions
							</H4>
							<Paragraph size="$3" color="$gray10">
								Upload a course syllabus PDF to automatically extract deadlines,
								assignments, and exam dates.
							</Paragraph>
							<Paragraph size="$2" color="$gray10">
								Supported format: PDF files only.
							</Paragraph>
						</YStack>
					</AppCard>

					<AppCard size="md">
						<YStack gap="$3">
							<H4 fontFamily="$heading" fontWeight="800" color="$color12">
								Full reprocess
							</H4>
							<Paragraph size="$2" color="$gray10">
								Run PDF parsing and AI extraction from scratch, even if this file was
								already uploaded. Unchecked, matching files use faster duplicate handling.
							</Paragraph>
							<XStack gap="$2" items="center" cursor="pointer" onPress={() => setForceFullReprocess((v) => !v)}>
								<View
									width={20}
									height={20}
									rounded={0}
									borderWidth={2}
									borderColor={forceFullReprocess ? "$purple9" : "$gray8"}
									bg={forceFullReprocess ? "$purple9" : "transparent"}
									items="center"
									justify="center"
								/>
								<SizableText size="$3" color="$color12" flex={1}>
									Always run full parse (ignore duplicates)
								</SizableText>
							</XStack>
						</YStack>
					</AppCard>

					{uploadError && (
						<SizableText size="$3" color="$red9">
							{uploadError.message}
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
								<Spinner size="small" />
								Uploading...
							</>
						) : (
							"Upload & Process"
						)}
					</Button>
				</YStack>
			</XStack>
		</YStack>
	);
}
