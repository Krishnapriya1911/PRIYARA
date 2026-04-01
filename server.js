require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const { initDB } = require("./database");

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/auth",     require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders",   require("./routes/orders"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api",          require("./routes/social"));

app.get("/api/health", (req, res) => res.json({ success: true, message: "🌸 Priyaraa is running!" }));
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use((err, req, res, next) => res.status(500).json({ success: false, message: err.message }));

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   🌸 Priyaraa is LIVE!                    ║
║   Open: http://localhost:${PORT}              ║
║   All pages: http://localhost:${PORT}/        ║
╚══════════════════════════════════════════╝
    `);
  });
}).catch(err => { console.error("❌ Failed:", err.message); process.exit(1); });
