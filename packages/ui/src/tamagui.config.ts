import { defaultConfig } from "@tamagui/config/v5";
import { animations } from "@tamagui/config/v5-css";
import { createTamagui } from "tamagui";

export const config = createTamagui({
  ...defaultConfig,
  animations,
});

export default config;

type Conf = typeof config;
declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
