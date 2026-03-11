"use client";

import type { GetProps } from "tamagui";
import { Label, RadioGroup, XStack, YStack } from "tamagui";
import { useFieldContext } from "../form-context";
import {
	FormFieldWrapper,
	type FormFieldWrapperProps,
} from "../form-field-wrapper";

export interface RadioOption {
	label: string;
	value: string;
}

export interface RadioGroupFieldProps
	extends Omit<FormFieldWrapperProps, "children" | "errors" | "isTouched"> {
	options: RadioOption[];
	orientation?: "horizontal" | "vertical";
	radioGroupProps?: Omit<
		GetProps<typeof RadioGroup>,
		"value" | "onValueChange"
	>;
}

export function RadioGroupField({
	label,
	description,
	required,
	wrapperProps,
	options,
	orientation = "vertical",
	radioGroupProps,
}: RadioGroupFieldProps) {
	const field = useFieldContext<string>();
	const Stack = orientation === "horizontal" ? XStack : YStack;

	return (
		<FormFieldWrapper
			label={label}
			description={description}
			required={required}
			errors={field.state.meta.errors.map(String)}
			isTouched={field.state.meta.isTouched}
			wrapperProps={wrapperProps}
		>
			<RadioGroup
				value={field.state.value}
				onValueChange={(value) => field.handleChange(value)}
				{...radioGroupProps}
			>
				<Stack gap="$2">
					{options.map((option) => (
						<XStack key={option.value} gap="$2" items="center">
							<RadioGroup.Item
								value={option.value}
								id={`${field.name}-${option.value}`}
							>
								<RadioGroup.Indicator />
							</RadioGroup.Item>
							<Label
								htmlFor={`${field.name}-${option.value}`}
								fontSize="$3"
							>
								{option.label}
							</Label>
						</XStack>
					))}
				</Stack>
			</RadioGroup>
		</FormFieldWrapper>
	);
}
