const express = require('express');
const router = express.Router();
const {
  getAllKategori,
  getKategoriById,
  createKategori,
  updateKategori,
  deleteKategori,
} = require('../controllers/kategoriSparepartController');

router.get('/get-all', getAllKategori);
router.get('/get/:id', getKategoriById);
router.post('/create', createKategori);
router.put('/update/:id', updateKategori);
router.delete('/delete/:id', deleteKategori);

module.exports = router;