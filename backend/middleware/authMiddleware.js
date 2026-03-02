const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "sipenja_secret_key_ganti_di_env";

// ══════════════════════════════════════════════════════════
//  authMiddleware
//  Verifikasi JWT token dari header Authorization.
//  Jika valid → set req.user = payload dan lanjut ke next()
//  Jika tidak valid / expired → 401
//
//  Cara pakai di route:
//    router.get('/route', authMiddleware, controller)
// ══════════════════════════════════════════════════════════
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Akses ditolak. Token tidak ditemukan.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verifikasi dan decode token
    const decoded = jwt.verify(token, JWT_SECRET);
    // decoded = { IDUSER, NAMA, USERNAME, ROLE, STATUS, iat, exp }
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
        expired: true, // dipakai frontend untuk redirect otomatis
      });
    }
    return res.status(401).json({
      success: false,
      message: "Token tidak valid.",
    });
  }
};

// ══════════════════════════════════════════════════════════
//  roleMiddleware
//  Batasi akses berdasarkan USER.ROLE.
//  Harus dipakai SETELAH authMiddleware.
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
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Tidak terautentikasi." });
    }
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
