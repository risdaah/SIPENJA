/**
 * routes/pengeluaranRoute.js — Route pencatatan pengeluaran (pengisian stok)
 *
 * Base URL: /api/pengeluaran
 * Pengeluaran terjadi ketika admin/kasir mengisi (restock) sparepart dari supplier.
 * Setiap penambahan stok otomatis mencatat pengeluaran dan menambah stok sparepart.
 *
 * Endpoint:
 *   GET  /api/pengeluaran/get-all     — Ambil semua riwayat pengeluaran (perlu login)
 *   POST /api/pengeluaran/tambah-stok — Catat pengeluaran & tambah stok sparepart
 *                                       Body: { IDSPAREPART, QTY, HARGA_BELI, KETERANGAN }
 *                                       Hanya admin atau kasir yang bisa melakukan ini
 */

const express = require("express");
const router = express.Router();
const c = require("../controllers/pengeluaranController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Semua user yang login bisa lihat riwayat pengeluaran
router.get("/get-all", authMiddleware, c.getAll);

// Hanya admin dan kasir yang bisa menambah stok (dan mencatat pengeluaran)
router.post(
  "/tambah-stok",
  authMiddleware,
  roleMiddleware("kasir", "admin"),
  c.tambahStok,
);

module.exports = router;
