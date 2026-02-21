const express = require('express');
const router = express.Router();
const {
  getAllSparepart,
  getSparepartById,
  getLowStock,
  createSparepart,
  updateSparepart,
  deleteSparepart,
  getStok,
  updateStok,
} = require('../controllers/sparepartController');

router.get('/get-all', getAllSparepart);
router.get('/get/:id', getSparepartById);
router.get('/low-stock', getLowStock);
router.post('/create', createSparepart);
router.put('/update/:id', updateSparepart);
router.delete('/delete/:id', deleteSparepart);
router.get('/get-stok', getStok);
router.put('/update-stok/:id', updateStok);

module.exports = router;