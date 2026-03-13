import "@tamagui/core/reset.css";
import "@/public/tamagui.generated.css";
import { Provider } from "@repo/ui/provider";
import { Providers } from "./_components/providers";
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
          <Providers>{children}</Providers>
        </Provider>
      </body>
    </html>
  );
}
