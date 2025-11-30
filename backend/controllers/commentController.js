import { dbGet, dbAll, dbRun } from "../config/database.js";

// Get comments for a post
export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await dbAll(
            `SELECT id, name, content, created_at 
       FROM comments 
       WHERE post_id = ? AND is_approved = 1 
       ORDER BY created_at ASC`,
            [postId]
        );
        res.json(comments);
    } catch (error) {
        console.error("Get comments error:", error);
        res.status(500).json({ error: "Failed to load comments" });
    }
};

// Add new comment (public endpoint)
export const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { name, content } = req.body;

        if (!name || !content) {
            return res
                .status(400)
                .json({ error: "Name and comment are required" });
        }

        // Basic anti-spam validation
        if (content.length > 1000) {
            return res.status(400).json({ error: "Comment too long" });
        }

        await dbRun(
            `INSERT INTO comments (post_id, name, content, is_approved) 
       VALUES (?, ?, ?, 1)`,
            [postId, name, content]
        );

        res.json({ success: true, message: "Comment added" });
    } catch (error) {
        console.error("Create comment error:", error);
        res.status(500).json({ error: "Failed to post comment" });
    }
};

// Admin: view all comments
export const getAllComments = async (req, res) => {
    try {
        const comments = await dbAll(
            `SELECT c.*, p.title AS post_title 
       FROM comments c 
       LEFT JOIN posts p ON c.post_id = p.id 
       ORDER BY c.created_at DESC`
        );
        res.json(comments);
    } catch (error) {
        console.error("Get all comments error:", error);
        res.status(500).json({ error: "Failed to load comments" });
    }
};

// Admin: delete a comment
export const deleteComment = async (req, res) => {
    try {
        await dbRun("DELETE FROM comments WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Delete comment error:", error);
        res.status(500).json({ error: "Failed to delete comment" });
    }
};
