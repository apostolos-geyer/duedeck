"use client";

import type { GetProps } from "tamagui";
import { Select } from "tamagui";
import { useFieldContext } from "../form-context";
import {
	FormFieldWrapper,
	type FormFieldWrapperProps,
} from "../form-field-wrapper";

export interface SelectOption {
	label: string;
	value: string;
}

export interface SelectFieldProps
	extends Omit<FormFieldWrapperProps, "children" | "errors" | "isTouched"> {
	options: SelectOption[];
	placeholder?: string;
	selectProps?: Partial<GetProps<typeof Select>>;
}

export function SelectField({
	label,
	description,
	required,
	wrapperProps,
	options,
	placeholder,
	selectProps,
}: SelectFieldProps) {
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
			<Select
				id={field.name}
				value={field.state.value}
				onValueChange={(value) => field.handleChange(value)}
				{...selectProps}
			>
				<Select.Trigger>
					<Select.Value placeholder={placeholder} />
				</Select.Trigger>
				<Select.Content>
					<Select.Viewport>
						{options.map((option, index) => (
							<Select.Item
								key={option.value}
								value={option.value}
								index={index}
							>
								<Select.ItemText>{option.label}</Select.ItemText>
							</Select.Item>
						))}
					</Select.Viewport>
				</Select.Content>
			</Select>
		</FormFieldWrapper>
	);
}
