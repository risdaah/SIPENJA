/**
 * routes/servisRoute.js — Route pengelolaan data servis kendaraan
 *
 * Base URL: /api/servis
 * Servis mencatat detail pekerjaan bengkel per kendaraan, termasuk:
 *   - Layanan yang dikerjakan (DetailTransaksiServis)
 *   - Sparepart yang digunakan (ServisSparepart)
 *   - Riwayat progress status (ProgressServis)
 *
 * Endpoint GET:
 *   GET /api/servis/get-all                — Semua data servis
 *   GET /api/servis/get/:id                — Detail satu servis + layanan + sparepart + progress
 *   GET /api/servis/get-by-status/:status  — Filter: Belum | Dalam Proses | Selesai
 *   GET /api/servis/get-by-mekanik/:id     — Servis milik mekanik tertentu (+ data layanan)
 *   GET /api/servis/track/:kodeAntrian     — Publik: pelanggan track status via kode antrian
 *   GET /api/servis/filter                 — Filter by tanggal (?startDate=&endDate=)
 *
 * Endpoint POST:
 *   POST /api/servis/add-layanan/:id       — Tambah layanan ke servis yang sudah ada
 *   POST /api/servis/add-sparepart/:id     — Tambah sparepart ke servis (stok berkurang)
 *
 * Endpoint PUT:
 *   PUT /api/servis/update/:id             — Edit info servis (nama pelanggan, keluhan, catatan)
 *   PUT /api/servis/update-progress/:id    — Mekanik update status + tambah layanan/sparepart sekaligus
 *   PUT /api/servis/update-layanan/:id     — Edit biaya/keterangan satu layanan
 *   PUT /api/servis/update-sparepart/:id   — Edit qty satu sparepart (stok auto adjust)
 *
 * Endpoint DELETE:
 *   DELETE /api/servis/delete-layanan/:id  — Hapus satu layanan dari servis
 *   DELETE /api/servis/delete-sparepart/:id— Hapus satu sparepart dari servis (stok kembali)
 *   DELETE /api/servis/delete/:id          — Hapus seluruh servis + transaksi + kembalikan stok
 */

const express = require("express");
const router = express.Router();
const {
  getAllServis,
  getServisById,
  getServisByStatus,
  getServisByMekanik,
  trackServis,
  getServisByDateRange,
  addSparepart,
  addLayanan,
  updateServis,
  updateLayanan,
  updateSparepart,
  updateProgress,
  deleteLayanan,
  deleteSparepart,
  deleteServis,
} = require("../controllers/servisController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// ── PUBLIC — tanpa login ──────────────────────────────────
router.get("/track/:kodeAntrian", trackServis);

// ── Semua route di bawah wajib login ─────────────────────
router.use(authMiddleware);

// ── GET ──────────────────────────────────────────────────
router.get("/get-all", roleMiddleware("admin", "kasir"), getAllServis);
router.get(
  "/get/:id",
  roleMiddleware("admin", "kasir", "mekanik"),
  getServisById,
);
router.get(
  "/get-by-status/:status",
  roleMiddleware("admin", "kasir"),
  getServisByStatus,
);
router.get(
  "/get-by-mekanik/:idMekanik",
  roleMiddleware("admin", "kasir", "mekanik"),
  getServisByMekanik,
);
router.get("/filter", roleMiddleware("admin", "kasir"), getServisByDateRange);

// ── POST ─────────────────────────────────────────────────
router.post(
  "/add-layanan/:id",
  roleMiddleware("admin", "kasir", "mekanik"),
  addLayanan,
);
router.post(
  "/add-sparepart/:id",
  roleMiddleware("admin", "kasir", "mekanik"),
  addSparepart,
);

// ── PUT ──────────────────────────────────────────────────
router.put("/update/:id", roleMiddleware("admin", "kasir"), updateServis);
router.put(
  "/update-progress/:id",
  roleMiddleware("admin", "kasir", "mekanik"),
  updateProgress,
);
router.put(
  "/update-layanan/:id",
  roleMiddleware("admin", "kasir", "mekanik"),
  updateLayanan,
);
router.put(
  "/update-sparepart/:id",
  roleMiddleware("admin", "kasir", "mekanik"),
  updateSparepart,
);

// ── DELETE ───────────────────────────────────────────────
router.delete(
  "/delete-layanan/:id",
  roleMiddleware("admin", "kasir"),
  deleteLayanan,
);
router.delete(
  "/delete-sparepart/:id",
  roleMiddleware("admin", "kasir"),
  deleteSparepart,
);
router.delete("/delete/:id", roleMiddleware("admin"), deleteServis);

module.exports = router;
