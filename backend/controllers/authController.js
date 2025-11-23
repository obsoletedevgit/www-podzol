import bcrypt from "bcrypt";
import { dbGet, dbRun } from "../config/database.js";

export const setupProfile = async (req, res) => {
	try {
		const {
			username,
			biography,
			pronouns,
			age,
			location,
			privacyMode,
			privatePassword,
			adminPassword,
		} = req.body;

		const existing = await dbGet(
			"SELECT is_setup_complete FROM profile WHERE id = 1"
		);
		if (existing && existing.is_setup_complete === 1) {
			return res.status(400).json({ error: "Setup already completed" });
		}

		const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
		const privatePasswordHash =
			privacyMode === "private" && privatePassword
				? await bcrypt.hash(privatePassword, 10)
				: null;

		await dbRun(
			`INSERT OR REPLACE INTO profile 
        (id, username, biography, pronouns, age, location, privacy_mode, 
         password_hash, admin_password_hash, is_setup_complete) 
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
			[
				username,
				biography || "",
				pronouns || "",
				age || null,
				location || "",
				privacyMode,
				privatePasswordHash,
				adminPasswordHash,
			]
		);

		res.json({ success: true, message: "Profile setup completed" });
	} catch (error) {
		console.error("Setup error:", error);
		res.status(500).json({ error: "Failed to complete setup" });
	}
};

export const adminLogin = async (req, res) => {
	try {
		const { password } = req.body;

		const profile = await dbGet(
			"SELECT admin_password_hash FROM profile WHERE id = 1"
		);

		if (!profile) {
			return res.status(400).json({ error: "Profile not set up" });
		}

		const isValid = await bcrypt.compare(
			password,
			profile.admin_password_hash
		);

		if (!isValid) {
			return res.status(401).json({ error: "Invalid password" });
		}

		req.session.isAdmin = true;
		res.json({ success: true });
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Login failed" });
	}
};

export const verifyPrivateAccess = async (req, res) => {
	try {
		const { password } = req.body;

		const profile = await dbGet(
			"SELECT password_hash, privacy_mode FROM profile WHERE id = 1"
		);

		if (!profile || profile.privacy_mode !== "private") {
			return res.status(400).json({ error: "Invalid request" });
		}

		const isValid = await bcrypt.compare(password, profile.password_hash);

		if (!isValid) {
			return res.status(401).json({ error: "Invalid password" });
		}

		req.session.hasPrivateAccess = true;
		res.json({ success: true });
	} catch (error) {
		console.error("Private access error:", error);
		res.status(500).json({ error: "Verification failed" });
	}
};

export const adminLogout = (req, res) => {
	req.session.destroy();
	res.json({ success: true });
};

export const checkSetup = async (req, res) => {
	try {
		const profile = await dbGet(
			"SELECT is_setup_complete FROM profile WHERE id = 1"
		);
		res.json({ isSetupComplete: profile?.is_setup_complete === 1 });
	} catch (error) {
		res.json({ isSetupComplete: false });
	}
};
