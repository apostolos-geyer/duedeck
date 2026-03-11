"use client";

import type { TamaguiProviderProps } from "tamagui";
import { TamaguiProvider } from "tamagui";
import { config } from "./tamagui.config";

type ProviderProps = Partial<Omit<TamaguiProviderProps, "config">> & {
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
