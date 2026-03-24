"use client";

import { useState, useCallback, useEffect } from "react";
import { View, XStack, YStack } from "@repo/ui";
import { usePathname, useRouter } from "next/navigation";
import { ProcessingBanner } from "@repo/app/components/processing-banner";
import { orpc } from "@/lib/rpc-client";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { BottomTabBar } from "./bottom-tab-bar";

interface AppShellProps {
	user: { name: string; email: string };
	children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const pathname = usePathname();
	const router = useRouter();

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
			<Sidebar user={user} />

			{sidebarOpen && (
				<>
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
				<ProcessingBanner orpc={orpc} onNavigate={(p) => router.push(p)} />
				<YStack flex={1} overflow="scroll">
					{children}
				</YStack>
				<BottomTabBar />
			</YStack>
		</XStack>
	);
}
