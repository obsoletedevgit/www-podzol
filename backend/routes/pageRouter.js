import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dbGet } from "../config/database.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkSetupComplete(req, res, next) {
	if (req.path.startsWith("/api")) {
		return next();
	}

	try {
		const profile = await dbGet(
			"SELECT is_setup_complete FROM profile WHERE id = 1"
		);

		const isSetupComplete = profile?.is_setup_complete === 1;

		if (!isSetupComplete && req.path !== "/setup") {
			return res.redirect("/setup");
		}

		if (isSetupComplete && req.path === "/setup") {
			return res.redirect("/");
		}

		next();
	} catch (error) {
		console.error("Setup check error:", error);
		next();
	}
}

router.use(checkSetupComplete);

router.get("/", (req, res) => {
	res.sendFile(path.resolve(__dirname, "../../frontend/pages/index.html"));
});

router.get("/links", (req, res) => {
	res.sendFile(path.resolve(__dirname, "../../frontend/pages/links.html"));
});

router.get("/admin", (req, res) => {
	res.sendFile(path.resolve(__dirname, "../../frontend/pages/admin.html"));
});

router.get("/settings", (req, res) => {
	res.sendFile(path.resolve(__dirname, "../../frontend/pages/settings.html"));
});

router.get("/setup", (req, res) => {
	res.sendFile(path.resolve(__dirname, "../../frontend/pages/setup.html"));
});

router.get("/unsubscribe", (req, res) => {
	res.sendFile(
		path.resolve(__dirname, "../../frontend/pages/unsubscribe.html")
	);
});

export default router;
