const express = require("express");
const multer  = require("multer");
const path    = require("path");
const { db }  = require("../database");
const { authMiddleware, sellerOnly, optionalAuth } = require("../middleware/auth");
const router  = express.Router();

const storage = multer.diskStorage({
  destination: (req,file,cb) => cb(null, process.env.UPLOAD_DIR||"./uploads"),
  filename:    (req,file,cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e6)}${path.extname(file.originalname)}`)
});
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images and videos are allowed."), false);
  }
};
const upload = multer({ storage, limits:{ fileSize:50*1024*1024 }, fileFilter });

// ── REELS ──
router.get("/reels", optionalAuth, async (req, res) => {
  try {
    const { category, live, page=1, limit=12 } = req.query;
    let where=[]; let params=[];
    if (category) { where.push("r.category=?"); params.push(category); }
    if (live)     { where.push("r.is_live=1"); }
    const wc = where.length ? "WHERE "+where.join(" AND ") : "";
    const reels = await db.all(`
      SELECT r.*, u.name as seller_name, u.avatar as seller_avatar, s.verified
      FROM reels r JOIN sellers s ON s.id=r.seller_id JOIN users u ON u.id=s.user_id
      ${wc} ORDER BY r.is_live DESC, r.created_at DESC LIMIT ? OFFSET ?
    `, [...params, +limit, (+page-1)*+limit]);
    res.json({ success:true, reels });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get("/reels/:id", async (req, res) => {
  try {
    const reel = await db.get(`
      SELECT r.*, u.name as seller_name, u.avatar as seller_avatar, s.verified
      FROM reels r JOIN sellers s ON s.id=r.seller_id JOIN users u ON u.id=s.user_id WHERE r.id=?
    `, [req.params.id]);
    if (!reel) return res.status(404).json({ success:false, message:"Reel not found." });
    res.json({ success:true, reel });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post("/reels", authMiddleware, sellerOnly, async (req, res) => {
  try {
    const { caption, emoji, thumb_bg, category, is_live } = req.body;
    if (!caption) return res.status(400).json({ success:false, message:"Caption required." });
    const seller = await db.get("SELECT id FROM sellers WHERE user_id=?", [req.user.id]);
    if (!seller) return res.status(403).json({ success:false, message:"No seller profile." });
    const result = await db.run(
      "INSERT INTO reels (seller_id,caption,emoji,thumb_bg,category,is_live) VALUES (?,?,?,?,?,?)",
      [seller.id, caption, emoji||"🎬", thumb_bg||"#1a1208", category||null, is_live?1:0]);
    res.status(201).json({ success:true, message:"Reel posted! ✨", reel_id:result.lastInsertRowid });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post("/reels/:id/like", authMiddleware, async (req, res) => {
  try {
    await db.run("UPDATE reels SET likes=likes+1 WHERE id=?", [req.params.id]);
    res.json({ success:true, message:"Liked! ❤️" });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.delete("/reels/:id", authMiddleware, sellerOnly, async (req, res) => {
  try {
    const seller = await db.get("SELECT id FROM sellers WHERE user_id=?", [req.user.id]);
    const reel   = await db.get("SELECT * FROM reels WHERE id=? AND seller_id=?", [req.params.id, seller.id]);
    if (!reel) return res.status(404).json({ success:false, message:"Reel not found." });
    await db.run("DELETE FROM reels WHERE id=?", [req.params.id]);
    res.json({ success:true, message:"Reel deleted." });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── MOMENTS ──
router.get("/moments", optionalAuth, async (req, res) => {
  try {
    const { page=1, limit=12 } = req.query;
    const moments = await db.all(`
      SELECT m.*, u.name as user_name, u.avatar as user_avatar,
             p.title as product_title, p.emoji as product_emoji
      FROM moments m JOIN users u ON u.id=m.user_id LEFT JOIN products p ON p.id=m.product_id
      ORDER BY m.created_at DESC LIMIT ? OFFSET ?
    `, [+limit, (+page-1)*+limit]);
    res.json({ success:true, moments });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post("/moments", authMiddleware, upload.single("media"), async (req, res) => {
  try {
    const { caption, product_id, emoji, thumb_bg, type } = req.body;
    if (!caption) return res.status(400).json({ success:false, message:"Caption required." });
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const result = await db.run(
      "INSERT INTO moments (user_id,product_id,caption,image_url,emoji,thumb_bg,type) VALUES (?,?,?,?,?,?,?)",
      [req.user.id, product_id||null, caption, image_url, emoji||"📸", thumb_bg||"#FDE8EF", type||"photo"]);
    const moment = await db.get(`
      SELECT m.*, u.name as user_name, u.avatar as user_avatar
      FROM moments m JOIN users u ON u.id=m.user_id WHERE m.id=?
    `, [result.lastInsertRowid]);
    res.status(201).json({ success:true, message:"Moment shared! 🌸", moment });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post("/moments/:id/like", authMiddleware, async (req, res) => {
  try {
    const existing = await db.get("SELECT id FROM moment_likes WHERE moment_id=? AND user_id=?", [req.params.id, req.user.id]);
    if (existing) {
      await db.run("DELETE FROM moment_likes WHERE moment_id=? AND user_id=?", [req.params.id, req.user.id]);
      await db.run("UPDATE moments SET likes=MAX(0,likes-1) WHERE id=?", [req.params.id]);
      return res.json({ success:true, liked:false });
    }
    await db.run("INSERT INTO moment_likes (moment_id,user_id) VALUES (?,?)", [req.params.id, req.user.id]);
    await db.run("UPDATE moments SET likes=likes+1 WHERE id=?", [req.params.id]);
    res.json({ success:true, liked:true });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.delete("/moments/:id", authMiddleware, async (req, res) => {
  try {
    const m = await db.get("SELECT * FROM moments WHERE id=? AND user_id=?", [req.params.id, req.user.id]);
    if (!m) return res.status(404).json({ success:false, message:"Moment not found." });
    await db.run("DELETE FROM moments WHERE id=?", [req.params.id]);
    res.json({ success:true, message:"Moment deleted." });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── SELLERS ──
router.get("/sellers", optionalAuth, async (req, res) => {
  try {
    const sellers = await db.all(`
      SELECT s.*, u.name, u.avatar, u.city, u.bio
      FROM sellers s JOIN users u ON u.id=s.user_id ORDER BY s.total_sales DESC
    `);
    res.json({ success:true, sellers });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get("/sellers/:id", optionalAuth, async (req, res) => {
  try {
    const seller   = await db.get("SELECT s.*, u.name, u.avatar, u.city, u.bio FROM sellers s JOIN users u ON u.id=s.user_id WHERE s.id=?", [req.params.id]);
    if (!seller) return res.status(404).json({ success:false, message:"Seller not found." });
    const products = await db.all("SELECT * FROM products WHERE seller_id=? AND stock>0", [req.params.id]);
    const reels    = await db.all("SELECT * FROM reels WHERE seller_id=? ORDER BY created_at DESC LIMIT 6", [req.params.id]);
    const reviews  = await db.all(`
      SELECT r.*, u.name as buyer_name FROM reviews r
      JOIN products p ON p.id=r.product_id JOIN users u ON u.id=r.buyer_id
      WHERE p.seller_id=? ORDER BY r.created_at DESC LIMIT 10
    `, [req.params.id]);
    res.json({ success:true, seller, products, reels, reviews });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── SONA AI ──
router.post("/sona/query", optionalAuth, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success:false, message:"Query required." });
    const q = query.toLowerCase();
    let cat = "general";
    if (/birthday|bday/.test(q))        cat = "birthday";
    else if (/anniversary/.test(q))     cat = "anniversary";
    else if (/baby|newborn/.test(q))    cat = "baby";
    else if (/diwali|festival/.test(q)) cat = "diwali";
    else if (/wedding|shaadi/.test(q))  cat = "wedding";
    else if (/valentine|love/.test(q))  cat = "valentine";
    else if (/mother|mom|maa/.test(q))  cat = "mother";
    else if (/rakhi/.test(q))           cat = "rakhi";
    else if (/teacher/.test(q))         cat = "teacher";

    const products = await db.all(`
      SELECT p.*, u.name as seller_name, s.rating FROM products p
      JOIN sellers s ON s.id=p.seller_id JOIN users u ON u.id=s.user_id
      WHERE p.stock>0 LIMIT 4
    `);

    await db.run("INSERT INTO sona_logs (user_id,query,category) VALUES (?,?,?)",
      [req.user?.id||null, query, cat]);

    res.json({ success:true, category:cat, suggestions:products, message:`Found ${products.length} handmade gifts! 🎁` });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
