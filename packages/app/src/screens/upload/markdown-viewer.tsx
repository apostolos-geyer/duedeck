"use client";

import { useEffect, useState } from "react";
import { ScrollView, SizableText, Spinner, YStack } from "@repo/ui";
import { usePresignGet } from "../../hooks";

interface MarkdownViewerContentProps {
	content: string;
	s3Key?: never;
	maxH?: number;
}

interface MarkdownViewerS3Props {
	s3Key: string;
	content?: never;
	maxH?: number;
}

type MarkdownViewerProps = MarkdownViewerContentProps | MarkdownViewerS3Props;

export function MarkdownViewer({ content, s3Key, maxH = 600 }: MarkdownViewerProps) {
	const presignGet = usePresignGet();
	const [fetched, setFetched] = useState<string>();
	const [error, setError] = useState<string>();

	useEffect(() => {
		if (content || !s3Key) return;
		presignGet
			.mutateAsync({ key: s3Key })
			.then(async (result) => {
				const resp = await fetch(result.url);
				if (!resp.ok) throw new Error("Failed to fetch markdown");
				const text = await resp.text();
				setFetched(text);
			})
			.catch((err) => setError(err.message));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [s3Key, content]);

	const text = content ?? fetched;

	if (error) {
		return (
			<YStack p="$4" bg="$red2" rounded="$4">
				<SizableText size="$2" color="$red9">
					{error}
				</SizableText>
			</YStack>
		);
	}

	if (!text) {
		return (
			<YStack height={200} items="center" justify="center" bg="$gray2" rounded="$4">
				<Spinner size="large" color="$purple9" />
				<SizableText size="$2" color="$gray9">
					Loading markdown...
				</SizableText>
			</YStack>
		);
	}

	return (
		<ScrollView maxH={maxH}>
			<YStack p="$4" bg="$gray2" rounded="$4">
				<SizableText
					size="$2"
					fontFamily="$body"
					whiteSpace="pre-wrap"
					color="$color12"
				>
					{text}
				</SizableText>
			</YStack>
		</ScrollView>
	);
}
