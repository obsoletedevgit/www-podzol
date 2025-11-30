import { dbGet, dbAll, dbRun } from "../config/database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { notifySubscribers } from "./subscriptionController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getPosts = async (req, res) => {
    try {
        const { type } = req.query;
        let sql = "SELECT * FROM posts WHERE is_published = 1";
        const params = [];

        // ✅ If this is an admin session, include everything
        if (req.session?.isAdmin) {
            if (type) {
                sql += " AND type = ?";
                params.push(type);
            }
        } else {
            // Non‑admin (public) request excludes link posts
            if (type) {
                sql += " AND type = ?";
                params.push(type);
            } else {
                sql += " AND type != 'link'";
            }
        }

        sql += " ORDER BY created_at DESC";

        const posts = await dbAll(sql, params);

        const parsedPosts = posts.map((post) => ({
            ...post,
            images: post.images ? JSON.parse(post.images) : [],
        }));

        res.json(parsedPosts);
    } catch (error) {
        console.error("Get posts error:", error);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
};

export const getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await dbGet(
            "SELECT * FROM posts WHERE id = ? AND is_published = 1",
            [id]
        );

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        post.images = post.images ? JSON.parse(post.images) : [];
        res.json(post);
    } catch (error) {
        console.error("Get post error:", error);
        res.status(500).json({ error: "Failed to fetch post" });
    }
};

export const createPost = async (req, res) => {
    try {
        const { type, title, content, linkUrl, linkTitle, linkDescription } =
            req.body;
        const images = [];

        if (req.files && req.files.images) {
            const uploadDir = path.resolve(__dirname, "../../uploads/posts");
            if (!fs.existsSync(uploadDir))
                fs.mkdirSync(uploadDir, { recursive: true });

            const files = Array.isArray(req.files.images)
                ? req.files.images
                : [req.files.images];

            for (const file of files) {
                const fileName = `${Date.now()}_${file.name}`;
                const filePath = path.join(uploadDir, fileName);
                await file.mv(filePath);
                images.push(`/uploads/posts/${fileName}`);
            }
        }

        const result = await dbRun(
            `INSERT INTO posts 
	        (type, title, content, images, link_url, link_title, link_description)
	       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                type,
                title || "",
                content || "",
                JSON.stringify(images),
                linkUrl || "",
                linkTitle || "",
                linkDescription || "",
            ]
        );

        (async () => {
            try {
                console.log(
                    `[POST] notifying subscribers for new post ${result.id}`
                );
                await notifySubscribers(result.id);
            } catch (notifyErr) {
                console.error("notifySubscribers() failed:", notifyErr);
            }
        })();

        res.json({ success: true, id: result.id });
    } catch (error) {
        console.error("Create post error:", error);
        res.status(500).json({ error: "Failed to create post" });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, linkUrl, linkTitle, linkDescription } =
            req.body;

        await dbRun(
            `UPDATE posts 
       SET title = ?, content = ?, link_url = ?, link_title = ?, 
           link_description = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
            [
                title || "",
                content || "",
                linkUrl || "",
                linkTitle || "",
                linkDescription || "",
                id,
            ]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Update post error:", error);
        res.status(500).json({ error: "Failed to update post" });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await dbGet("SELECT images FROM posts WHERE id = ?", [id]);

        if (post && post.images) {
            const images = JSON.parse(post.images);
            for (const imagePath of images) {
                const fullPath = path.resolve(
                    __dirname,
                    "../../frontend",
                    imagePath.substring(1)
                );
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
        }

        await dbRun("DELETE FROM posts WHERE id = ?", [id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete post error:", error);
        res.status(500).json({ error: "Failed to delete post" });
    }
};
