"use client";

import { SizableText, XStack } from "@repo/ui";
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
			<XStack
				p="$3"
				rounded="$3"
				gap="$3"
				items="center"
				bg={active ? "$purple3" : "transparent"}
				borderLeftWidth={active ? 3 : 0}
				borderLeftColor={active ? "$purple9" : "transparent"}
				hoverStyle={{ bg: active ? "$purple3" : "$gray3" }}
				pressStyle={{ bg: "$gray4" }}
				cursor="pointer"
			>
				{icon}
				<SizableText
					size="$4"
					fontWeight={active ? "600" : "400"}
					color={active ? "$purple9" : "$gray11"}
				>
					{label}
				</SizableText>
			</XStack>
		</Link>
	);
}
