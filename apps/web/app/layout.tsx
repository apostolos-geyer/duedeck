import "@tamagui/core/reset.css";
import "@/public/tamagui.generated.css";
import { Provider } from "@repo/ui/provider";
import { QueryProvider } from "@repo/app/rpc/query-provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DueDeck",
  description: "DueDeck web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <QueryProvider>{children}</QueryProvider>
        </Provider>
      </body>
    </html>
  );
}
