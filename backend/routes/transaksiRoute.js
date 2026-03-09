const express = require('express');
const router = express.Router();
const {
  getAllTransaksi, getTransaksiById, getTransaksiByJenis,
  getTransaksiByKasir,
  getTransaksiByDateRange, getTransaksiByBulan,
  createTransaksi,
} = require('../controllers/transaksiController');

router.get('/get-all', getAllTransaksi);
router.get('/get/:id', getTransaksiById);
router.get('/get-by-jenis/:jenis', getTransaksiByJenis);

// Filter by kasir: GET /transaksi/get-by-kasir/:idKasir?jenis=SERVIS (jenis opsional)
router.get('/get-by-kasir/:idKasir', getTransaksiByKasir);

// Filter by tanggal: GET /transaksi/filter?startDate=2026-01-01&endDate=2026-01-31&jenis=SERVIS
router.get('/filter', getTransaksiByDateRange);

// Filter by bulan: GET /transaksi/filter-bulan?bulan=1&tahun=2026&jenis=PEMBELIAN
router.get('/filter-bulan', getTransaksiByBulan);

router.post('/create', createTransaksi);

module.exports = router;