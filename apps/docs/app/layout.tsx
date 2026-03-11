import { Provider } from "@repo/ui/provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DueDeck Docs",
  description: "DueDeck documentation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
