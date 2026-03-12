const express = require("express");
const router = express.Router();
const c = require("../controllers/pengeluaranController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

router.get("/get-all", authMiddleware, c.getAll);
router.post(
  "/tambah-stok",
  authMiddleware,
  roleMiddleware("kasir", "admin"),
  c.tambahStok,
);

module.exports = router;
