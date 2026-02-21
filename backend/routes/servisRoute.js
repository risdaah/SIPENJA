const express = require('express');
const router = express.Router();
const {
  getAllServis, getServisById, getServisByStatus, getServisByMekanik,
  addSparepart, addLayanan,
  updateServis, updateLayanan, updateSparepart, updateProgress,
  deleteLayanan, deleteSparepart, deleteServis
} = require('../controllers/servisController');

router.get('/get-all', getAllServis);
router.get('/get/:id', getServisById);
router.get('/get-by-status/:status', getServisByStatus);
router.get('/get-by-mekanik/:idMekanik', getServisByMekanik);
router.post('/add-sparepart/:id', addSparepart);
router.post('/add-layanan/:id', addLayanan);
router.put('/update/:id', updateServis);
router.put('/update-progress/:id', updateProgress);
router.put('/update-layanan/:id', updateLayanan);
router.put('/update-sparepart/:id', updateSparepart);
router.delete('/delete-layanan/:id', deleteLayanan);
router.delete('/delete-sparepart/:id', deleteSparepart);
router.delete('/delete/:id', deleteServis);

module.exports = router;