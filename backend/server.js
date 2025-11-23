import "dotenv/config";

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import fileUpload from "express-fileupload";
import apiRouter from "./routes/apiRouter.js";
import pageRouter from "./routes/pageRouter.js";
import db from "./config/database.js";
import settingsRouter from "./routes/settingsRouter.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	fileUpload({
		limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
	})
);
app.use(
	session({
		secret: process.env.SESSION_SECRET || "podzol-secret-key-change-me",
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: process.env.NODE_ENV === "production",
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		},
	})
);

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files
app.use(express.static(path.resolve(__dirname, "../frontend")));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.use("/api", apiRouter);
app.use("/api/settings", settingsRouter);
app.use("/", pageRouter);

// 404 handler
app.use((req, res) => {
	console.log(req.url, "not found");
	res.status(404).sendFile(
		path.join(__dirname, "../frontend/pages/404.html")
	);
});

// Error handler
app.use((err, req, res, next) => {
	console.error("Server error:", err);

	// Don't send HTML for API routes
	if (req.path.startsWith("/api")) {
		return res.status(500).json({ error: "Internal server error" });
	}

	res.status(500).send("Internal server error");
});

// Graceful shutdown
process.on("SIGINT", () => {
	console.log("\nShutting down gracefully...");
	db.close((err) => {
		if (err) {
			console.error("Error closing database:", err);
		}
		process.exit(0);
	});
});

app.listen(PORT, () => {
	console.log(`🌱 Podzol is running on http://localhost:3000`);
});
