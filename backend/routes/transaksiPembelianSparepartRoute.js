const express = require('express');
const router = express.Router();
const {
  getAllTransaksiPembelianSparepart, getTransaksiPembelianSparepartById,
  getTransaksiPembelianByDateRange,
  createTransaksiPembelianSparepart,
  updateTransaksiPembelianSparepart, updateItemPembelian,
  deleteItemPembelian, deleteTransaksiPembelianSparepart,
} = require('../controllers/transaksiPembelianSparepartController');

router.get('/get-all', getAllTransaksiPembelianSparepart);
router.get('/get/:id', getTransaksiPembelianSparepartById);

// Filter by tanggal: GET /pembelian-sparepart/filter?startDate=2026-01-01&endDate=2026-01-31
router.get('/filter', getTransaksiPembelianByDateRange);

router.post('/create', createTransaksiPembelianSparepart);
router.put('/update/:id', updateTransaksiPembelianSparepart);
router.put('/update-item/:id', updateItemPembelian);
router.delete('/delete-item/:id', deleteItemPembelian);
router.delete('/delete/:id', deleteTransaksiPembelianSparepart);

module.exports = router;