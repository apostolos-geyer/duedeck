"use client";

import { useCallback, useState } from "react";
import { Button, H2, SizableText, Spinner, View, XStack, YStack } from "@repo/ui";
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

			<YStack
				gap="$2"
				bg="$purple2"
				borderWidth={1}
				borderColor="$purple6"
				rounded="$4"
				p="$3"
			>
				<SizableText size="$3" fontWeight="700" color="$purple11">
					Full reprocess
				</SizableText>
				<SizableText size="$2" color="$purple10">
					Run PDF parsing and AI extraction from scratch, even if this file was
					already uploaded. You will review and confirm again. Unchecked, matching
					files use faster duplicate handling when possible.
				</SizableText>
				<XStack gap="$2" items="center" cursor="pointer" onPress={() => setForceFullReprocess((v) => !v)}>
					<View
						width={20}
						height={20}
						rounded="$1"
						borderWidth={2}
						borderColor={forceFullReprocess ? "$purple9" : "$gray8"}
						bg={forceFullReprocess ? "$purple9" : "transparent"}
						items="center"
						justify="center"
					/>
					<SizableText size="$3" color="$color12" flex={1}>
						Always run full parse and extraction (ignore duplicates)
					</SizableText>
				</XStack>
			</YStack>

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
