"use client";

import type { GetProps } from "tamagui";
import { TextArea } from "tamagui";
import { useFieldContext } from "../form-context";
import {
	FormFieldWrapper,
	type FormFieldWrapperProps,
} from "../form-field-wrapper";

type TextAreaComponentProps = GetProps<typeof TextArea>;

export interface TextAreaFieldProps
	extends Omit<FormFieldWrapperProps, "children" | "errors" | "isTouched"> {
	textAreaProps?: Omit<
		TextAreaComponentProps,
		"value" | "onChangeText" | "onBlur"
	>;
}

export function TextAreaField({
	label,
	description,
	required,
	wrapperProps,
	textAreaProps,
}: TextAreaFieldProps) {
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
			<TextArea
				id={field.name}
				value={field.state.value}
				onChangeText={(text) => field.handleChange(text)}
				onBlur={() => field.handleBlur()}
				{...textAreaProps}
			/>
		</FormFieldWrapper>
	);
}
