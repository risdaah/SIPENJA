/**
 * routes/kategoriSparepartRoute.js — Route kategori sparepart
 *
 * Base URL: /api/kategori-sparepart
 * Digunakan untuk mengelola pengelompokan sparepart (contoh: Oli, Filter, Busi).
 *
 * Endpoint:
 *   GET    /api/kategori-sparepart/get-all     — Ambil semua kategori
 *   GET    /api/kategori-sparepart/get/:id     — Ambil satu kategori berdasarkan ID
 *   POST   /api/kategori-sparepart/create      — Tambah kategori baru
 *   PUT    /api/kategori-sparepart/update/:id  — Edit kategori
 *   DELETE /api/kategori-sparepart/delete/:id  — Hapus kategori
 */

const express = require("express");
const router = express.Router();
const {
  getAllKategori,
  getKategoriById,
  createKategori,
  updateKategori,
  deleteKategori,
} = require("../controllers/kategoriSparepartController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Semua route wajib login
router.use(authMiddleware);

// Read — semua role
router.get("/get-all", getAllKategori);
router.get("/get/:id", getKategoriById);

// Edit — admin & kasir
router.put("/update/:id", roleMiddleware("admin", "kasir"), updateKategori);

// Create & Delete — admin saja
router.post("/create", roleMiddleware("admin"), createKategori);
router.delete("/delete/:id", roleMiddleware("admin"), deleteKategori);

module.exports = router;
