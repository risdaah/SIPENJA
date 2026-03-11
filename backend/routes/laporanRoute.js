const express = require("express");
const router = express.Router();
const laporanController = require("../controllers/laporanController");

router.get("/laporan-sparepart", laporanController.laporanSparepart);
router.get("/laporan-servis", laporanController.laporanServis);
router.get("/logo", laporanController.getLogo);

module.exports = router;
