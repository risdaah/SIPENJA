const express = require('express');
const router = express.Router();
const {
  getAllSupplier,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');

router.get('/get-all', getAllSupplier);
router.get('/get/:id', getSupplierById);
router.post('/create', createSupplier);
router.put('/update/:id', updateSupplier);
router.delete('/delete/:id', deleteSupplier);

module.exports = router;