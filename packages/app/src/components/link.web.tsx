"use client";
import NextLink from "next/link";

interface LinkProps {
	href: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
	asChild?: boolean;
}

export function Link({ href, children, asChild: _asChild, ...props }: LinkProps) {
	return (
		<NextLink href={href} {...props}>
			{children}
		</NextLink>
	);
}
