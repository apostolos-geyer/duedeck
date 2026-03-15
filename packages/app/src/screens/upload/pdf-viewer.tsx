"use client";

import { useEffect, useState } from "react";
import { SizableText, Spinner, View, YStack } from "@repo/ui";
import { usePresignGet } from "../../hooks";

interface PdfViewerProps {
	s3Key: string;
	height?: number;
}

export function PdfViewer({ s3Key, height = 600 }: PdfViewerProps) {
	const presignGet = usePresignGet();
	const [url, setUrl] = useState<string>();

	useEffect(() => {
		presignGet.mutateAsync({ key: s3Key }).then((result) => {
			setUrl(result.url);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [s3Key]);

	if (!url) {
		return (
			<YStack height={height} items="center" justify="center" bg="$gray2" rounded="$4">
				<Spinner size="large" color="$purple9" />
				<SizableText size="$2" color="$gray9">
					Loading PDF...
				</SizableText>
			</YStack>
		);
	}

	return (
		<View height={height} rounded="$4" overflow="hidden" bg="$gray2">
			<iframe
				src={url}
				title="Uploaded PDF"
				style={{ width: "100%", height: "100%", border: "none" }}
			/>
		</View>
	);
}
