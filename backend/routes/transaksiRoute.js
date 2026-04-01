/**
 * routes/transaksiRoute.js — Route transaksi (SERVIS & PEMBELIAN)
 *
 * Base URL: /api/transaksi
 * Transaksi adalah induk dari semua aktivitas keuangan bengkel.
 * Ada dua jenis: SERVIS (kendaraan masuk servis) & PEMBELIAN (beli sparepart).
 *
 * Endpoint:
 *   GET    /api/transaksi/get-all               — Ambil semua transaksi
 *   GET    /api/transaksi/get/:id               — Ambil satu transaksi lengkap (+ detail SERVIS/PEMBELIAN)
 *   GET    /api/transaksi/struk/:id             — Ambil data lengkap untuk cetak struk/PDF
 *   GET    /api/transaksi/get-by-jenis/:jenis   — Filter by SERVIS atau PEMBELIAN
 *   GET    /api/transaksi/get-by-kasir/:idKasir — Filter by kasir (+ query ?jenis= opsional)
 *   GET    /api/transaksi/filter                — Filter by rentang tanggal (?startDate=&endDate=&jenis=)
 *   GET    /api/transaksi/filter-bulan          — Filter by bulan (?bulan=&tahun=&jenis=)
 *   POST   /api/transaksi/create               — Buat transaksi baru (SERVIS atau PEMBELIAN)
 *   PATCH  /api/transaksi/nohp/:id             — Update no. HP pelanggan di struk
 */

const express = require("express");
const router = express.Router();
const {
  getAllTransaksi,
  getTransaksiById,
  getTransaksiByJenis,
  getTransaksiByKasir,
  getTransaksiByDateRange,
  getTransaksiByBulan,
  createTransaksi,
  getStrukTransaksi,
  updateNohpTransaksi,
} = require("../controllers/transaksiController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Semua route wajib login
router.use(authMiddleware);

// Read dan Filter — semua role
router.get("/get-all", getAllTransaksi);
router.get("/get/:id", getTransaksiById); // Dengan detail sub-data
router.get("/get-by-jenis/:jenis", getTransaksiByJenis); // SERVIS | PEMBELIAN
router.get("/get-by-kasir/:idKasir", getTransaksiByKasir); // ?jenis= opsional
router.get("/filter", getTransaksiByDateRange); // ?startDate=&endDate=
router.get("/filter-bulan", getTransaksiByBulan); // ?bulan=&tahun=

// Menambahkan transaksi baru cuma kasir aja
router.post("/create", roleMiddleware("kasir"), createTransaksi);

//Kasier & Admin saja
router.get("/struk/:id", roleMiddleware("kasir", "admin"), getStrukTransaksi); // Untuk cetak PDF / kirim WA

router.patch(
  "/nohp/:id",
  roleMiddleware("kasir", "admin"),
  updateNohpTransaksi,
); // Update no. HP setelah transaksi dibuat

module.exports = router;
