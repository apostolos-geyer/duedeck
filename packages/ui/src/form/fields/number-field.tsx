"use client";

import type { GetProps } from "tamagui";
import { Input } from "tamagui";
import { useFieldContext } from "../form-context";
import {
	FormFieldWrapper,
	type FormFieldWrapperProps,
} from "../form-field-wrapper";

type InputProps = GetProps<typeof Input>;

export interface NumberFieldProps
	extends Omit<FormFieldWrapperProps, "children" | "errors" | "isTouched"> {
	inputProps?: Omit<InputProps, "value" | "onChangeText" | "onBlur">;
}

export function NumberField({
	label,
	description,
	required,
	wrapperProps,
	inputProps,
}: NumberFieldProps) {
	const field = useFieldContext<number>();

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
				value={String(field.state.value ?? "")}
				onChangeText={(text) => {
					const num = Number.parseFloat(text);
					field.handleChange(Number.isNaN(num) ? 0 : num);
				}}
				onBlur={() => field.handleBlur()}
				inputMode="decimal"
				{...inputProps}
			/>
		</FormFieldWrapper>
	);
}
