/**
 * routes/layananServisRoute.js — Route layanan servis
 *
 * Base URL: /api/layanan-servis
 * Layanan servis adalah jenis-jenis pekerjaan bengkel beserta biaya pokoknya
 * (contoh: Ganti Oli, Tune Up, Balancing).
 *
 * Endpoint:
 *   GET    /api/layanan-servis/get-all     — Ambil semua layanan
 *   GET    /api/layanan-servis/get/:id     — Ambil satu layanan berdasarkan ID
 *   POST   /api/layanan-servis/create      — Tambah layanan baru
 *   PUT    /api/layanan-servis/update/:id  — Edit layanan
 *   DELETE /api/layanan-servis/delete/:id  — Hapus layanan
 */

const express = require("express");
const router = express.Router();
const {
  getAllLayanan,
  getLayananById,
  createLayanan,
  updateLayanan,
  deleteLayanan,
} = require("../controllers/layananServisController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Semua route wajib login
router.use(authMiddleware);

// Read — semua role
router.get("/get-all", getAllLayanan);
router.get("/get/:id", getLayananById);

// Create & Delete — admin saja
router.post("/create", roleMiddleware("admin"), createLayanan);
router.delete("/delete/:id", roleMiddleware("admin"), deleteLayanan);

// Edit — admin & kasir
router.put("/update/:id", roleMiddleware("admin", "kasir"), updateLayanan);

module.exports = router;
