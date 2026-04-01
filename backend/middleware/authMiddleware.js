/**
 * middleware/authMiddleware.js — Middleware autentikasi & otorisasi JWT
 *
 * Berisi dua middleware:
 *   1. authMiddleware  — Verifikasi JWT token dari header Authorization
 *   2. roleMiddleware  — Batasi akses berdasarkan ROLE user (admin/kasir/mekanik)
 *
 * Cara kerja JWT di SIPENJA:
 *   - Saat login berhasil, server menerbitkan token JWT yang berisi
 *     payload: { IDUSER, NAMA, USERNAME, ROLE, STATUS }
 *   - Token dikirim client di setiap request dalam header:
 *       Authorization: Bearer <token>
 *   - authMiddleware mendekode token dan menyimpan payload ke req.user
 *     sehingga controller bisa membaca req.user.ROLE, req.user.IDUSER, dst.
 *   - Token berlaku selama JWT_EXPIRES (default 8 jam), lalu expired
 */

const jwt = require("jsonwebtoken");

// Kunci rahasia untuk sign/verify JWT — wajib diganti di .env produksi!
const JWT_SECRET = process.env.JWT_SECRET || "sipenja_secret_key_ganti_di_env";

// ══════════════════════════════════════════════════════════
//  authMiddleware
//  Verifikasi JWT token dari header Authorization.
//  Jika valid  → set req.user = payload dan lanjut ke next()
//  Jika tidak valid / expired → 401
//
//  Cara pakai di route:
//    router.get('/route', authMiddleware, controller)
// ══════════════════════════════════════════════════════════
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Cek keberadaan header dan format "Bearer <token>"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Akses ditolak. Token tidak ditemukan.",
    });
  }

  // Ambil token dari string "Bearer <token>"
  const token = authHeader.split(" ")[1];

  try {
    // Verifikasi signature dan masa berlaku token
    const decoded = jwt.verify(token, JWT_SECRET);
    // decoded berisi: { IDUSER, NAMA, USERNAME, ROLE, STATUS, iat, exp }

    // Simpan data user ke req agar bisa diakses controller berikutnya
    req.user = decoded;
    next();
  } catch (err) {
    // Token expired — frontend perlu redirect ke halaman login
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
        expired: true, // dipakai frontend untuk redirect otomatis
      });
    }
    // Token rusak / signature tidak cocok
    return res.status(401).json({
      success: false,
      message: "Token tidak valid.",
    });
  }
};

// ══════════════════════════════════════════════════════════
//  roleMiddleware
//  Batasi akses berdasarkan USER.ROLE.
//  Harus dipakai SETELAH authMiddleware karena butuh req.user.
//
//  Cara pakai di route:
//    // Hanya admin
//    router.delete('/delete/:id', authMiddleware, roleMiddleware('admin'), deleteUser);
//
//    // Admin atau kasir
//    router.post('/create', authMiddleware, roleMiddleware('admin', 'kasir'), createTransaksi);
//
//    // Semua role (cukup pakai authMiddleware saja, tidak perlu roleMiddleware)
//    router.get('/get-all', authMiddleware, getAllData);
// ══════════════════════════════════════════════════════════
const roleMiddleware = (...roles) => {
  // Mengembalikan fungsi middleware yang memeriksa ROLE user
  return (req, res, next) => {
    // req.user harus sudah diisi oleh authMiddleware
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Tidak terautentikasi." });
    }

    // Cek apakah ROLE user termasuk dalam daftar role yang diizinkan
    if (!roles.includes(req.user.ROLE)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Hanya role ${roles.join(" / ")} yang diizinkan.`,
      });
    }

    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
