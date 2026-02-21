const express = require('express');
const router = express.Router();
const {
  getAllTransaksiPembelianSparepart, getTransaksiPembelianSparepartById,
  createTransaksiPembelianSparepart,
  updateTransaksiPembelianSparepart, updateItemPembelian,
  deleteItemPembelian, deleteTransaksiPembelianSparepart
} = require('../controllers/transaksiPembelianSparepartController');

router.get('/get-all', getAllTransaksiPembelianSparepart);
router.get('/get/:id', getTransaksiPembelianSparepartById);
router.post('/create', createTransaksiPembelianSparepart);
router.put('/update/:id', updateTransaksiPembelianSparepart);
router.put('/update-item/:id', updateItemPembelian);
router.delete('/delete-item/:id', deleteItemPembelian);
router.delete('/delete/:id', deleteTransaksiPembelianSparepart);

module.exports = router;