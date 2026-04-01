/**
 * controllers/pengeluaranController.js — Controller pengeluaran / pengisian stok
 *
 * Pengeluaran dicatat setiap kali bengkel membeli sparepart dari supplier
 * untuk mengisi kembali stok (restock).
 *
 * Alur tambah stok:
 *   1. Admin/kasir menginput: sparepart, qty, harga beli per unit, keterangan
 *   2. Record pengeluaran disimpan ke tabel PENGELUARAN
 *   3. Stok sparepart di tabel SPAREPART ditambah sejumlah QTY
 *
 * Data pengeluaran digunakan oleh dashboardController untuk menghitung
 * total pengeluaran operasional bengkel dalam periode tertentu.
 */

const db = require("../config/db");

// ── GET ALL PENGELUARAN ───────────────────────────────────────────────────────
// Mengembalikan semua riwayat pengeluaran dengan nama sparepart dan nama kasir
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
    res
      .status(500)
      .json({ success: false, message: err.message || "DB error" });
  }
};

// ── TAMBAH STOK (restock sparepart) ──────────────────────────────────────────
// Body: { IDSPAREPART, QTY, HARGA_BELI, KETERANGAN }
// TOTAL dihitung otomatis: QTY × HARGA_BELI
// IDUSER diambil dari req.user (hasil decode JWT oleh authMiddleware)
exports.tambahStok = async (req, res) => {
  const { IDSPAREPART, QTY, HARGA_BELI, KETERANGAN } = req.body;

  // Ambil IDUSER dari payload JWT — cek berbagai kemungkinan nama field
  // (karena bisa berbeda tergantung versi middleware yang dipakai)
  const IDUSER =
    req.user?.IDUSER ||
    req.user?.id ||
    req.user?.ID ||
    req.user?.userId ||
    null;

  if (!IDUSER) {
    return res.status(401).json({
      success: false,
      message: "User tidak terautentikasi. Pastikan token valid.",
    });
  }

  // Validasi field wajib
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

  // Kalkulasi total pengeluaran untuk record ini
  const TOTAL = Number(QTY) * Number(HARGA_BELI);

  try {
    // 1. Simpan record pengeluaran ke tabel PENGELUARAN
    await db.query(
      `INSERT INTO PENGELUARAN (IDUSER, IDSPAREPART, TANGGAL, QTY, HARGA_BELI, TOTAL, KETERANGAN)
       VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
      [IDUSER, IDSPAREPART, QTY, HARGA_BELI, TOTAL, KETERANGAN || null],
    );

    // 2. Tambahkan stok sparepart (increment, bukan set langsung)
    await db.query(
      `UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?`,
      [QTY, IDSPAREPART],
    );

    // 3. Ambil data sparepart terbaru untuk dikembalikan ke frontend
    const [[sp]] = await db.query(
      `SELECT IDSPAREPART, NAMA, STOK FROM SPAREPART WHERE IDSPAREPART = ?`,
      [IDSPAREPART],
    );

    res.json({
      success: true,
      message: "Stok berhasil ditambah dan pengeluaran tercatat.",
      data: sp,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: err.message || "DB error" });
  }
};
