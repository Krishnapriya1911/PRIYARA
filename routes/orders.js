const express = require("express");
const { db }  = require("../database");
const { authMiddleware, sellerOnly } = require("../middleware/auth");
const router  = express.Router();

// POST /api/orders
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { product_id, custom_name, custom_color, custom_size, custom_note } = req.body;
    if (!product_id) return res.status(400).json({ success:false, message:"Product ID required." });
    const product = await db.get("SELECT * FROM products WHERE id=? AND stock>0", [product_id]);
    if (!product) return res.status(404).json({ success:false, message:"Product not found or out of stock." });

    const result = await db.run(`
      INSERT INTO orders (buyer_id,seller_id,product_id,custom_name,custom_color,custom_size,custom_note,total_price)
      VALUES (?,?,?,?,?,?,?,?)
    `, [req.user.id, product.seller_id, product_id, custom_name, custom_color, custom_size, custom_note, product.price]);

    await db.run("UPDATE products SET stock=stock-1 WHERE id=?", [product_id]);

    const seller = await db.get("SELECT u.id as user_id FROM sellers s JOIN users u ON u.id=s.user_id WHERE s.id=?", [product.seller_id]);
    if (seller) {
      await db.run("INSERT INTO messages (sender_id,receiver_id,order_id,text) VALUES (?,?,?,?)",
        [req.user.id, seller.user_id, result.lastInsertRowid,
         `Hi! I just ordered "${product.title}"${custom_name?` — name: ${custom_name}`:""}${custom_note?`. Note: ${custom_note}`:""} 🌸`]);
    }

    res.status(201).json({ success:true, message:"Order placed! 🌸", order_id:result.lastInsertRowid });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/orders
router.get("/", authMiddleware, async (req, res) => {
  try {
    let orders;
    if (req.user.role === "buyer") {
      orders = await db.all(`
        SELECT o.*, p.title as product_title, p.emoji as product_emoji, p.thumb_bg,
               u.name as seller_name, u.avatar as seller_avatar
        FROM orders o JOIN products p ON p.id=o.product_id
        JOIN sellers s ON s.id=o.seller_id JOIN users u ON u.id=s.user_id
        WHERE o.buyer_id=? ORDER BY o.created_at DESC
      `, [req.user.id]);
    } else {
      const seller = await db.get("SELECT id FROM sellers WHERE user_id=?", [req.user.id]);
      if (!seller) return res.status(403).json({ success:false, message:"No seller profile." });
      orders = await db.all(`
        SELECT o.*, p.title as product_title, p.emoji, p.thumb_bg,
               u.name as buyer_name, u.avatar as buyer_avatar, u.city as buyer_city
        FROM orders o JOIN products p ON p.id=o.product_id JOIN users u ON u.id=o.buyer_id
        WHERE o.seller_id=? ORDER BY o.created_at DESC
      `, [seller.id]);
    }
    res.json({ success:true, orders });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/orders/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await db.get(`
      SELECT o.*, p.title, p.emoji, p.thumb_bg,
             ub.name as buyer_name, ub.avatar as buyer_avatar,
             us.name as seller_name, us.avatar as seller_avatar
      FROM orders o JOIN products p ON p.id=o.product_id
      JOIN users ub ON ub.id=o.buyer_id
      JOIN sellers s ON s.id=o.seller_id JOIN users us ON us.id=s.user_id
      WHERE o.id=? AND (o.buyer_id=? OR s.user_id=?)
    `, [req.params.id, req.user.id, req.user.id]);
    if (!order) return res.status(404).json({ success:false, message:"Order not found." });
    res.json({ success:true, order });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// PUT /api/orders/:id/status
router.put("/:id/status", authMiddleware, sellerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["confirmed","in_progress","shipped","delivered","cancelled"];
    if (!valid.includes(status)) return res.status(400).json({ success:false, message:`Status must be: ${valid.join(", ")}` });

    const seller = await db.get("SELECT id FROM sellers WHERE user_id=?", [req.user.id]);
    const order  = await db.get("SELECT * FROM orders WHERE id=? AND seller_id=?", [req.params.id, seller.id]);
    if (!order) return res.status(404).json({ success:false, message:"Order not found or not yours." });

    await db.run("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?", [status, req.params.id]);
    if (status==="delivered") await db.run("UPDATE sellers SET total_sales=total_sales+1 WHERE id=?", [seller.id]);

    const msgs = { confirmed:"Your order is confirmed! I'll start soon 🌸", in_progress:"Making your order now! Progress photos coming 🎨", shipped:"On its way! 📦", delivered:"Delivered! Hope you love it 💕", cancelled:"Order cancelled. Sorry for the inconvenience." };
    await db.run("INSERT INTO messages (sender_id,receiver_id,order_id,text) VALUES (?,?,?,?)",
      [req.user.id, order.buyer_id, order.id, msgs[status]]);

    res.json({ success:true, message:`Order marked as ${status}!` });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// PUT /api/orders/:id/cancel
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const order = await db.get("SELECT * FROM orders WHERE id=? AND buyer_id=? AND status='pending'", [req.params.id, req.user.id]);
    if (!order) return res.status(404).json({ success:false, message:"Order not found or cannot be cancelled." });
    await db.run("UPDATE orders SET status='cancelled', updated_at=datetime('now') WHERE id=?", [req.params.id]);
    await db.run("UPDATE products SET stock=stock+1 WHERE id=?", [order.product_id]);
    res.json({ success:true, message:"Order cancelled." });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
