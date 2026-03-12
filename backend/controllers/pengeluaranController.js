const db = require("../config/db");

// GET /api/pengeluaran/get-all
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, sp.NAMA AS NAMA_SPAREPART, sp.KODESPAREPART,
             u.NAMA AS NAMA_KASIR
      FROM PENGELUARAN p
      JOIN SPAREPART sp ON sp.IDSPAREPART = p.IDSPAREPART
      JOIN USER u ON u.IDUSER = p.IDUSER
      ORDER BY p.TANGGAL DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ getAll pengeluaran error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "DB error" });
  }
};

// POST /api/pengeluaran/tambah-stok
// Body: { IDSPAREPART, QTY, HARGA_BELI, KETERANGAN }
exports.tambahStok = async (req, res) => {
  console.log("📥 tambahStok body:", req.body);
  console.log("👤 req.user:", req.user);

  const { IDSPAREPART, QTY, HARGA_BELI, KETERANGAN } = req.body;

  // Ambil IDUSER dari berbagai kemungkinan nama field middleware auth
  const IDUSER =
    req.user?.IDUSER ||
    req.user?.id ||
    req.user?.ID ||
    req.user?.userId ||
    null;

  console.log("🔑 IDUSER resolved:", IDUSER);

  if (!IDUSER) {
    return res.status(401).json({
      success: false,
      message: "User tidak terautentikasi. Pastikan token valid.",
    });
  }

  if (!IDSPAREPART || !QTY || !HARGA_BELI) {
    return res.status(400).json({
      success: false,
      message: "IDSPAREPART, QTY, dan HARGA_BELI wajib diisi.",
    });
  }
  if (Number(QTY) <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "QTY harus lebih dari 0." });
  }
  if (Number(HARGA_BELI) <= 0) {
    return res
      .status(400)
      .json({ success: false, message: "Harga beli harus lebih dari 0." });
  }

  const TOTAL = Number(QTY) * Number(HARGA_BELI);

  try {
    // 1. Simpan ke tabel PENGELUARAN
    await db.query(
      `
      INSERT INTO PENGELUARAN (IDUSER, IDSPAREPART, TANGGAL, QTY, HARGA_BELI, TOTAL, KETERANGAN)
      VALUES (?, ?, NOW(), ?, ?, ?, ?)
    `,
      [IDUSER, IDSPAREPART, QTY, HARGA_BELI, TOTAL, KETERANGAN || null],
    );

    // 2. Tambah stok di tabel SPAREPART
    await db.query(
      `
      UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?
    `,
      [QTY, IDSPAREPART],
    );

    // 3. Ambil data sparepart terbaru
    const [[sp]] = await db.query(
      `SELECT IDSPAREPART, NAMA, STOK FROM SPAREPART WHERE IDSPAREPART = ?`,
      [IDSPAREPART],
    );

    console.log("✅ tambahStok berhasil, stok baru:", sp?.STOK);
    res.json({
      success: true,
      message: "Stok berhasil ditambah dan pengeluaran tercatat.",
      data: sp,
    });
  } catch (err) {
    console.error("❌ tambahStok DB error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "DB error" });
  }
};
