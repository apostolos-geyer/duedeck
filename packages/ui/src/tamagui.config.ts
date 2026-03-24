import { defaultConfig } from "@tamagui/config/v5";
import { animations } from "@tamagui/config/v5-css";
import { createFont, createTamagui, createTokens } from "@tamagui/web";

const headingFont = createFont({
  family: '"DM Serif Display", Georgia, serif',
  size: {
    1: 12,
    2: 14,
    3: 15,
    4: 16,
    true: 16,
    5: 18,
    6: 20,
    7: 24,
    8: 30,
    9: 36,
    10: 44,
    11: 52,
    12: 62,
    13: 72,
    14: 86,
    15: 100,
    16: 120,
  },
  lineHeight: {
    1: 16,
    2: 18,
    3: 20,
    4: 22,
    true: 22,
    5: 24,
    6: 26,
    7: 30,
    8: 36,
    9: 42,
    10: 50,
    11: 58,
    12: 68,
    13: 78,
    14: 92,
    15: 108,
    16: 128,
  },
  weight: {
    4: "400",
    7: "400", // DM Serif Display only has 400
  },
  letterSpacing: {
    4: 0,
    5: -0.2,
    6: -0.3,
    7: -0.4,
    8: -0.5,
    9: -0.6,
    10: -0.8,
    11: -1,
  },
});

const bodyFont = createFont({
  family:
    '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  size: {
    1: 12,
    2: 13,
    3: 14,
    4: 15,
    true: 15,
    5: 16,
    6: 18,
    7: 22,
    8: 26,
    9: 30,
    10: 40,
    11: 46,
    12: 52,
    13: 60,
    14: 70,
    15: 85,
    16: 100,
  },
  lineHeight: {
    1: 18,
    2: 20,
    3: 21,
    4: 23,
    true: 23,
    5: 24,
    6: 27,
    7: 32,
    8: 36,
    9: 40,
    10: 52,
    11: 58,
    12: 64,
    13: 72,
    14: 84,
    15: 102,
    16: 120,
  },
  weight: {
    1: "300",
    3: "400",
    4: "400",
    true: "400",
    6: "500",
    7: "600",
    8: "700",
  },
  letterSpacing: {
    4: 0,
    7: -0.1,
    8: -0.15,
    9: -0.2,
  },
});

const tokens = createTokens({
  ...defaultConfig.tokens,
  size: {
    ...defaultConfig.tokens.size,
    "container.xs": 320,
    "container.sm": 384,
    "container.md": 448,
    "container.lg": 512,
    "container.xl": 576,
    "container.xxl": 672,
    "container.xxxl": 768,
    "container.full": 1120,
  },
  radius: {
    ...defaultConfig.tokens.radius,
    // Brutalist: override defaults to sharp edges
    0: 0,
    1: 0,
    2: 2,
    3: 3,
    4: 4,
    true: 0,
  },
});

export const config = createTamagui({
  ...defaultConfig,
  tokens,
  animations,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: true,
  },
});

export default config;

type Conf = typeof config;
declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
