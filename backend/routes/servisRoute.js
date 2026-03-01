const express = require('express');
const router = express.Router();
const {
  getAllServis, getServisById, getServisByStatus, getServisByMekanik,
  trackServis, getServisByDateRange,
  addSparepart, addLayanan,
  updateServis, updateLayanan, updateSparepart, updateProgress,
  deleteLayanan, deleteSparepart, deleteServis,
} = require('../controllers/servisController');

// ==========================================
// PUBLIC (tidak perlu login) - untuk pelanggan
// ==========================================
// Pelanggan tracking status servis via kode antrian
// GET /servis/track/SRV-20260228-001
router.get('/track/:kodeAntrian', trackServis);

// ==========================================
// PRIVATE (perlu login/auth middleware)
// ==========================================
router.get('/get-all', getAllServis);
router.get('/get/:id', getServisById);
router.get('/get-by-status/:status', getServisByStatus);
router.get('/get-by-mekanik/:idMekanik', getServisByMekanik);

// Filter by tanggal: GET /servis/filter?startDate=2026-01-01&endDate=2026-01-31
router.get('/filter', getServisByDateRange);

// Mekanik
router.post('/add-sparepart/:id', addSparepart);
router.post('/add-layanan/:id', addLayanan);
router.put('/update-progress/:id', updateProgress);
router.put('/update-layanan/:id', updateLayanan);
router.put('/update-sparepart/:id', updateSparepart);
router.delete('/delete-layanan/:id', deleteLayanan);
router.delete('/delete-sparepart/:id', deleteSparepart);

// Kasir
router.put('/update/:id', updateServis);
router.delete('/delete/:id', deleteServis);

module.exports = router;