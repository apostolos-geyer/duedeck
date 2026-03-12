import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: "./configs/hermes.openapi.json",
	output: { path: "./src/hermes" },
	plugins: [
		{
			name: "@hey-api/client-fetch",
			runtimeConfigPath: "../hermes.runtime",
		},
		"@hey-api/typescript",
		"@hey-api/schemas",
		"@hey-api/sdk",
	],
});
