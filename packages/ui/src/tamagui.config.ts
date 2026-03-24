import { defaultConfig } from "@tamagui/config/v5";
import { animations } from "@tamagui/config/v5-css";
import { createTamagui, createTokens } from "@tamagui/web";

const tokens = createTokens({
  ...defaultConfig.tokens,
  size: {
    ...defaultConfig.tokens.size,
    // Container width tokens for maxW, width, etc.
    "container.xs": 320,
    "container.sm": 384,
    "container.md": 448,
    "container.lg": 512,
    "container.xl": 576,
    "container.xxl": 672,
    "container.xxxl": 768,
    "container.full": 1024,
  },
});

export const config = createTamagui({
  ...defaultConfig,
  tokens,
  animations,
});

export default config;

type Conf = typeof config;
declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
