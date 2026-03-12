"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadScreen } from "@repo/app/screens/upload";
import { rpc } from "@/lib/rpc-client";

export default function UploadPage() {
	const router = useRouter();
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleUpload = useCallback(
		async (input: { file: File; sectionId: string }) => {
			setUploading(true);
			setError(null);

			try {
				// 1. Presign
				const { url, key } = await rpc.uploads.presign({
					filename: input.file.name,
					contentType: input.file.type || "application/pdf",
				});

				// 2. Upload to S3
				const putRes = await fetch(url, {
					method: "PUT",
					body: input.file,
					headers: { "Content-Type": input.file.type || "application/pdf" },
				});

				if (!putRes.ok) {
					throw new Error(`S3 upload failed: ${putRes.status}`);
				}

				// 3. Start the workflow
				const { runId } = await rpc.documents.start({
					s3Key: key,
					sectionId: input.sectionId,
					filename: input.file.name,
				});

				// 4. Redirect to the processing page
				router.push(`/upload/${runId}`);
			} catch (err) {
				console.error("[upload] failed:", err);
				setError(err instanceof Error ? err.message : "Upload failed");
				setUploading(false);
			}
		},
		[router],
	);

	return (
		<UploadScreen
			onNavigateCourse={(courseId) => router.push(`/course/${courseId}`)}
			onUpload={handleUpload}
			uploading={uploading}
			uploadError={error}
		/>
	);
}
