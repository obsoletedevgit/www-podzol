import crypto from "crypto";

console.log("RAW ENV VAR:", process.env.MAIL_ENCRYPTION_KEY);
console.log("RAW ENV VAR LENGTH:", process.env.MAIL_ENCRYPTION_KEY?.length);

const ENCRYPTION_KEY = Buffer.from(
	process.env.MAIL_ENCRYPTION_KEY || "",
	"hex"
);

console.log("ENCRYPTION_KEY Buffer length:", ENCRYPTION_KEY.length);
console.log("ENCRYPTION_KEY is valid:", ENCRYPTION_KEY.length === 32);

const ALGORITHM = "aes-256-gcm";

export function encryptValue(plainText) {
	console.log("encryptValue - plainText exists:", !!plainText);
	console.log("encryptValue - KEY length:", ENCRYPTION_KEY.length);

	if (!plainText || !ENCRYPTION_KEY.length) {
		console.log(
			"Returning NULL - plainText:",
			!!plainText,
			"KEY:",
			ENCRYPTION_KEY.length
		);
		return null;
	}

	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
	const encrypted = Buffer.concat([
		cipher.update(plainText, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();
	const result = Buffer.concat([iv, authTag, encrypted]).toString("base64");
	console.log("Encryption successful, result length:", result.length);
	return result;
}

export function decryptValue(base64Text) {
	if (!base64Text || !ENCRYPTION_KEY.length) return null;

	try {
		const data = Buffer.from(base64Text, "base64");
		const iv = data.subarray(0, 12);
		const authTag = data.subarray(12, 28);
		const ciphertext = data.subarray(28);
		const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
		decipher.setAuthTag(authTag);
		const decrypted = Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(),
		]);
		return decrypted.toString("utf8");
	} catch (err) {
		console.error("[Crypto] Decrypt failed:", err.message);
		return null;
	}
}
