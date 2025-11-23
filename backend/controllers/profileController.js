import { dbGet, dbRun } from "../config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getProfile = async (req, res) => {
	try {
		const profile = await dbGet(
			`SELECT username, biography, profile_picture, pronouns, age, 
              location, privacy_mode 
       FROM profile WHERE id = 1`
		);

		if (!profile) {
			return res.status(404).json({ error: "Profile not found" });
		}

		res.json(profile);
	} catch (error) {
		console.error("Get profile error:", error);
		res.status(500).json({ error: "Failed to fetch profile" });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { username, biography, pronouns, age, location } = req.body;

		await dbRun(
			`UPDATE profile 
       SET username = ?, biography = ?, pronouns = ?, age = ?, location = ? 
       WHERE id = 1`,
			[
				username,
				biography || "",
				pronouns || "",
				age || null,
				location || "",
			]
		);

		res.json({ success: true, message: "Profile updated" });
	} catch (error) {
		console.error("Update profile error:", error);
		res.status(500).json({ error: "Failed to update profile" });
	}
};

export const uploadProfilePicture = async (req, res) => {
	try {
		if (!req.files || !req.files.profilePicture) {
			return res.status(400).json({ error: "No file uploaded" });
		}

		const file = req.files.profilePicture;
		const uploadDir = path.resolve(__dirname, "../../uploads/profile");

		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		const fileName = `profile_${Date.now()}${path.extname(file.name)}`;
		const filePath = path.join(uploadDir, fileName);

		await file.mv(filePath);

		const relativePath = `/uploads/profile/${fileName}`;
		await dbRun("UPDATE profile SET profile_picture = ? WHERE id = 1", [
			relativePath,
		]);

		res.json({ success: true, path: relativePath });
	} catch (error) {
		console.error("Upload error:", error);
		res.status(500).json({ error: "Failed to upload profile picture" });
	}
};
