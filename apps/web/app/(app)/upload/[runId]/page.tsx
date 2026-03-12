"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessingSteps, type ProgressEvent } from "@repo/app/screens/upload";
import { rpc } from "@/lib/rpc-client";
import { H2, SizableText, YStack, Button } from "@repo/ui";

export default function ProcessingPage({
	params,
}: {
	params: Promise<{ runId: string }>;
}) {
	const { runId } = use(params);
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [completionData, setCompletionData] = useState<Record<string, unknown> | null>(null);

	const [events, setEvents] = useState<ProgressEvent[]>([]);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				const stream = await rpc.documents.stream({ runId });

				for await (const event of stream) {
					if (cancelled) break;
					const evt = event as ProgressEvent;
					setEvents((prev) => [...prev, evt]);

					if (evt.step === "done" && evt.status === "done") {
						setCompletionData(evt.data ?? null);
					}
				}
			} catch (err) {
				if (!cancelled) {
					console.error("[processing] stream error:", err);
					setError(err instanceof Error ? err.message : "Processing failed");
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [runId]);

	const handleComplete = useCallback(
		(data?: Record<string, unknown>) => {
			if (data?.deduplicated) {
				router.push("/upload");
			} else {
				router.push("/upload");
			}
		},
		[router],
	);

	return (
		<YStack gap="$5" maxW="$container.xxl" width="100%">
			<YStack gap="$1">
				<H2 fontWeight="800" color="$color12">
					Processing Syllabus
				</H2>
				<SizableText size="$3" color="$gray9">
					{error ? "Something went wrong" : "Parsing your document..."}
				</SizableText>
			</YStack>

			{error ? (
				<YStack gap="$3">
					<SizableText color="$red9">{error}</SizableText>
					<Button theme="gray" onPress={() => router.push("/upload")}>
						Try Again
					</Button>
				</YStack>
			) : (
				<ProcessingSteps
					events={events}
					onComplete={handleComplete}
				/>
			)}
		</YStack>
	);
}
