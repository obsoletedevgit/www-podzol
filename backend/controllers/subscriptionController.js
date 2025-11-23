import { dbGet, dbAll, dbRun } from "../config/database.js";
import crypto from "crypto";
import { sendEmail } from "../utils/emailService.js";

export const subscribe = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email || !email.includes("@")) {
			return res.status(400).json({ error: "Invalid email address" });
		}

		const token = crypto.randomBytes(32).toString("hex");

		try {
			await dbRun(
				"INSERT INTO subscribers (email, unsubscribe_token) VALUES (?, ?)",
				[email, token]
			);

			const profile = await dbGet(
				"SELECT username FROM profile WHERE id = 1"
			);
			const baseUrl = process.env.BASE_URL || "http://localhost:3000";

			await sendEmail(
				email,
				`Subscribed to ${profile.username}'s Podzol`,
				`You've successfully subscribed to updates from ${profile.username}.

You'll receive email notifications when new posts are published.

To unsubscribe at any time, click here: ${baseUrl}/unsubscribe?token=${token}

---
This is an automated message from Podzol.`
			);

			res.json({ success: true, message: "Subscribed successfully" });
		} catch (error) {
			if (error.message.includes("UNIQUE")) {
				return res
					.status(400)
					.json({ error: "Email already subscribed" });
			}
			throw error;
		}
	} catch (error) {
		console.error("Subscribe error:", error);
		res.status(500).json({ error: "Failed to subscribe" });
	}
};

export const unsubscribe = async (req, res) => {
	try {
		const { token } = req.query;

		if (!token) {
			return res.status(400).json({ error: "Invalid unsubscribe link" });
		}

		const result = await dbRun(
			"UPDATE subscribers SET is_active = 0 WHERE unsubscribe_token = ? AND is_active = 1",
			[token]
		);

		if (result.changes === 0) {
			return res
				.status(404)
				.json({ error: "Subscription not found or already inactive" });
		}

		res.json({ success: true, message: "Unsubscribed successfully" });
	} catch (error) {
		console.error("Unsubscribe error:", error);
		res.status(500).json({ error: "Failed to unsubscribe" });
	}
};

export const unsubscribeUser = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({ error: "Email is required" });
		}

		const result = await dbRun(
			"UPDATE subscribers SET is_active = 0 WHERE email = ? AND is_active = 1",
			[email]
		);

		if (result.changes === 0) {
			return res.status(404).json({
				error: "Subscriber not found or already inactive",
			});
		}

		res.json({ success: true, message: "User unsubscribed successfully" });
	} catch (error) {
		console.error("Unsubscribe user error:", error);
		res.status(500).json({ error: "Failed to unsubscribe user" });
	}
};

export const getSubscribers = async (req, res) => {
	try {
		const subscribers = await dbAll(
			"SELECT email, subscribed_at, is_active FROM subscribers ORDER BY subscribed_at DESC"
		);
		res.json(subscribers);
	} catch (error) {
		console.error("Get subscribers error:", error);
		res.status(500).json({ error: "Failed to fetch subscribers" });
	}
};

export const notifySubscribers = async (postId) => {
	try {
		const subscribers = await dbAll(
			"SELECT email, unsubscribe_token FROM subscribers WHERE is_active = 1"
		);

		if (subscribers.length === 0) return;

		const post = await dbGet("SELECT * FROM posts WHERE id = ?", [postId]);
		const profile = await dbGet(
			"SELECT username FROM profile WHERE id = 1"
		);

		const baseUrl = process.env.BASE_URL || "http://localhost:3000";

		for (const subscriber of subscribers) {
			const subject = `New post from ${profile.username}`;
			let body = `${profile.username} has published a new ${post.type} post.\n\n`;

			if (post.title) body += `Title: ${post.title}\n\n`;
			if (post.content)
				body += post.content.substring(0, 500) + "...\n\n";

			body += `View the full post: ${baseUrl}\n\n`;
			body += `---\n`;
			body += `To unsubscribe from these notifications, click here:\n`;
			body += `${baseUrl}/unsubscribe?token=${subscriber.unsubscribe_token}\n\n`;
			body += `This is an automated message from Podzol.`;

			await sendEmail(subscriber.email, subject, body);
		}
	} catch (error) {
		console.error("Notify subscribers error:", error);
	}
};
