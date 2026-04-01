/**
 * routes/laporanRoute.js — Route laporan bengkel
 *
 * Base URL: /api/laporan
 * Menyediakan data laporan dalam rentang tanggal tertentu untuk dicetak.
 *
 * Endpoint:
 *   GET /api/laporan/laporan-sparepart  — Data penjualan sparepart (?tgl_awal=&tgl_akhir=)
 *   GET /api/laporan/laporan-servis     — Data layanan servis yang dikerjakan (?tgl_awal=&tgl_akhir=)
 *   GET /api/laporan/logo               — Ambil logo bengkel dalam format base64 (untuk print preview)
 */

const express = require("express");
const router = express.Router();
const laporanController = require("../controllers/laporanController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Semua route dashboard hanya untuk admin
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/laporan-sparepart", laporanController.laporanSparepart);
router.get("/laporan-servis", laporanController.laporanServis);
router.get("/logo", laporanController.getLogo); // Logo untuk print/PDF

module.exports = router;
