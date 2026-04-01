/**
 * routes/authRoute.js — Route autentikasi
 *
 * Base URL: /api/auth
 *
 * Endpoint:
 *   POST /api/auth/login    — Login, terima USERNAME & PASSWORD, kembalikan JWT token
 *   GET  /api/auth/me       — Ambil data user yang sedang login (perlu token)
 *   POST /api/auth/logout   — Konfirmasi logout ke server (token dihapus di sisi client)
 */

const express = require("express");
const router = express.Router();

const { login, me, logout } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Login — tanpa token, route publik
router.post("/login", login);

// Cek user aktif — perlu token, dipakai frontend untuk load ulang data user
router.get("/me", authMiddleware, me);

// Logout — perlu token, hanya sebagai konfirmasi; penghapusan token di localStorage frontend
router.post("/logout", authMiddleware, logout);

module.exports = router;
