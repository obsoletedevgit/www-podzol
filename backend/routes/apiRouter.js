import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import privateAccessMiddleware from "../middleware/privateAccessMiddleware.js";
import {
	setupProfile,
	adminLogin,
	adminLogout,
	verifyPrivateAccess,
	checkSetup,
} from "../controllers/authController.js";
import {
	getProfile,
	updateProfile,
	uploadProfilePicture,
} from "../controllers/profileController.js";
import {
	getPosts,
	getPost,
	createPost,
	updatePost,
	deletePost,
} from "../controllers/postController.js";
import {
	subscribe,
	unsubscribe,
	unsubscribeUser,
	getSubscribers,
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.get("/setup/check", checkSetup);
router.post("/setup", setupProfile);
router.post("/auth/admin/login", adminLogin);
router.post("/auth/admin/logout", adminLogout);
router.post("/auth/private/verify", verifyPrivateAccess);

router.get("/profile", privateAccessMiddleware, getProfile);

router.get("/posts", privateAccessMiddleware, getPosts);
router.get("/posts/:id", privateAccessMiddleware, getPost);

router.post("/subscribe", subscribe);
router.get("/unsubscribe", unsubscribe);

router.put("/profile", authMiddleware, updateProfile);
router.post("/profile/picture", authMiddleware, uploadProfilePicture);
router.post("/posts", authMiddleware, createPost);
router.put("/posts/:id", authMiddleware, updatePost);
router.delete("/posts/:id", authMiddleware, deletePost);
router.get("/subscribers", authMiddleware, getSubscribers);
router.post("/subscribers/unsubscribe-user", authMiddleware, unsubscribeUser);

export default router;
