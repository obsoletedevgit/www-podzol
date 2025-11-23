import nodemailer from "nodemailer";
import { dbGet, dbRun } from "../config/database.js";
import { decryptValue, encryptValue } from "./cryptoUtils.js";

function logMailEvent(level, message, meta = {}) {
	const time = new Date().toISOString();
	const prefix = `[MAIL][${level.toUpperCase()}][${time}]`;
	const details = Object.keys(meta).length
		? `\n  ↳ ${JSON.stringify(meta, null, 2)}`
		: "";
	console.log(`${prefix} ${message}${details}`);
}

let transporter = null;

async function initializeTransporter() {
	try {
		const config = await dbGet("SELECT * FROM mail_config WHERE id = 1");

		if (!config || !config.smtp_host) {
			logMailEvent("warn", "Email not configured (no SMTP host in DB)");
			return null;
		}

		let decryptedPass = config.smtp_pass;
		if (decryptedPass && decryptedPass.length > 8) {
			try {
				const maybePlain = decryptValue(decryptedPass);
				if (maybePlain) decryptedPass = maybePlain;
			} catch {
				logMailEvent(
					"warn",
					"Failed to decrypt smtp_pass, using raw text"
				);
			}
		}

		logMailEvent(
			"info",
			`Initializing transporter for ${config.smtp_host}:${config.smtp_port}`
		);

		transporter = nodemailer.createTransport({
			host: config.smtp_host,
			port: Number(config.smtp_port) || 587,
			secure: !!config.smtp_secure,
			auth:
				config.smtp_user && decryptedPass
					? { user: config.smtp_user, pass: decryptedPass }
					: undefined,
			connectionTimeout: 30000,
			greetingTimeout: 20000,
		});

		await transporter.verify();
		logMailEvent("info", "SMTP transporter verification successful");

		return transporter;
	} catch (error) {
		logMailEvent("error", "initializeTransporter failed", {
			name: error.name,
			message: error.message,
		});
		return null;
	}
}

export async function sendEmail(to, subject, text) {
	try {
		if (!transporter) {
			logMailEvent("debug", "No transporter cached. Initializing...");
			transporter = await initializeTransporter();
		}

		if (!transporter) {
			logMailEvent("warn", "Email not sent: transporter not available");
			return false;
		}

		const config = await dbGet("SELECT * FROM mail_config WHERE id = 1");
		if (!config) {
			logMailEvent("warn", "Email config missing in DB");
			return false;
		}

		const mailOptions = {
			from: `"${config.from_name || "Podzol"}" <${
				config.from_email || config.smtp_user
			}>`,
			to,
			subject,
			text,
		};

		const info = await transporter.sendMail(mailOptions);
		logMailEvent("info", "Email successfully sent", {
			to,
			subject,
			messageId: info.messageId,
			response: info.response,
		});
		return true;
	} catch (error) {
		const hint =
			{
				EAUTH: "Authentication failed. Verify SMTP_USER / SMTP_PASS.",
				ENOTFOUND: "SMTP host not found. Check SMTP_HOST.",
				ECONNECTION:
					"Unable to connect to the SMTP server - network/firewall.",
				ETIMEDOUT: "SMTP connection timed out.",
				ECONNREFUSED: "SMTP connection refused. Wrong host/port?",
			}[error.code] || "Check SMTP credentials or mail server status.";

		logMailEvent("error", "Send email failed", {
			name: error.name,
			code: error.code,
			message: error.message,
			hint,
		});
		return false;
	}
}

export async function configureEmail(config = null) {
	try {
		if (!config || !config.smtp_host) {
			logMailEvent(
				"info",
				"Reloading SMTP configuration from database..."
			);
			transporter = await initializeTransporter();
			if (transporter) {
				logMailEvent(
					"info",
					"SMTP transporter refreshed from DB config"
				);
				return true;
			} else {
				logMailEvent(
					"warn",
					"No SMTP configuration found in DB to reload"
				);
				return false;
			}
		}

		logMailEvent("info", "Saving new SMTP configuration", {
			host: config.smtp_host,
			port: config.smtp_port,
			user: config.smtp_user,
			secure: !!config.smtp_secure,
		});

		const encryptedPass = config.smtp_pass
			? encryptValue(config.smtp_pass)
			: null;

		await dbRun(
			`INSERT OR REPLACE INTO mail_config
        (id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass,
         from_email, from_name)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
			[
				config.smtp_host,
				config.smtp_port,
				config.smtp_secure ? 1 : 0,
				config.smtp_user,
				encryptedPass,
				config.from_email,
				config.from_name,
			]
		);

		transporter = await initializeTransporter();
		if (transporter) {
			logMailEvent(
				"info",
				"SMTP configuration successfully saved and reloaded"
			);
		}

		return true;
	} catch (error) {
		logMailEvent("error", "configureEmail failed", {
			message: error.message,
			stack: error.stack?.split("\n")[0],
		});
		return false;
	}
}
