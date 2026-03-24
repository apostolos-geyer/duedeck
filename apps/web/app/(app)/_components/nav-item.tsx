"use client";

import { Paragraph, YStack } from "@repo/ui";
import Link from "next/link";

interface NavItemProps {
	icon: React.ReactNode;
	label: string;
	href: string;
	active: boolean;
}

export function NavItem({ icon, label, href, active }: NavItemProps) {
	return (
		<Link href={href} style={{ textDecoration: "none" }}>
			<YStack
				items="center"
				justify="center"
				py="$2"
				px="$1"
				gap="$1"
				borderLeftWidth={active ? 3 : 0}
				borderLeftColor={active ? "$purple9" : "transparent"}
				bg={active ? "$purple3" : "transparent"}
				hoverStyle={{ bg: active ? "$purple3" : "$gray3" }}
				pressStyle={{ bg: "$gray4" }}
				cursor="pointer"
			>
				{icon}
			</YStack>
		</Link>
	);
}

/** Mobile bottom tab version — icon + tiny label */
export function BottomTabItem({ icon, label, href, active }: NavItemProps) {
	return (
		<Link href={href} style={{ textDecoration: "none", flex: 1 }}>
			<YStack
				items="center"
				justify="center"
				py="$1.5"
				gap={2}
				cursor="pointer"
			>
				{icon}
				<Paragraph
					size="$1"
					fontWeight={active ? "600" : "400"}
					color={active ? "$purple9" : "$gray10"}
				>
					{label}
				</Paragraph>
			</YStack>
		</Link>
	);
}
