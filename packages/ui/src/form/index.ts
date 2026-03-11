// Re-export formOptions from TanStack Form for shared form configuration
export { formOptions } from "@tanstack/react-form";

// Context primitives (for building custom field/form components)
export {
	fieldContext,
	formContext,
	useFieldContext,
	useFormContext,
} from "./form-context";

// Pre-bound form hook and HOCs
export { useAppForm, withForm, withFieldGroup } from "./form-hook";

// Shared layout primitive (for building custom field components)
export {
	FormFieldWrapper,
	type FormFieldWrapperProps,
} from "./form-field-wrapper";

// Field components
export * from "./fields";

// Form components
export * from "./components";
