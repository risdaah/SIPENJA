/**
 * controllers/userController.js — Controller manajemen user/karyawan
 *
 * Mengelola akun karyawan bengkel: kasir, mekanik, dan admin.
 * Semua endpoint hanya dapat diakses oleh admin (dijaga oleh roleMiddleware di route).
 *
 * Fungsi yang tersedia:
 *   getAllUser     — Ambil semua user
 *   getUserById    — Ambil satu user berdasarkan ID
 *   createUser     — Buat user baru (kasir/mekanik)
 *   createAdmin    — Buat user baru dengan role admin
 *   updateUser     — Edit data user (nama, username, dll.) — tidak termasuk password
 *   updatePassword — Ganti password user dengan validasi kekuatan
 *   updateStatus   — Aktifkan atau nonaktifkan akun user
 *   deleteUser     — Hapus user permanen dari DB
 */

const User = require("../models/userModel");

// ── Helper: Validasi kekuatan password ──────────────────────────────────────
// Dipanggil sebelum create atau update password untuk memastikan password aman.
// Mengembalikan string pesan error jika tidak valid, atau null jika valid.
function validatePassword(password, username) {
  if (!password || password.length < 8) {
    return "Password minimal 8 karakter";
  }
  if (!/[A-Za-z]/.test(password)) {
    return "Password harus mengandung huruf";
  }
  if (!/[0-9]/.test(password)) {
    return "Password harus mengandung angka";
  }
  // Cegah password yang sama persis dengan username (case-insensitive)
  if (username && password.toLowerCase() === username.toLowerCase()) {
    return "Password tidak boleh sama dengan username";
  }
  return null; // valid
}

// ── GET ALL ─────────────────────────────────────────────────────────────────
// Mengembalikan semua user tanpa kolom PASSWORD (disembunyikan di model)
const getAllUser = async (req, res) => {
  try {
    const data = await User.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET BY ID ────────────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const data = await User.getById(req.params.id);
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE USER (kasir / mekanik) ───────────────────────────────────────────
// Password di-hash oleh model sebelum disimpan ke DB
const createUser = async (req, res) => {
  try {
    const { NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, PASSWORD } =
      req.body;

    // Field wajib
    if (!NAMA || !USERNAME || !ROLE || !PASSWORD) {
      return res.status(400).json({
        success: false,
        message: "NAMA, USERNAME, ROLE, PASSWORD wajib diisi",
      });
    }

    // Validasi kekuatan password
    const passError = validatePassword(PASSWORD, USERNAME);
    if (passError) {
      return res.status(400).json({ success: false, message: passError });
    }

    // Cek duplikasi username
    const existingUser = await User.getByUsername(USERNAME);
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "USERNAME sudah digunakan" });
    }

    const data = await User.create(req.body);
    res
      .status(201)
      .json({ success: true, message: "User berhasil dibuat", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE USER (data profil, tanpa password) ────────────────────────────────
// Field PASSWORD di-strip agar tidak bisa diubah lewat endpoint ini
const updateUser = async (req, res) => {
  try {
    const existing = await User.getById(req.params.id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });

    // Pisahkan PASSWORD dari data update — password punya endpoint sendiri
    const { PASSWORD, ...updateData } = req.body;
    const data = await User.update(req.params.id, updateData);
    res.json({ success: true, message: "User berhasil diupdate", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE PASSWORD ──────────────────────────────────────────────────────────
// Hashing dilakukan di model; endpoint ini hanya validasi dan meneruskan
const updatePassword = async (req, res) => {
  try {
    const { PASSWORD } = req.body;
    if (!PASSWORD) {
      return res
        .status(400)
        .json({ success: false, message: "PASSWORD wajib diisi" });
    }

    const existing = await User.getById(req.params.id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });

    // Validasi kekuatan password baru
    const passError = validatePassword(PASSWORD, existing.USERNAME);
    if (passError) {
      return res.status(400).json({ success: false, message: passError });
    }

    await User.updatePassword(req.params.id, PASSWORD);
    res.json({ success: true, message: "Password berhasil diupdate" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE STATUS (aktifkan / nonaktifkan akun) ──────────────────────────────
// User yang dinonaktifkan tidak bisa login
const updateStatus = async (req, res) => {
  try {
    const { STATUS } = req.body;
    if (!STATUS) {
      return res
        .status(400)
        .json({ success: false, message: "STATUS wajib diisi" });
    }
    if (!["AKTIF", "NONAKTIF"].includes(STATUS)) {
      return res
        .status(400)
        .json({ success: false, message: "STATUS harus AKTIF atau NONAKTIF" });
    }

    const existing = await User.getById(req.params.id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });

    await User.updateStatus(req.params.id, STATUS);
    res.json({
      success: true,
      message: `User berhasil di${STATUS === "AKTIF" ? "aktifkan" : "nonaktifkan"}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE USER ──────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const existing = await User.getById(req.params.id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    await User.delete(req.params.id);
    res.json({ success: true, message: "User berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE ADMIN ─────────────────────────────────────────────────────────────
// Sama seperti createUser tapi ROLE di-hardcode sebagai 'admin' di model
const createAdmin = async (req, res) => {
  try {
    const { NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, PASSWORD } = req.body;
    if (!NAMA || !USERNAME || !PASSWORD) {
      return res.status(400).json({
        success: false,
        message: "NAMA, USERNAME, PASSWORD wajib diisi",
      });
    }

    const passError = validatePassword(PASSWORD, USERNAME);
    if (passError) {
      return res.status(400).json({ success: false, message: passError });
    }

    const existingUser = await User.getByUsername(USERNAME);
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "USERNAME sudah digunakan" });
    }

    const data = await User.createAdmin(req.body);
    res
      .status(201)
      .json({ success: true, message: "Akun admin berhasil dibuat", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllUser,
  getUserById,
  createUser,
  createAdmin,
  updateUser,
  updatePassword,
  updateStatus,
  deleteUser,
};
