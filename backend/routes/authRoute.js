const express = require("express");
const router = express.Router();

const { login, me, logout } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

// POST /api/auth/login  — publik, tidak perlu token
router.post("/login", login);

// GET  /api/auth/me     — perlu token, kembalikan data user yang sedang login
router.get("/me", authMiddleware, me);

// POST /api/auth/logout — perlu token
router.post("/logout", authMiddleware, logout);

module.exports = router;
