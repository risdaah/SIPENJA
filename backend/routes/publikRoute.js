/**
 * routes/publikRoute.js — Route publik (tanpa autentikasi)
 *
 * Base URL: /api/publik
 * Route-route di sini sengaja TIDAK menggunakan authMiddleware,
 * sehingga bisa diakses oleh siapapun — termasuk pelanggan yang
 * tidak memiliki akun di sistem.
 *
 * Endpoint:
 *   GET /api/publik/cek-status/:kodeAntrian
 *     — Pelanggan bisa cek status servis kendaraannya secara mandiri
 *       menggunakan kode antrian yang diberikan kasir saat pendaftaran
 */

const express = require("express");
const router = express.Router();
const { cekStatusServis } = require("../controllers/publikController");

// GET /api/publik/cek-status/:kodeAntrian — tanpa login
router.get("/cek-status/:kodeAntrian", cekStatusServis);

module.exports = router;
