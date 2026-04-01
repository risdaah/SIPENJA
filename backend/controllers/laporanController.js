/**
 * controllers/laporanController.js — Controller laporan bengkel
 *
 * Menyediakan data laporan untuk keperluan cetak atau ekspor.
 * Semua endpoint menerima filter rentang tanggal via query parameter:
 *   ?tgl_awal=YYYY-MM-DD&tgl_akhir=YYYY-MM-DD
 *
 * Laporan yang tersedia:
 *   1. Laporan Sparepart  — Rekap penjualan sparepart per item dalam periode
 *   2. Laporan Servis     — Rekap layanan servis yang dikerjakan dalam periode
 *   3. Logo bengkel       — Gambar logo dalam base64 untuk ditampilkan di print preview
 */

const db = require("../config/db");
const fs = require("fs");
const path = require("path");

/* ── LAPORAN SPAREPART ────────────────────────────────────────────────────────
   Query JOIN: TRANSAKSIPEMBELIANSPAREPART → TRANSAKSI → SPAREPART → KATEGORISPAREPART
   Menghasilkan: tanggal, nama sparepart, kategori, harga satuan, qty, subtotal
────────────────────────────────────────────────────────────────────────────── */
exports.laporanSparepart = async (req, res) => {
  const { tgl_awal, tgl_akhir } = req.query;

  if (!tgl_awal || !tgl_akhir) {
    return res
      .status(400)
      .json({ message: "Parameter tgl_awal dan tgl_akhir wajib diisi." });
  }

  const sql = `
    SELECT 
      DATE(t.TANGGAL)        AS TANGGAL,
      sp.NAMA                AS NAMA_SPAREPART,
      ks.NAMA                AS NAMA_KATEGORI,
      tps.HARGA_SATUAN       AS HARGASATUAN,
      tps.JUMLAH             AS QTY,
      tps.SUB_TOTAL          AS SUBTOTAL
    FROM TRANSAKSIPEMBELIANSPAREPART tps
    JOIN TRANSAKSI t         ON t.IDTRANSAKSI  = tps.IDTRANSAKSI
    JOIN SPAREPART sp        ON sp.IDSPAREPART = tps.IDSPAREPART
    LEFT JOIN KATEGORISPAREPART ks ON ks.IDKATEGORI = sp.IDKATEGORI
    WHERE DATE(t.TANGGAL) BETWEEN ? AND ?
    ORDER BY t.TANGGAL ASC
  `;

  try {
    const [results] = await db.query(sql, [tgl_awal, tgl_akhir]);
    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err });
  }
};

/* ── LAPORAN SERVIS ──────────────────────────────────────────────────────────
   Query JOIN: DETAILTRANSAKSISERVIS → LAYANANSERVIS → SERVIS
   Menghasilkan: tanggal, kode layanan, nama layanan, biaya, jumlah pengerjaan
   Dikelompokkan per hari + per layanan untuk melihat frekuensi pekerjaan
────────────────────────────────────────────────────────────────────────────── */
exports.laporanServis = async (req, res) => {
  const { tgl_awal, tgl_akhir } = req.query;

  if (!tgl_awal || !tgl_akhir) {
    return res
      .status(400)
      .json({ message: "Parameter tgl_awal dan tgl_akhir wajib diisi." });
  }

  const sql = `
    SELECT
      DATE(s.TANGGALMASUK)    AS TANGGAL,
      ls.KODELAYANAN          AS KODELAYANAN,
      ls.NAMA                 AS NAMA_LAYANAN,
      dts.BIAYA               AS BIAYA,
      COUNT(dts.IDSERVIS)     AS JUMLAH
    FROM DETAILTRANSAKSISERVIS dts
    JOIN LAYANANSERVIS ls ON ls.IDLAYANANSERVIS = dts.IDLAYANANSERVIS
    JOIN SERVIS s         ON s.IDSERVIS         = dts.IDSERVIS
    WHERE DATE(s.TANGGALMASUK) BETWEEN ? AND ?
    GROUP BY DATE(s.TANGGALMASUK), ls.IDLAYANANSERVIS, ls.KODELAYANAN, ls.NAMA, dts.BIAYA
    ORDER BY DATE(s.TANGGALMASUK) ASC, ls.KODELAYANAN ASC
  `;

  try {
    const [results] = await db.query(sql, [tgl_awal, tgl_akhir]);
    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ message: "DB error", error: err });
  }
};

/* ── GET LOGO ────────────────────────────────────────────────────────────────
   Membaca file logo dari folder img dan mengembalikannya dalam format base64.
   Digunakan oleh frontend untuk menampilkan logo di halaman print preview
   tanpa perlu URL relatif yang bisa bermasalah saat print.
────────────────────────────────────────────────────────────────────────────── */
exports.getLogo = (req, res) => {
  const logoPath = path.join(__dirname, "../../frontend/img/logo-anijaya.jpeg");
  const img = fs.readFileSync(logoPath);
  const base64 = "data:image/jpeg;base64," + img.toString("base64");
  res.json({ logo: base64 });
};
