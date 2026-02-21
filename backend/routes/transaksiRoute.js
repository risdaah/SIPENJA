const express = require('express');
const router = express.Router();
const { getAllTransaksi, getTransaksiById, getTransaksiByJenis, createTransaksi } = require('../controllers/transaksiController');

router.get('/get-all', getAllTransaksi);
router.get('/get/:id', getTransaksiById);
router.get('/get-by-jenis/:jenis', getTransaksiByJenis);
router.post('/create', createTransaksi);

module.exports = router;