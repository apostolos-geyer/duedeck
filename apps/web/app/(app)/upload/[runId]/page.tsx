"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProcessingSteps, type ProgressEvent } from "@repo/app/screens/upload";
import { orpc } from "@/lib/rpc-client";
import { H2, SizableText, YStack, Button } from "@repo/ui";

export default function ProcessingPage({
	params,
}: {
	params: Promise<{ runId: string }>;
}) {
	const { runId } = use(params);
	const router = useRouter();

	const { data, error } = useQuery(
		orpc.documents.stream.experimental_streamedOptions({
			input: { runId },
			retry: false,
		}),
	);

	const events = (data ?? []) as ProgressEvent[];
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
					<SizableText color="$red9">{error.message}</SizableText>
					<Button theme="gray" onPress={() => router.push("/upload")}>
						Try Again
					</Button>
				</YStack>
			) : (
				<ProcessingSteps events={events} onComplete={handleComplete} />
			)}
		</YStack>
	);
}
