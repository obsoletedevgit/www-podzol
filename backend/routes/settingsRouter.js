import express from "express";
import {
	getSettings,
	updateSettings,
} from "../controllers/settingsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getSettings);
router.post("/", authMiddleware, updateSettings);

export default router;
