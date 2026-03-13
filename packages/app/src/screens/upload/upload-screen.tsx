"use client";

import { useCallback, useState } from "react";
import { Button, H2, SizableText, Spinner, YStack } from "@repo/ui";
import { usePresign, useStartDocument } from "../../hooks/use-upload";
import { useAppRouter } from "../../hooks/use-app-router";
import { DropZone } from "./drop-zone";

export function UploadScreen() {
	const router = useAppRouter();
	const presign = usePresign();
	const startDoc = useStartDocument();

	const [file, setFile] = useState<File | null>(null);

	const uploading = presign.isPending || startDoc.isPending;
	const uploadError = presign.error ?? startDoc.error;

	const handleFileSelected = useCallback((f: File) => {
		setFile(f);
	}, []);

	const handleUpload = useCallback(async () => {
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

		router.push(`/upload/${runId}`);
	}, [file, presign, startDoc, router]);

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
