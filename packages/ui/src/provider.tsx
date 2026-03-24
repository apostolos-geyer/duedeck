"use client";

import type { ComponentProps } from "react";
import { TamaguiProvider } from "@tamagui/web";
import { config } from "./tamagui.config";

type ProviderProps = Partial<
  Omit<ComponentProps<typeof TamaguiProvider>, "config" | "children">
> & {
  children: React.ReactNode;
};

export function Provider({
  children,
  defaultTheme = "light",
  ...rest
}: ProviderProps) {
  return (
    <TamaguiProvider config={config} defaultTheme={defaultTheme} {...rest}>
      {children}
    </TamaguiProvider>
  );
}
