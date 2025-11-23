import bcrypt from "bcrypt";
import { dbGet, dbRun } from "../config/database.js";
import { configureEmail } from "../utils/emailService.js";
import { encryptValue } from "../utils/cryptoUtils.js";

export async function getSettings(req, res) {
	try {
		const profile = await dbGet(
			`SELECT username, biography, pronouns, age, location, privacy_mode 
       FROM profile WHERE id = 1`
		);

		const mail = await dbGet(
			`SELECT smtp_host, smtp_port, smtp_secure, smtp_user, from_email, from_name 
       FROM mail_config WHERE id = 1`
		);

		res.json({ profile, mail });
	} catch (err) {
		console.error("Get settings error:", err);
		res.status(500).json({ error: "Failed to load settings" });
	}
}

export async function updateSettings(req, res) {
	try {
		const {
			username,
			biography,
			pronouns,
			age,
			location,
			privacy_mode,
			private_password,
			smtp_host,
			smtp_port,
			smtp_secure,
			smtp_user,
			smtp_pass,
			from_email,
			from_name,
		} = req.body;

		let password_hash = null;
		if (privacy_mode === "private") {
			if (private_password && private_password.trim() !== "") {
				password_hash = await bcrypt.hash(private_password, 10);
			} else {
				const existing = await dbGet(
					"SELECT password_hash FROM profile WHERE id = 1"
				);
				password_hash = existing?.password_hash || null;
			}
		}

		await dbRun(
			`UPDATE profile SET username=?, biography=?, pronouns=?, age=?, 
        location=?, privacy_mode=?, password_hash=?
       WHERE id=1`,
			[
				username,
				biography || "",
				pronouns || "",
				age || null,
				location || "",
				privacy_mode,
				password_hash,
			]
		);

		let encryptedPass = null;
		if (smtp_pass && smtp_pass.trim() !== "") {
			encryptedPass = encryptValue(smtp_pass);
		} else {
			const existing = await dbGet(
				"SELECT smtp_pass FROM mail_config WHERE id = 1"
			);
			encryptedPass = existing?.smtp_pass || null;
		}

		await dbRun(
			`INSERT OR REPLACE INTO mail_config
       (id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, from_email, from_name)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
			[
				smtp_host,
				smtp_port || 587,
				smtp_secure ? 1 : 0,
				smtp_user,
				encryptedPass,
				from_email,
				from_name,
			]
		);

		await configureEmail();

		res.json({ success: true, message: "Settings updated successfully" });
	} catch (err) {
		console.error("[Settings] updateSettings error:", err);
		res.status(500).json({ error: "Failed to save settings" });
	}
}
