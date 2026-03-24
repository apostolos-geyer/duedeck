import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/ui",
    "@repo/app",
    "@repo/auth",
    "@repo/db",
    "@repo/storage",
    "@repo/hermes",
    "tamagui",
    "@tamagui/lucide-icons",
    "@tamagui/react-native-svg",
  ],

  turbopack: {
    resolveAlias: {
      "react-native": "react-native-web",
      "react-native-svg": "@tamagui/react-native-svg",
    },
    resolveExtensions: [
      ".web.tsx",
      ".web.ts",
      ".web.js",
      ".tsx",
      ".ts",
      ".js",
      ".jsx",
      ".json",
    ],
  },
};

export default withWorkflow(nextConfig);
