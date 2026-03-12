const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/DashboardController");

router.get("/stats", dashboardController.getStats);
router.get("/pendapatan", dashboardController.getPendapatan);
router.get("/pengeluaran", dashboardController.getPengeluaran);
router.get("/top-sparepart", dashboardController.getTopSparepart);
router.get("/top-layanan", dashboardController.getTopLayanan);
router.get("/grafik", dashboardController.getGrafik);

module.exports = router;
