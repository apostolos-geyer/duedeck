"use client";

import type { GetProps } from "tamagui";
import { Checkbox, Label, XStack } from "tamagui";
import { useFieldContext } from "../form-context";
import {
	FormFieldWrapper,
	type FormFieldWrapperProps,
} from "../form-field-wrapper";

export interface CheckboxFieldProps
	extends Omit<
		FormFieldWrapperProps,
		"children" | "errors" | "isTouched" | "label"
	> {
	label?: string;
	checkboxProps?: Omit<
		GetProps<typeof Checkbox>,
		"checked" | "onCheckedChange" | "onBlur"
	>;
}

export function CheckboxField({
	label,
	description,
	required,
	wrapperProps,
	checkboxProps,
}: CheckboxFieldProps) {
	const field = useFieldContext<boolean>();

	return (
		<FormFieldWrapper
			description={description}
			required={required}
			errors={field.state.meta.errors.map(String)}
			isTouched={field.state.meta.isTouched}
			wrapperProps={wrapperProps}
		>
			<XStack gap="$2" items="center">
				<Checkbox
					id={field.name}
					checked={field.state.value}
					onCheckedChange={(checked) => field.handleChange(checked === true)}
					onBlur={() => field.handleBlur()}
					{...checkboxProps}
				>
					<Checkbox.Indicator />
				</Checkbox>
				{label && (
					<Label htmlFor={field.name} fontSize="$3">
						{label}
					</Label>
				)}
			</XStack>
		</FormFieldWrapper>
	);
}
