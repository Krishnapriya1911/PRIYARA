const express = require("express");
const { db }  = require("../database");
const { authMiddleware, sellerOnly, optionalAuth } = require("../middleware/auth");
const router  = express.Router();

// GET /api/products
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { category, search, min_price, max_price, seller_id, page=1, limit=12 } = req.query;
    const offset = (page-1)*limit;
    let where=[]; let params=[];
    if (category)  { where.push("p.category=?");  params.push(category); }
    if (seller_id) { where.push("p.seller_id=?"); params.push(seller_id); }
    if (min_price) { where.push("p.price>=?");    params.push(min_price); }
    if (max_price) { where.push("p.price<=?");    params.push(max_price); }
    if (search)    { where.push("p.title LIKE ?"); params.push(`%${search}%`); }
    const wc = where.length ? "WHERE "+where.join(" AND ") : "";

    const products = await db.all(`
      SELECT p.*, u.name as seller_name, u.avatar as seller_avatar, s.verified, s.rating
      FROM products p
      JOIN sellers s ON s.id=p.seller_id
      JOIN users   u ON u.id=s.user_id
      ${wc}
      ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `, [...params, +limit, +offset]);

    const total = (await db.get(`SELECT COUNT(*) as c FROM products p ${wc}`, params))?.c || 0;
    res.json({ success:true, products, pagination:{ total, page:+page, limit:+limit, pages:Math.ceil(total/limit) }});
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/products/:id
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const product = await db.get(`
      SELECT p.*, u.name as seller_name, u.avatar as seller_avatar, u.city as seller_city,
             s.id as seller_id, s.verified, s.rating, s.total_sales, s.followers, s.response_time
      FROM products p
      JOIN sellers s ON s.id=p.seller_id JOIN users u ON u.id=s.user_id
      WHERE p.id=?
    `, [req.params.id]);
    if (!product) return res.status(404).json({ success:false, message:"Product not found." });

    const reviews = await db.all(`
      SELECT r.*, u.name as buyer_name, u.avatar as buyer_avatar
      FROM reviews r JOIN users u ON u.id=r.buyer_id
      WHERE r.product_id=? ORDER BY r.created_at DESC LIMIT 10
    `, [req.params.id]);

    if (product.custom_options) {
      try { product.custom_options = JSON.parse(product.custom_options); } catch(_){}
    }
    res.json({ success:true, product, reviews });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/products
router.post("/", authMiddleware, sellerOnly, async (req, res) => {
  try {
    const { title, description, price, emoji, thumb_bg, category, is_customizable, custom_options, stock } = req.body;
    if (!title || !price) return res.status(400).json({ success:false, message:"Title and price required." });
    const seller = await db.get("SELECT id FROM sellers WHERE user_id=?", [req.user.id]);
    if (!seller) return res.status(403).json({ success:false, message:"No seller profile found." });

    const result = await db.run(`
      INSERT INTO products (seller_id,title,description,price,emoji,thumb_bg,category,is_customizable,custom_options,stock)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `, [seller.id, title, description, price, emoji||"🎁", thumb_bg||"#FDE8EF", category,
        is_customizable??1, custom_options?JSON.stringify(custom_options):null, stock||10]);

    res.status(201).json({ success:true, message:"Product listed! ✨", product_id:result.lastInsertRowid });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// PUT /api/products/:id
router.put("/:id", authMiddleware, sellerOnly, async (req, res) => {
  try {
    const seller  = await db.get("SELECT id FROM sellers WHERE user_id=?", [req.user.id]);
    const product = await db.get("SELECT * FROM products WHERE id=? AND seller_id=?", [req.params.id, seller.id]);
    if (!product) return res.status(404).json({ success:false, message:"Product not found or not yours." });
    const { title, description, price, emoji, thumb_bg, category, stock } = req.body;
    await db.run(`UPDATE products SET title=COALESCE(?,title), description=COALESCE(?,description),
      price=COALESCE(?,price), emoji=COALESCE(?,emoji), thumb_bg=COALESCE(?,thumb_bg),
      category=COALESCE(?,category), stock=COALESCE(?,stock) WHERE id=?`,
      [title, description, price, emoji, thumb_bg, category, stock, req.params.id]);
    res.json({ success:true, message:"Product updated!" });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// DELETE /api/products/:id
router.delete("/:id", authMiddleware, sellerOnly, async (req, res) => {
  try {
    const seller  = await db.get("SELECT id FROM sellers WHERE user_id=?", [req.user.id]);
    const product = await db.get("SELECT * FROM products WHERE id=? AND seller_id=?", [req.params.id, seller.id]);
    if (!product) return res.status(404).json({ success:false, message:"Product not found." });
    await db.run("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ success:true, message:"Product deleted." });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/products/:id/review
router.post("/:id/review", authMiddleware, async (req, res) => {
  try {
    const { rating, comment, order_id } = req.body;
    if (!rating || rating<1 || rating>5)
      return res.status(400).json({ success:false, message:"Rating must be 1–5." });
    const order = await db.get(
      "SELECT * FROM orders WHERE id=? AND buyer_id=? AND product_id=? AND status='delivered'",
      [order_id, req.user.id, req.params.id]);
    if (!order) return res.status(403).json({ success:false, message:"Only buyers with delivered orders can review." });
    const existing = await db.get("SELECT id FROM reviews WHERE order_id=?", [order_id]);
    if (existing) return res.status(409).json({ success:false, message:"Already reviewed." });
    await db.run("INSERT INTO reviews (product_id,buyer_id,order_id,rating,comment) VALUES (?,?,?,?,?)",
      [req.params.id, req.user.id, order_id, rating, comment]);
    res.status(201).json({ success:true, message:"Review posted! 🌸" });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
