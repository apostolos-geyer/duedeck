"use client";

import { use, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
	ProcessingSteps,
	DeadlinePreview,
	type ProgressEvent,
} from "@repo/app/screens/upload";
import type { SyllabusExtraction } from "@repo/app/workflows/parse-document/extraction-schema";
import {
	useConfirmDocument,
	useCancelDocument,
} from "@repo/app/hooks";
import { orpc } from "@/lib/rpc-client";
import { H2, SizableText, YStack, Button } from "@repo/ui";

export default function ProcessingPage({
	params,
}: {
	params: Promise<{ runId: string }>;
}) {
	const { runId } = use(params);
	const router = useRouter();
	const confirmDoc = useConfirmDocument();
	const cancelDoc = useCancelDocument();

	const { data, error } = useQuery(
		orpc.documents.stream.experimental_streamedOptions({
			input: { runId },
			retry: false,
		}),
	);

	const events = (data ?? []) as ProgressEvent[];

	// Check if we've reached the review step
	const reviewEvent = useMemo(
		() => events.find((e) => e.step === "reviewing" && e.status === "start"),
		[events],
	);

	const extraction = reviewEvent?.data?.extraction as
		| SyllabusExtraction
		| undefined;
	const hookToken = reviewEvent?.data?.hookToken as string | undefined;

	const handleComplete = useCallback(
		(data?: Record<string, unknown>) => {
			if (data?.cancelled) {
				router.push("/upload");
			} else if (data?.deduplicated && data?.docId) {
				router.push(`/doc/${data.docId}`);
			} else if (data?.docId) {
				router.push(`/doc/${data.docId}`);
			} else {
				router.push("/dashboard");
			}
		},
		[router],
	);

	const handleConfirm = useCallback(
		async (editedData: SyllabusExtraction) => {
			if (!hookToken) return;
			await confirmDoc.mutateAsync({ hookToken, data: editedData });
		},
		[hookToken, confirmDoc],
	);

	const handleCancel = useCallback(async () => {
		if (!hookToken) return;
		await cancelDoc.mutateAsync({ hookToken });
	}, [hookToken, cancelDoc]);

	// Watch for done event at the page level (handles redirect after confirm/cancel)
	const doneEvent = useMemo(
		() => events.find((e) => e.step === "done" && e.status === "done"),
		[events],
	);

	useEffect(() => {
		if (doneEvent) {
			handleComplete(doneEvent.data);
		}
	}, [doneEvent, handleComplete]);

	const showReview = extraction && hookToken && !doneEvent;

	return (
		<YStack gap="$5" maxW="$container.xxl" width="100%">
			<YStack gap="$1">
				<H2 fontWeight="800" color="$color12">
					{showReview ? "Review Extracted Data" : "Processing Syllabus"}
				</H2>
				<SizableText size="$3" color="$gray9">
					{error
						? "Something went wrong"
						: showReview
							? "Review the extracted course info and deadlines before confirming"
							: "Parsing your document..."}
				</SizableText>
			</YStack>

			{error ? (
				<YStack gap="$3">
					<SizableText color="$red9">{error.message}</SizableText>
					<Button theme="gray" onPress={() => router.push("/upload")}>
						Try Again
					</Button>
				</YStack>
			) : showReview ? (
				<DeadlinePreview
					extraction={extraction}
					onConfirm={handleConfirm}
					onCancel={handleCancel}
					confirming={confirmDoc.isPending}
					cancelling={cancelDoc.isPending}
				/>
			) : (
				<ProcessingSteps events={events} onComplete={handleComplete} />
			)}
		</YStack>
	);
}
