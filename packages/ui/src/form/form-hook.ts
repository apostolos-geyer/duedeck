import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./form-context";
import { CheckboxField } from "./fields/checkbox-field";
import { RadioGroupField } from "./fields/radio-group-field";
import { SelectField } from "./fields/select-field";
import { SwitchField } from "./fields/switch-field";
import { NumberField } from "./fields/number-field";
import { TextAreaField } from "./fields/text-area-field";
import { TextField } from "./fields/text-field";
import { FormErrors } from "./components/form-errors";
import { SubmitButton } from "./components/submit-button";

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
	fieldContext,
	formContext,
	fieldComponents: {
		TextField,
		TextAreaField,
		NumberField,
		CheckboxField,
		SwitchField,
		SelectField,
		RadioGroupField,
	},
	formComponents: {
		SubmitButton,
		FormErrors,
	},
});
