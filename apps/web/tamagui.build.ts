import type { TamaguiBuildOptions } from "@tamagui/core";

export default {
  components: ["tamagui", "@repo/ui"],
  config: "../../packages/ui/src/tamagui.config.ts",
  outputCSS: "./public/tamagui.generated.css",
} satisfies TamaguiBuildOptions;
