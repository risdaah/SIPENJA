const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "sipenja_secret_key_ganti_di_env";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// ══════════════════════════════════════════════════════════
//  POST /api/auth/login
//  Body   : { USERNAME, PASSWORD }
//  Response: { success, token, user: { IDUSER, NAMA, USERNAME, ROLE, STATUS } }
// ══════════════════════════════════════════════════════════
const login = async (req, res) => {
  try {
    const { USERNAME, PASSWORD } = req.body;

    if (!USERNAME || !PASSWORD) {
      return res.status(400).json({
        success: false,
        message: "USERNAME dan PASSWORD wajib diisi",
      });
    }

    // Cari user berdasarkan USERNAME (method getByUsername ambil semua kolom termasuk PASSWORD hash)
    const user = await User.getByUsername(USERNAME);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Username atau kata sandi salah",
      });
    }

    // Cek status akun
    if (user.STATUS !== "AKTIF") {
      return res.status(403).json({
        success: false,
        message: "Akun Anda telah dinonaktifkan. Hubungi administrator.",
      });
    }

    // Verifikasi password dengan bcrypt
    const isMatch = await bcrypt.compare(PASSWORD, user.PASSWORD);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Username atau kata sandi salah",
      });
    }

    // Update LASTLOGIN di tabel USER
    await db.query("UPDATE USER SET LASTLOGIN = ? WHERE IDUSER = ?", [
      new Date(),
      user.IDUSER,
    ]);

    // Buat payload JWT — berisi data user yang akan ada di setiap request
    const payload = {
      IDUSER: user.IDUSER,
      NAMA: user.NAMA,
      USERNAME: user.USERNAME,
      ROLE: user.ROLE, // 'admin' | 'kasir' | 'mekanik'
      STATUS: user.STATUS,
    };

    // Generate token
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
//  Digunakan untuk refresh data user yang sedang login
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
//  Logout dilakukan di sisi client dengan menghapus token dari localStorage.
//  Endpoint ini hanya sebagai konfirmasi ke server.
// ══════════════════════════════════════════════════════════
const logout = async (req, res) => {
  return res.json({ success: true, message: "Logout berhasil" });
};

module.exports = { login, me, logout };
