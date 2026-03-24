"use client";

import { useRef, useState, useCallback } from "react";
import { SizableText, YStack } from "@repo/ui";
import { Upload } from "@tamagui/lucide-icons";

interface DropZoneProps {
	onFileSelected: (file: File) => void;
}

export function DropZone({ onFileSelected }: DropZoneProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [hovering, setHovering] = useState(false);

	const handleFile = useCallback(
		(file: File) => {
			setFileName(file.name);
			onFileSelected(file);
		},
		[onFileSelected],
	);

	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setHovering(true);
		},
		[],
	);

	const handleDragLeave = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setHovering(false);
		},
		[],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setHovering(false);
			const file = e.dataTransfer.files[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	const handleClick = useCallback(() => {
		inputRef.current?.click();
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) handleFile(file);
		},
		[handleFile],
	);

	return (
		<YStack
			minH={200}
			borderWidth={2}
			borderColor={hovering ? "$purple7" : "$gray5"}
			borderStyle="dashed"
			rounded={0}
			items="center"
			justify="center"
			gap="$3"
			p="$6"
			cursor="pointer"
			bg={hovering ? "$purple2" : "transparent"}
			hoverStyle={{ borderColor: "$purple7", bg: "$purple2" }}
			pressStyle={{ borderColor: "$purple8", bg: "$purple3" }}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onPress={handleClick}
		>
			<input
				ref={inputRef}
				type="file"
				accept=".pdf"
				onChange={handleInputChange}
				style={{ display: "none" }}
			/>

			<Upload size={40} color="$gray8" />

			{fileName ? (
				<SizableText size="$5" fontWeight="600" color="$purple9">
					{fileName}
				</SizableText>
			) : (
				<>
					<SizableText size="$5" fontWeight="600" color="$color12">
						Drag &amp; drop your syllabus PDF here
					</SizableText>
					<SizableText size="$2" color="$gray9">
						or click to browse
					</SizableText>
				</>
			)}
		</YStack>
	);
}
