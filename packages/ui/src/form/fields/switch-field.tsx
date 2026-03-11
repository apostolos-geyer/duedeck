"use client";

import type { GetProps } from "tamagui";
import { Label, Switch, XStack } from "tamagui";
import { useFieldContext } from "../form-context";
import {
	FormFieldWrapper,
	type FormFieldWrapperProps,
} from "../form-field-wrapper";

export interface SwitchFieldProps
	extends Omit<
		FormFieldWrapperProps,
		"children" | "errors" | "isTouched" | "label"
	> {
	label?: string;
	switchProps?: Omit<
		GetProps<typeof Switch>,
		"checked" | "onCheckedChange" | "onBlur"
	>;
}

export function SwitchField({
	label,
	description,
	required,
	wrapperProps,
	switchProps,
}: SwitchFieldProps) {
	const field = useFieldContext<boolean>();

	return (
		<FormFieldWrapper
			description={description}
			required={required}
			errors={field.state.meta.errors.map(String)}
			isTouched={field.state.meta.isTouched}
			wrapperProps={wrapperProps}
		>
			<XStack gap="$3" items="center">
				<Switch
					id={field.name}
					checked={field.state.value}
					onCheckedChange={(checked) => field.handleChange(checked)}
					onBlur={() => field.handleBlur()}
					{...switchProps}
				>
					<Switch.Thumb />
				</Switch>
				{label && (
					<Label htmlFor={field.name} fontSize="$3">
						{label}
					</Label>
				)}
			</XStack>
		</FormFieldWrapper>
	);
}
