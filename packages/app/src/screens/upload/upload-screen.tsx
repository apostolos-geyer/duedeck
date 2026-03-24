"use client";

import { useCallback, useState } from "react";
import { Button, H2, SizableText, Spinner, XStack, YStack } from "@repo/ui";
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
		});

		startRun(runId);
		router.push(`/upload/${runId}`);
	}, [file, presign, startDoc, startRun, router]);

	const handleUpload = useCallback(async () => {
		if (run && run.status === "processing") {
			setShowConflict(true);
			return;
		}
		await doUpload();
	}, [run, doUpload]);

	const handleCancelAndUpload = useCallback(async () => {
		setShowConflict(false);
		await cancelActive.mutateAsync();
		await doUpload();
	}, [cancelActive, doUpload]);

	return (
		<YStack gap="$5" maxW="$container.xxl" width="100%">
			<YStack gap="$1">
				<H2 fontWeight="800" color="$color12">
					Upload Syllabus
				</H2>
				<SizableText size="$3" color="$gray9">
					Upload a course syllabus PDF to automatically extract deadlines
				</SizableText>
			</YStack>

			{showConflict && (
				<YStack bg="$orange3" rounded="$4" p="$4" gap="$3">
					<XStack gap="$2" items="center">
						<AlertCircle size={18} color="$orange11" />
						<SizableText size="$3" fontWeight="600" color="$orange11">
							A document is currently being processed
						</SizableText>
					</XStack>
					<SizableText size="$2" color="$orange10">
						Starting a new upload will cancel the current processing. Continue?
					</SizableText>
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
			)}

			<DropZone onFileSelected={handleFileSelected} />

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
						<Spinner size="small" color="white" />
						Uploading...
					</>
				) : (
					"Upload & Process"
				)}
			</Button>
		</YStack>
	);
}
