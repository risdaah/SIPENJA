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

// GET semua transaksi
router.get("/get-all", getAllTransaksi);

// GET detail transaksi by ID (dengan sub-data SERVIS / PEMBELIAN)
router.get("/get/:id", getTransaksiById);

// GET struk lengkap untuk cetak PDF / kirim WA
router.get("/struk/:id", getStrukTransaksi);

// GET filter by jenis: SERVIS | PEMBELIAN
router.get("/get-by-jenis/:jenis", getTransaksiByJenis);

// GET filter by kasir: GET /transaksi/get-by-kasir/:idKasir?jenis=SERVIS (jenis opsional)
router.get("/get-by-kasir/:idKasir", getTransaksiByKasir);

// GET filter by tanggal: GET /transaksi/filter?startDate=2026-01-01&endDate=2026-01-31&jenis=SERVIS
router.get("/filter", getTransaksiByDateRange);

// GET filter by bulan: GET /transaksi/filter-bulan?bulan=1&tahun=2026&jenis=PEMBELIAN
router.get("/filter-bulan", getTransaksiByBulan);

// POST buat transaksi baru
router.post("/create", createTransaksi);

// PATCH update nomor HP pelanggan (opsional, bisa diubah dari halaman struk)
router.patch("/nohp/:id", updateNohpTransaksi);

module.exports = router;
