/**
 * routes/sparepartRoute.js — Route data sparepart
 *
 * Base URL: /api/sparepart
 *
 * Endpoint:
 *   GET    /api/sparepart/get-all         — Ambil semua sparepart (dengan nama kategori & supplier)
 *   GET    /api/sparepart/get/:id         — Ambil satu sparepart berdasarkan ID
 *   GET    /api/sparepart/low-stock       — Ambil sparepart yang stoknya di bawah STOKMINIMUM
 *   GET    /api/sparepart/get-stok        — Ambil daftar sparepart dengan info stok saja (untuk dropdown)
 *   POST   /api/sparepart/create          — Tambah sparepart baru
 *   PUT    /api/sparepart/update/:id      — Edit data sparepart
 *   PUT    /api/sparepart/update-stok/:id — Update stok langsung (override)
 *   DELETE /api/sparepart/delete/:id      — Hapus sparepart
 */

const express = require("express");
const router = express.Router();
const {
  getAllSparepart,
  getSparepartById,
  getLowStock,
  createSparepart,
  updateSparepart,
  deleteSparepart,
  getStok,
  updateStok,
} = require("../controllers/sparepartController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Semua route wajib login
router.use(authMiddleware);

// Read — semua role
router.get("/get-all", getAllSparepart);
router.get("/get/:id", getSparepartById);
router.get("/low-stock", getLowStock); // Notifikasi stok menipis
router.get("/get-stok", getStok); // Untuk dropdown pilih sparepart

// Edit — admin & kasir
router.put("/update/:id", roleMiddleware("admin", "kasir"), updateSparepart);
router.put("/update-stok/:id", roleMiddleware("admin", "kasir"), updateStok); // Koreksi stok manual

// Create & Delete — admin saja
router.post("/create", roleMiddleware("admin"), createSparepart);
router.delete("/delete/:id", roleMiddleware("admin"), deleteSparepart);

module.exports = router;
