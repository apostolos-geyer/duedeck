"use client";
import NextLink from "next/link";

interface LinkProps {
	href: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
}

export function Link({ href, children, ...props }: LinkProps) {
	return (
		<NextLink href={href} {...props}>
			{children}
		</NextLink>
	);
}
