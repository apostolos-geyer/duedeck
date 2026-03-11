"use client";

import type { GetProps } from "tamagui";
import { Label, Paragraph, SizableText, YStack } from "tamagui";

export interface FormFieldWrapperProps {
	label?: string;
	description?: string;
	errors?: string[];
	isTouched?: boolean;
	htmlFor?: string;
	required?: boolean;
	wrapperProps?: Omit<GetProps<typeof YStack>, "children">;
	children: React.ReactNode;
}

export function FormFieldWrapper({
	label,
	description,
	errors,
	isTouched,
	htmlFor,
	required,
	wrapperProps,
	children,
}: FormFieldWrapperProps) {
	const showErrors = isTouched && errors && errors.length > 0;

	return (
		<YStack gap="$1.5" {...wrapperProps}>
			{label && (
				<Label htmlFor={htmlFor} fontSize="$3">
					{label}
					{required && (
						<SizableText color="$red10" fontSize="$3">
							{" *"}
						</SizableText>
					)}
				</Label>
			)}
			{description && (
				<Paragraph fontSize="$2" color="$gray10">
					{description}
				</Paragraph>
			)}
			{children}
			{showErrors && (
				<Paragraph fontSize="$2" color="$red10">
					{errors.join(", ")}
				</Paragraph>
			)}
		</YStack>
	);
}
