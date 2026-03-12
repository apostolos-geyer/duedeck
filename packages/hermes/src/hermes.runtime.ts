import type { CreateClientConfig } from "./hermes/client.gen";

export const createClientConfig: CreateClientConfig = (config) => ({
	...config,
	baseUrl: process.env.HERMES_API_URL ?? "http://127.0.0.1:8000",
});
