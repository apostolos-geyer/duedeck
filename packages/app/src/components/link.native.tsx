import { Link as ExpoLink } from "expo-router";

interface LinkProps {
	href: string;
	children: React.ReactNode;
}

export function Link({ href, children }: LinkProps) {
	// biome-ignore lint: expo-router href typing requires cast
	return <ExpoLink href={href as any}>{children}</ExpoLink>;
}
