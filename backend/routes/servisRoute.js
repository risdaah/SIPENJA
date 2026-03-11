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

// ── GET ──────────────────────────────────────────────────
router.get("/get-all", getAllServis);
router.get("/get/:id", getServisById);
router.get("/get-by-status/:status", getServisByStatus);
router.get("/get-by-mekanik/:idMekanik", getServisByMekanik);
router.get("/track/:kodeAntrian", trackServis); // publik — cek status via kode antrian
router.get("/filter", getServisByDateRange); // ?startDate=&endDate=

// ── POST ─────────────────────────────────────────────────
router.post("/add-layanan/:id", addLayanan); // body: { ITEMS: [{IDLAYANANSERVIS}] }
router.post("/add-sparepart/:id", addSparepart); // body: { ITEMS: [{IDSPAREPART, QTY}] }

// ── PUT ──────────────────────────────────────────────────
router.put("/update/:id", updateServis); // edit NAMAPELANGGAN, KELUHAN, CATATAN (kasir/admin)
router.put("/update-progress/:id", updateProgress); // mekanik update STATUS + tambah layanan/sparepart
router.put("/update-layanan/:id", updateLayanan); // edit BIAYA / KETERANGAN satu layanan (by IDDETAILTRANSAKSISERVIS)
router.put("/update-sparepart/:id", updateSparepart); // edit QTY satu sparepart (by IDSERVISSPAREPART)

// ── DELETE ───────────────────────────────────────────────
router.delete("/delete-layanan/:id", deleteLayanan); // hapus satu layanan (by IDDETAILTRANSAKSISERVIS)
router.delete("/delete-sparepart/:id", deleteSparepart); // hapus satu sparepart (by IDSERVISSPAREPART)
router.delete("/delete/:id", deleteServis); // hapus seluruh servis + transaksi + kembalikan stok

module.exports = router;
