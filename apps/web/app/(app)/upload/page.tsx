"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { UploadScreen } from "@repo/app/screens/upload";
import { orpc } from "@/lib/rpc-client";

export default function UploadPage() {
	const router = useRouter();

	const presign = useMutation(orpc.uploads.presign.mutationOptions());

	const s3Upload = useMutation({
		mutationFn: async ({ url, file }: { url: string; file: File }) => {
			const res = await fetch(url, {
				method: "PUT",
				body: file,
				headers: { "Content-Type": file.type || "application/pdf" },
			});
			if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
		},
	});

	const startDoc = useMutation(orpc.documents.start.mutationOptions());

	const error = presign.error ?? s3Upload.error ?? startDoc.error;
	const uploading = presign.isPending || s3Upload.isPending || startDoc.isPending;

	const handleUpload = useCallback(
		async (input: { file: File; sectionId: string }) => {
			presign.reset();
			s3Upload.reset();
			startDoc.reset();

			const { url, key } = await presign.mutateAsync({
				filename: input.file.name,
				contentType: input.file.type || "application/pdf",
			});

			await s3Upload.mutateAsync({ url, file: input.file });

			const { runId } = await startDoc.mutateAsync({
				s3Key: key,
				sectionId: input.sectionId,
				filename: input.file.name,
			});

			router.push(`/upload/${runId}`);
		},
		[router, presign, s3Upload, startDoc],
	);

	return (
		<UploadScreen
			onNavigateCourse={(courseId) => router.push(`/course/${courseId}`)}
			onUpload={handleUpload}
			uploading={uploading}
			uploadError={error?.message ?? null}
		/>
	);
}
