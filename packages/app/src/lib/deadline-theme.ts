import type { ThemeName } from "@tamagui/web";

export type ColorTheme = Extract<
	ThemeName,
	"blue" | "red" | "orange" | "purple" | "green" | "gray" | "yellow"
>;

export const TYPE_THEME: Record<string, ColorTheme> = {
	assignment: "blue",
	exam: "red",
	quiz: "orange",
	project: "purple",
	participation: "green",
	other: "gray",
};
