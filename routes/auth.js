const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { db }  = require("../database");
const { authMiddleware } = require("../middleware/auth");
require("dotenv").config();

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, city, craft } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: "Name, email, password and role are required." });
    if (!["buyer","seller"].includes(role))
      return res.status(400).json({ success: false, message: "Role must be buyer or seller." });

    const existing = await db.get("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) return res.status(409).json({ success: false, message: "Email already registered. Please login." });

    const hashed = bcrypt.hashSync(password, 10);
    const result = await db.run(
      "INSERT INTO users (name,email,password,role,city) VALUES (?,?,?,?,?)",
      [name, email, hashed, role, city || null]
    );
    const userId = result.lastInsertRowid;

    if (role === "seller" && craft) {
      await db.run("INSERT INTO sellers (user_id,craft) VALUES (?,?)", [userId, craft]);
    }

    const user = await db.get("SELECT id,name,email,role,avatar,city FROM users WHERE id=?", [userId]);
    res.status(201).json({ success: true, message: "Welcome to Priyara 🌸", token: makeToken(user), user });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required." });

    const user = await db.get("SELECT * FROM users WHERE email=?", [email]);
    if (!user) return res.status(401).json({ success: false, message: "No account found with this email." });

    if (!bcrypt.compareSync(password, user.password))
      return res.status(401).json({ success: false, message: "Wrong password. Try again." });

    let seller = null;
    if (user.role === "seller")
      seller = await db.get("SELECT * FROM sellers WHERE user_id=?", [user.id]);

    const token = makeToken(user);
    res.json({
      success: true,
      message: `Welcome back, ${user.name}! 🌸`,
      token,
      user: { id:user.id, name:user.name, email:user.email, role:user.role,
              avatar:user.avatar, avatar_bg:user.avatar_bg, sona_name:user.sona_name,
              city:user.city, bio:user.bio, seller }
    });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await db.get(`
      SELECT u.id,u.name,u.email,u.role,u.avatar,u.avatar_bg,u.sona_name,
             u.sona_personality,u.city,u.bio,u.created_at,
             s.id as seller_id,s.craft,s.verified,s.rating,s.total_sales,s.followers
      FROM users u LEFT JOIN sellers s ON s.user_id=u.id WHERE u.id=?
    `, [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, user });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, city, bio, avatar, avatar_bg, sona_name, sona_personality } = req.body;
    await db.run(`
      UPDATE users SET
        name=COALESCE(?,name), city=COALESCE(?,city), bio=COALESCE(?,bio),
        avatar=COALESCE(?,avatar), avatar_bg=COALESCE(?,avatar_bg),
        sona_name=COALESCE(?,sona_name), sona_personality=COALESCE(?,sona_personality),
        updated_at=datetime('now')
      WHERE id=?
    `, [name,city,bio,avatar,avatar_bg,sona_name,sona_personality,req.user.id]);
    res.json({ success: true, message: "Profile updated! ✨" });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/change-password
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password)
      return res.status(400).json({ success: false, message: "Both passwords required." });
    const user = await db.get("SELECT password FROM users WHERE id=?", [req.user.id]);
    if (!bcrypt.compareSync(old_password, user.password))
      return res.status(401).json({ success: false, message: "Old password is incorrect." });
    await db.run("UPDATE users SET password=? WHERE id=?", [bcrypt.hashSync(new_password,10), req.user.id]);
    res.json({ success: true, message: "Password changed!" });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// ════════════════════════════════
//  POST /api/auth/google-login  — Google OAuth simulation
//  (In production: use passport.js + Google OAuth2 credentials)
// ════════════════════════════════
router.post("/google-login", async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    if (!name || !email)
      return res.status(400).json({ success: false, message: "Name and email required." });

    // Check if user exists
    let user = await db.get("SELECT * FROM users WHERE email=?", [email]);

    if (!user) {
      // Auto-create account for Google users
      const result = await db.run(
        "INSERT INTO users (name,email,password,role,avatar) VALUES (?,?,?,?,?)",
        [name, email, "google_oauth_no_password", "buyer", avatar || "🌸"]
      );
      user = await db.get("SELECT * FROM users WHERE id=?", [result.lastInsertRowid]);
    }

    const token = require("jsonwebtoken").sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: `Welcome, ${user.name}! 🌸`,
      token,
      user: { id:user.id, name:user.name, email:user.email,
              role:user.role, avatar:user.avatar, sona_name:user.sona_name }
    });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
