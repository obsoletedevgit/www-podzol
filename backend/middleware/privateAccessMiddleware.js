import { dbGet } from "../config/database.js";

export default async (req, res, next) => {
	try {
		const profile = await dbGet(
			"SELECT privacy_mode FROM profile WHERE id = 1"
		);

		if (!profile) {
			return res.status(500).json({ error: "Profile not configured" });
		}

		if (
			profile.privacy_mode === "private" &&
			!req.session.hasPrivateAccess &&
			!req.session.isAdmin
		) {
			return res
				.status(403)
				.json({ error: "Access denied", requiresPassword: true });
		}

		next();
	} catch (error) {
		console.error("Private access middleware error:", error);
		res.status(500).json({ error: "Failed to verify access" });
	}
};
