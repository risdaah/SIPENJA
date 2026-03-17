const express = require("express");
const router = express.Router();
const { cekStatusServis } = require("../controllers/publikController");

// Semua route di sini TANPA authMiddleware — akses publik

// GET /api/publik/cek-status/:kodeAntrian
router.get("/cek-status/:kodeAntrian", cekStatusServis);

module.exports = router;
