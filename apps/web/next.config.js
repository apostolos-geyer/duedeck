/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/auth", "@repo/db"],

  experimental: {
    turbo: {
      resolveAlias: {
        "react-native": "react-native-web",
        "react-native-svg": "@tamagui/react-native-svg",
      },
    },
  },
};

export default nextConfig;
