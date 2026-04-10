/**
 * controllers/authController.js — Controller autentikasi
 *
 * Menangani proses login, pengecekan user aktif (me), dan logout.
 * JWT (JSON Web Token) digunakan sebagai mekanisme autentikasi stateless:
 *   - Server tidak menyimpan session — token berisi semua info yang diperlukan
 *   - Token berlaku selama JWT_EXPIRES (default 8 jam)
 *   - Logout dilakukan dengan menghapus token di sisi client (localStorage)
 */

const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Ambil dari .env
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// ══════════════════════════════════════════════════════════
//  POST /api/auth/login
//  Body    : { USERNAME, PASSWORD }
//  Response: { success, token, user: { IDUSER, NAMA, USERNAME, ROLE, STATUS } }
//
//  Alur:
//    1. Cari user berdasarkan USERNAME
//    2. Cek status akun (harus AKTIF)
//    3. Bandingkan PASSWORD dengan hash bcrypt di DB
//    4. Update LASTLOGIN
//    5. Buat JWT token dan kembalikan ke client
// ══════════════════════════════════════════════════════════
const login = async (req, res) => {
  try {
    const { USERNAME, PASSWORD } = req.body;

    // Validasi input wajib
    if (!USERNAME || !PASSWORD) {
      return res.status(400).json({
        success: false,
        message: "USERNAME dan PASSWORD wajib diisi",
      });
    }

    // Cari user di DB (getByUsername mengambil semua kolom termasuk hash PASSWORD)
    const user = await User.getByUsername(USERNAME);

    // Cek info apakah username ada atau tidak
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Username atau kata sandi salah",
      });
    }

    // Tolak login jika akun sedang dinonaktifkan admin
    if (user.STATUS !== "AKTIF") {
      return res.status(403).json({
        success: false,
        message: "Akun Anda telah dinonaktifkan. Hubungi administrator.",
      });
    }

    // Bandingkan password teks (dari request) dengan hash tersimpan di DB
    const isMatch = await bcrypt.compare(PASSWORD, user.PASSWORD);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Username atau kata sandi salah",
      });
    }

    // Catat waktu login terakhir di DB
    await db.query("UPDATE USER SET LASTLOGIN = ? WHERE IDUSER = ?", [
      new Date(),
      user.IDUSER,
    ]);

    // Payload JWT — data ini akan tersedia di req.user setelah token diverifikasi
    const payload = {
      IDUSER: user.IDUSER,
      NAMA: user.NAMA,
      USERNAME: user.USERNAME,
      ROLE: user.ROLE, // 'admin' | 'kasir' | 'mekanik'
      STATUS: user.STATUS,
    };

    // Buat token JWT yang berlaku selama JWT_EXPIRES
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    return res.json({
      success: true,
      message: "Login berhasil",
      token,
      user: payload,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
//  GET /api/auth/me
//  Header  : Authorization: Bearer <token>
//  Response: { success, user }
//
//  Digunakan frontend untuk:
//    - Load ulang data user setelah refresh halaman
//    - Validasi token masih berlaku saat app dibuka kembali
// ══════════════════════════════════════════════════════════
const me = async (req, res) => {
  try {
    // req.user diisi oleh authMiddleware setelah token diverifikasi
    const user = await User.getById(req.user.IDUSER);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });
    }
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
//  POST /api/auth/logout
//  Header  : Authorization: Bearer <token>
//
//  Karena JWT stateless, logout sesungguhnya terjadi di sisi client
//  dengan menghapus token dari localStorage/sessionStorage.
//  Endpoint ini hanya sebagai konfirmasi ke server (dan bisa dipakai
//  untuk audit/logging di masa mendatang).
// ══════════════════════════════════════════════════════════
const logout = async (req, res) => {
  return res.json({ success: true, message: "Logout berhasil" });
};

module.exports = { login, me, logout };
