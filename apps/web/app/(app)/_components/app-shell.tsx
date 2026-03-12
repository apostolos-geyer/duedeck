"use client";

import { useState, useCallback, useEffect } from "react";
import { View, XStack, YStack } from "@repo/ui";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
	user: { name: string; email: string };
	children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const pathname = usePathname();

	// Close sidebar on route change (mobile)
	useEffect(() => {
		setSidebarOpen(false);
	}, [pathname]);

	const toggleSidebar = useCallback(() => {
		setSidebarOpen((prev) => !prev);
	}, []);

	const closeSidebar = useCallback(() => {
		setSidebarOpen(false);
	}, []);

	return (
		<XStack height="100vh" width="100vw">
			{/* Desktop sidebar — always visible at md+ */}
			<Sidebar user={user} />

			{/* Mobile sidebar overlay */}
			{sidebarOpen && (
				<>
					{/* Backdrop */}
					<View
						position="absolute"
						t={0}
						l={0}
						r={0}
						b={0}
						bg="rgba(0,0,0,0.4)"
						z={40}
						onPress={closeSidebar}
						display="flex"
						$md={{ display: "none" }}
					/>
					{/* Sidebar drawer */}
					<View
						position="absolute"
						t={0}
						l={0}
						b={0}
						z={50}
						display="flex"
						$md={{ display: "none" }}
					>
						<Sidebar user={user} forceShow />
					</View>
				</>
			)}

			<YStack flex={1} overflow="hidden">
				<TopBar user={user} onMenuPress={toggleSidebar} />
				<YStack flex={1} overflow="scroll" p="$3" $md={{ p: "$5" }}>
					{children}
				</YStack>
			</YStack>
		</XStack>
	);
}
