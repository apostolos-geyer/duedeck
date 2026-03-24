import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function deriveKey(): Buffer {
	const secret = process.env.BETTER_AUTH_SECRET;
	if (!secret) throw new Error("BETTER_AUTH_SECRET is required for token encryption");
	return createHash("sha256").update(secret).digest();
}

export function encryptToken(plaintext: string): string {
	const key = deriveKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

	const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();

	return `${iv.toString("base64")}.${encrypted.toString("base64")}.${tag.toString("base64")}`;
}

export function decryptToken(ciphertext: string): string {
	const key = deriveKey();
	const [ivB64, dataB64, tagB64] = ciphertext.split(".");
	if (!ivB64 || !dataB64 || !tagB64) throw new Error("Invalid encrypted token format");

	const iv = Buffer.from(ivB64, "base64");
	const encrypted = Buffer.from(dataB64, "base64");
	const tag = Buffer.from(tagB64, "base64");

	const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
	decipher.setAuthTag(tag);

	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
