/**
 * routes/dashboardRoute.js — Route data dashboard admin
 *
 * Base URL: /api/dashboard
 * Semua endpoint mendukung filter periode via query parameter:
 *   ?tgl_awal=YYYY-MM-DD&tgl_akhir=YYYY-MM-DD
 *   atau ?bulan=1&tahun=2026
 *   (jika tidak diisi, default ke bulan berjalan)
 *
 * Endpoint:
 *   GET /api/dashboard/stats          — Total sparepart, layanan, dan transaksi (angka ringkas)
 *   GET /api/dashboard/pendapatan     — Total pendapatan (sum TRANSAKSI.TOTAL) dalam periode
 *   GET /api/dashboard/pengeluaran    — Total pengeluaran (sum PENGELUARAN.TOTAL) dalam periode
 *   GET /api/dashboard/top-sparepart  — Top 10 sparepart paling banyak terjual dalam periode
 *   GET /api/dashboard/top-layanan    — Top 5 layanan servis paling sering selesai dalam periode
 *   GET /api/dashboard/grafik         — Data grafik pendapatan vs pengeluaran per bulan
 */

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/DashboardController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Semua route dashboard hanya untuk admin
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/stats", dashboardController.getStats);
router.get("/pendapatan", dashboardController.getPendapatan);
router.get("/pengeluaran", dashboardController.getPengeluaran);
router.get("/top-sparepart", dashboardController.getTopSparepart);
router.get("/top-layanan", dashboardController.getTopLayanan);
router.get("/grafik", dashboardController.getGrafik);

module.exports = router;
