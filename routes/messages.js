const express = require("express");
const { db }  = require("../database");
const { authMiddleware } = require("../middleware/auth");
const router  = express.Router();

// GET /api/messages/unread/count  ← must be before /:userId
router.get("/unread/count", authMiddleware, async (req, res) => {
  try {
    const row = await db.get("SELECT COUNT(*) as c FROM messages WHERE receiver_id=? AND read=0", [req.user.id]);
    res.json({ success:true, unread: row?.c || 0 });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/messages/conversations
router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const convs = await db.all(`
      SELECT CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END as other_id,
             u.name as other_name, u.avatar as other_avatar, u.role as other_role,
             m.text as last_message, m.created_at as last_time
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id=? THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id=? OR m.receiver_id=?
      GROUP BY other_id ORDER BY m.created_at DESC
    `, [req.user.id, req.user.id, req.user.id, req.user.id]);
    res.json({ success:true, conversations:convs });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/messages/:userId
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const msgs = await db.all(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m JOIN users u ON u.id=m.sender_id
      WHERE (m.sender_id=? AND m.receiver_id=?) OR (m.sender_id=? AND m.receiver_id=?)
      ORDER BY m.created_at ASC
    `, [req.user.id, req.params.userId, req.params.userId, req.user.id]);

    await db.run("UPDATE messages SET read=1 WHERE sender_id=? AND receiver_id=? AND read=0",
      [req.params.userId, req.user.id]);

    const other = await db.get(`
      SELECT u.id, u.name, u.avatar, u.role, s.craft, s.verified, s.rating
      FROM users u LEFT JOIN sellers s ON s.user_id=u.id WHERE u.id=?
    `, [req.params.userId]);

    res.json({ success:true, messages:msgs, other });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/messages/:userId
router.post("/:userId", authMiddleware, async (req, res) => {
  try {
    const { text, image_url, order_id } = req.body;
    if (!text && !image_url) return res.status(400).json({ success:false, message:"Message or image required." });
    const receiver = await db.get("SELECT id FROM users WHERE id=?", [req.params.userId]);
    if (!receiver) return res.status(404).json({ success:false, message:"User not found." });

    const result = await db.run(
      "INSERT INTO messages (sender_id,receiver_id,text,image_url,order_id) VALUES (?,?,?,?,?)",
      [req.user.id, req.params.userId, text||null, image_url||null, order_id||null]);

    const message = await db.get(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?
    `, [result.lastInsertRowid]);

    res.status(201).json({ success:true, message });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
