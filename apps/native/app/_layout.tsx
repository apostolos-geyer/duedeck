import { Provider } from "@repo/ui/provider";
import { QueryProvider } from "@repo/app/rpc/query-provider";
import { Slot } from "expo-router";
import { orpc } from "../lib/rpc-client";

export default function RootLayout() {
	return (
		<Provider>
			<QueryProvider orpc={orpc}>
				<Slot />
			</QueryProvider>
		</Provider>
	);
}
