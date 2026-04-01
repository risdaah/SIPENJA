/**
 * routes/supplierRoute.js — Route data supplier
 *
 * Base URL: /api/supplier
 * Supplier adalah pemasok/vendor yang menyediakan sparepart ke bengkel.
 *
 * Endpoint:
 *   GET    /api/supplier/get-all     — Ambil semua supplier
 *   GET    /api/supplier/get/:id     — Ambil satu supplier berdasarkan ID
 *   POST   /api/supplier/create      — Tambah supplier baru
 *   PUT    /api/supplier/update/:id  — Edit data supplier
 *   DELETE /api/supplier/delete/:id  — Hapus supplier
 */

const express = require("express");
const router = express.Router();
const {
  getAllSupplier,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Semua route wajib login
router.use(authMiddleware);

// Read — semua role
router.get("/get-all", getAllSupplier);
router.get("/get/:id", getSupplierById);

// Edit — admin & kasir
router.put("/update/:id", updateSupplier);

// Create & Delete — admin saja
router.post("/create", roleMiddleware("admin"), createSupplier);
router.delete("/delete/:id", roleMiddleware("admin"), deleteSupplier);

module.exports = router;
