/**
 * routes/transaksiPembelianSparepartRoute.js — Route transaksi pembelian sparepart
 *
 * Base URL: /api/transaksi-pembelian-sparepart
 * Khusus untuk transaksi pembelian sparepart oleh pelanggan (tanpa servis).
 * Setiap pembelian otomatis mengurangi stok sparepart.
 *
 * Endpoint:
 *   GET    /api/transaksi-pembelian-sparepart/get-all        — Ambil semua transaksi pembelian
 *   GET    /api/transaksi-pembelian-sparepart/get/:id        — Ambil satu transaksi + detail item
 *   GET    /api/transaksi-pembelian-sparepart/filter         — Filter ?startDate=&endDate=
 *   POST   /api/transaksi-pembelian-sparepart/create         — Buat transaksi baru (stok berkurang)
 *   PUT    /api/transaksi-pembelian-sparepart/update/:id     — Update catatan transaksi
 *   PUT    /api/transaksi-pembelian-sparepart/update-item/:id — Update qty item (stok auto adjust)
 *   DELETE /api/transaksi-pembelian-sparepart/delete-item/:id — Hapus satu item (stok kembali)
 *   DELETE /api/transaksi-pembelian-sparepart/delete/:id     — Hapus seluruh transaksi (stok kembali)
 */

const express = require("express");
const router = express.Router();
const {
  getAllTransaksiPembelianSparepart,
  getTransaksiPembelianSparepartById,
  getTransaksiPembelianByDateRange,
  createTransaksiPembelianSparepart,
  updateTransaksiPembelianSparepart,
  updateItemPembelian,
  deleteItemPembelian,
  deleteTransaksiPembelianSparepart,
} = require("../controllers/transaksiPembelianSparepartController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Semua route wajib login
router.use(authMiddleware);

// Read — semua role
router.get("/get-all", getAllTransaksiPembelianSparepart);
router.get("/get/:id", getTransaksiPembelianSparepartById);
router.get("/filter", getTransaksiPembelianByDateRange);

// Kasir - Bisa Menambahkan Transaksi Pembelian Sparepart
router.post(
  "/create",
  roleMiddleware("kasir"),
  createTransaksiPembelianSparepart,
);

// Admin & Kasir - Bisa Update & Hapus Transaksi Pembelian Sparepart
router.put(
  "/update/:id",
  roleMiddleware("admin", "kasir"),
  updateTransaksiPembelianSparepart,
); // Update catatan saja
router.put(
  "/update-item/:id",
  roleMiddleware("admin", "kasir"),
  updateItemPembelian,
); // Update qty, harga tetap
router.delete(
  "/delete-item/:id",
  roleMiddleware("admin", "kasir"),
  deleteItemPembelian,
); // Hapus item, stok kembali
router.delete(
  "/delete/:id",
  roleMiddleware("admin", "kasir"),
  deleteTransaksiPembelianSparepart,
); // Hapus seluruh transaksi

module.exports = router;
