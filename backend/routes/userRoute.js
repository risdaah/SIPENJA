/**
 * routes/userRoute.js — Route manajemen user/karyawan
 *
 * Base URL: /api/user
 * Semua endpoint hanya bisa diakses oleh admin (authMiddleware + roleMiddleware('admin')).
 *
 * Endpoint:
 *   GET    /api/user/get-all            — Ambil semua user (kasir, mekanik, admin)
 *   GET    /api/user/get/:id            — Ambil user berdasarkan ID
 *   POST   /api/user/create             — Buat user baru (kasir/mekanik)
 *   PUT    /api/user/update/:id         — Edit data user (tanpa ubah password)
 *   PUT    /api/user/update-password/:id — Ganti password user
 *   PUT    /api/user/update-status/:id  — Aktifkan / nonaktifkan user
 *   DELETE /api/user/delete/:id         — Hapus user permanen
 *   POST   /api/user/create-admin       — Buat akun admin baru
 */

const express = require("express");
const router = express.Router();
const {
  getAllUser,
  getUserById,
  createUser,
  updateUser,
  updatePassword,
  updateStatus,
  deleteUser,
  createAdmin,
} = require("../controllers/userController");
const {
  authMiddleware,
  roleMiddleware,
} = require("../middleware/authMiddleware");

// Semua endpoint di sini hanya bisa diakses oleh admin
router.get(
  "/get-all",
  authMiddleware,
  roleMiddleware("admin", "kasir", "mekanik"),
  getAllUser,
);
router.get(
  "/get/:id",
  authMiddleware,
  roleMiddleware("admin", "kasir", "mekanik"),
  getUserById,
);
router.post("/create", authMiddleware, roleMiddleware("admin"), createUser);
router.put(
  "/update/:id",
  authMiddleware,
  roleMiddleware("admin", "kasir", "mekanik"),
  updateUser,
);
router.put(
  "/update-password/:id",
  authMiddleware,
  roleMiddleware("admin", "kasir", "mekanik"),
  updatePassword,
);
router.put(
  "/update-status/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateStatus,
);
router.delete(
  "/delete/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteUser,
);
router.post(
  "/create-admin",
  authMiddleware,
  roleMiddleware("admin"),
  createAdmin,
);

module.exports = router;
