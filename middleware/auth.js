const jwt = require("jsonwebtoken");
require("dotenv").config();

// ── Protect routes — must be logged in ──
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token. Please login." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token. Please login again." });
  }
}

// ── Seller only routes ──
function sellerOnly(req, res, next) {
  if (req.user.role !== "seller") {
    return res.status(403).json({ success: false, message: "Only sellers can do this." });
  }
  next();
}

// ── Optional auth (attaches user if token exists, doesn't block) ──
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {}
  }
  next();
}

module.exports = { authMiddleware, sellerOnly, optionalAuth };
