"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
	ProcessingSteps,
	ProgressBar,
	SyllabusReviewForm,
	PdfViewer,
	MarkdownViewer,
	type ProgressEvent,
} from "@repo/app/screens/upload";
import type { SyllabusExtraction } from "@repo/app/workflows/parse-document/extraction-schema";
import { useConfirmDocument, useCancelDocument } from "@repo/app/hooks";
import { useActiveRun } from "@repo/app/contexts/active-run-context";
import { orpc } from "@/lib/rpc-client";
import { H2, SizableText, YStack, XStack, Button } from "@repo/ui";

type ViewTab = "pdf" | "markdown";

export default function ProcessingPage({
	params,
}: {
	params: Promise<{ runId: string }>;
}) {
	const { runId } = use(params);
	const router = useRouter();
	const confirmDoc = useConfirmDocument();
	const cancelDoc = useCancelDocument();
	const { clearRun } = useActiveRun();

	const [viewTab, setViewTab] = useState<ViewTab>("pdf");

	const { data, error } = useQuery(
		orpc.documents.stream.experimental_streamedOptions({
			input: { runId },
			retry: false,
		}),
	);

	const events = (data ?? []) as ProgressEvent[];

	// Extract s3Key from events (available after document record creation)
	const s3Key = useMemo(() => {
		for (const e of events) {
			if (e.data?.s3Key) return e.data.s3Key as string;
		}
		return undefined;
	}, [events]);

	// Extract markdown content from parsing done event
	const markdownContent = useMemo(() => {
		for (const e of events) {
			if (e.data?.markdownContent)
				return e.data.markdownContent as string;
		}
		return undefined;
	}, [events]);

	// Review event (single stage)
	const reviewEvent = useMemo(
		() =>
			events.find(
				(e) => e.step === "reviewing" && e.status === "start",
			),
		[events],
	);

	// Done event
	const doneEvent = useMemo(
		() => events.find((e) => e.step === "done" && e.status === "done"),
		[events],
	);

	// Workflow-level error (e.g. AI extraction failed)
	const workflowError = useMemo(() => {
		for (let i = events.length - 1; i >= 0; i--) {
			const e = events[i];
			if (e?.data?.error) return e.data.error as string;
		}
		return undefined;
	}, [events]);

	// Extract data from review event
	const extraction = reviewEvent?.data?.extraction as
		| SyllabusExtraction
		| undefined;
	const hookToken = reviewEvent?.data?.hookToken as string | undefined;

	// Show form when we have extraction data and haven't confirmed yet
	const showForm =
		extraction && hookToken && !doneEvent && !confirmDoc.isSuccess;

	// Handle completion redirect
	const handleComplete = useCallback(
		(data?: Record<string, unknown>) => {
			clearRun();
			if (data?.cancelled) {
				router.push("/upload");
			} else if (data?.docId) {
				router.push(`/doc/${data.docId}`);
			} else {
				router.push("/dashboard");
			}
		},
		[router, clearRun],
	);

	useEffect(() => {
		if (doneEvent && !workflowError) {
			handleComplete(doneEvent.data);
		}
	}, [doneEvent, workflowError, handleComplete]);

	// Confirm handler
	const handleConfirm = useCallback(
		async (data: SyllabusExtraction) => {
			if (!hookToken) return;
			await confirmDoc.mutateAsync({ hookToken, data });
		},
		[hookToken, confirmDoc],
	);

	// Cancel handler
	const handleCancel = useCallback(async () => {
		if (!hookToken) return;
		await cancelDoc.mutateAsync({ hookToken });
	}, [hookToken, cancelDoc]);

	// Header text
	const headerTitle = showForm
		? "Review Extracted Data"
		: "Processing Syllabus";

	const headerSubtitle = error || workflowError
		? "Something went wrong"
		: showForm
			? "Review and edit the extracted course info, grade weights, and deadlines"
			: "Parsing your document...";

	return (
		<YStack gap="$4" width="100%" flex={1}>
			{/* Always-visible progress bar */}
			<ProgressBar events={events} />

			{/* Header */}
			<YStack gap="$1">
				<H2 fontWeight="800" color="$color12">
					{headerTitle}
				</H2>
				<SizableText size="$3" color="$gray9">
					{headerSubtitle}
				</SizableText>
			</YStack>

			{/* Error state */}
			{(error || workflowError) && (
				<YStack gap="$3" bg="$red3" rounded="$4" p="$4">
					<SizableText size="$3" fontWeight="600" color="$red11">
						{error ? error.message : workflowError}
					</SizableText>
					<Button
						theme="purple"
						alignSelf="flex-start"
						onPress={() => router.push("/upload")}
					>
						Try Again
					</Button>
				</YStack>
			)}

			{/* Main content area — stacks vertically, side-by-side on lg+ */}
			<YStack gap="$5" flex={1} $lg={{ flexDirection: "row" }}>
				{/* Left panel: PDF / Markdown viewer */}
				{s3Key && (
					<YStack
						gap="$3"
						minW={0}
						height={500}
						$lg={{ flex: 1, height: "auto" }}
					>
						<XStack gap="$2">
							<Button
								size="$3"
								theme={viewTab === "pdf" ? "purple" : "gray"}
								onPress={() => setViewTab("pdf")}
							>
								PDF
							</Button>
							{markdownContent && (
								<Button
									size="$3"
									theme={
										viewTab === "markdown"
											? "purple"
											: "gray"
									}
									onPress={() => setViewTab("markdown")}
								>
									Markdown
								</Button>
							)}
						</XStack>

						{viewTab === "pdf" ? (
							<PdfViewer s3Key={s3Key} />
						) : markdownContent ? (
							<MarkdownViewer content={markdownContent} />
						) : null}
					</YStack>
				)}

				{/* Right panel: processing steps or review form */}
				<YStack flex={1} minW={0} $lg={{ minW: 420 }}>
					<YStack gap="$4" pb="$6">
						{/* Detailed processing steps — shown when no form is active */}
						{!showForm && !error && !workflowError && !doneEvent && (
							<ProcessingSteps
								events={events}
								onComplete={handleComplete}
							/>
						)}

						{/* Single review form */}
						{showForm && (
							<SyllabusReviewForm
								extraction={extraction}
								onConfirm={handleConfirm}
								onCancel={handleCancel}
								confirming={confirmDoc.isPending}
								cancelling={cancelDoc.isPending}
							/>
						)}
					</YStack>
				</YStack>
			</YStack>
		</YStack>
	);
}
