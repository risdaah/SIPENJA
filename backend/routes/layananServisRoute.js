const express = require('express');
const router = express.Router();
const {
  getAllLayanan,
  getLayananById,
  createLayanan,
  updateLayanan,
  deleteLayanan,
} = require('../controllers/layananServisController');

router.get('/get-all', getAllLayanan);
router.get('/get/:id', getLayananById);
router.post('/create', createLayanan);
router.put('/update/:id', updateLayanan);
router.delete('/delete/:id', deleteLayanan);

module.exports = router;