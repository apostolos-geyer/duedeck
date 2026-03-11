"use client";

import type { GetProps } from "tamagui";
import { Input } from "tamagui";
import { useFieldContext } from "../form-context";
import {
	FormFieldWrapper,
	type FormFieldWrapperProps,
} from "../form-field-wrapper";

type InputProps = GetProps<typeof Input>;

export interface TextFieldProps
	extends Omit<FormFieldWrapperProps, "children" | "errors" | "isTouched"> {
	inputProps?: Omit<InputProps, "value" | "onChangeText" | "onBlur">;
}

export function TextField({
	label,
	description,
	required,
	wrapperProps,
	inputProps,
}: TextFieldProps) {
	const field = useFieldContext<string>();

	return (
		<FormFieldWrapper
			label={label}
			description={description}
			required={required}
			errors={field.state.meta.errors.map(String)}
			isTouched={field.state.meta.isTouched}
			htmlFor={field.name}
			wrapperProps={wrapperProps}
		>
			<Input
				id={field.name}
				value={field.state.value}
				onChangeText={(text) => field.handleChange(text)}
				onBlur={() => field.handleBlur()}
				{...inputProps}
			/>
		</FormFieldWrapper>
	);
}
