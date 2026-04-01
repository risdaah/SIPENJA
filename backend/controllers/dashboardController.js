/**
 * controllers/dashboardController.js — Controller data dashboard admin
 *
 * Menyediakan semua data yang ditampilkan di halaman dashboard admin:
 *   - Stat kartu: total sparepart, layanan, transaksi
 *   - Keuangan: pendapatan dan pengeluaran dalam periode
 *   - Ranking: top 10 sparepart & top 5 layanan paling laku
 *   - Grafik: tren pendapatan vs pengeluaran per bulan
 *
 * Semua endpoint mendukung filter periode via query param:
 *   ?tgl_awal=YYYY-MM-DD&tgl_akhir=YYYY-MM-DD
 *   atau ?bulan=1&tahun=2026
 *   Jika tidak ada parameter → default ke bulan berjalan
 */

const db = require("../config/db");

// ── Helper: Resolve periode ───────────────────────────────────────────────────
// Mengkonversi berbagai format input periode menjadi tgl_awal & tgl_akhir.
// Prioritas: rentang tanggal eksplisit > bulan+tahun > default bulan ini
function getPeriode(query) {
  let { tgl_awal, tgl_akhir, bulan, tahun } = query;

  // Jika parameter bulan dan tahun dikirim, hitung tanggal awal & akhir bulan tersebut
  if (bulan && tahun) {
    const y       = parseInt(tahun);
    const m       = parseInt(bulan);
    const lastDay = new Date(y, m, 0).getDate(); // Hari terakhir bulan (mis. Feb = 28/29)
    tgl_awal  = `${y}-${String(m).padStart(2, "0")}-01`;
    tgl_akhir = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
  }

  // Fallback: jika tidak ada parameter sama sekali, gunakan bulan berjalan
  if (!tgl_awal || !tgl_akhir) {
    const now     = new Date();
    const y       = now.getFullYear();
    const m       = now.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    tgl_awal  = `${y}-${String(m).padStart(2, "0")}-01`;
    tgl_akhir = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
  }

  return { tgl_awal, tgl_akhir };
}

// ── GET STATS ─────────────────────────────────────────────────────────────────
// Menghitung total record dari tiga tabel utama untuk ditampilkan di stat kartu
exports.getStats = async (req, res) => {
  try {
    const [[sp]] = await db.query(`SELECT COUNT(*) as total FROM SPAREPART`);
    const [[ls]] = await db.query(`SELECT COUNT(*) as total FROM LAYANANSERVIS`);
    const [[tr]] = await db.query(`SELECT COUNT(*) as total FROM TRANSAKSI`);
    res.json({
      success: true,
      data: {
        total_sparepart: sp.total,
        total_layanan:   ls.total,
        total_transaksi: tr.total,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};

// ── GET PENDAPATAN ────────────────────────────────────────────────────────────
// Pendapatan = sum(TOTAL) dari semua transaksi (SERVIS + PEMBELIAN) dalam periode
exports.getPendapatan = async (req, res) => {
  const { tgl_awal, tgl_akhir } = getPeriode(req.query);
  try {
    const [[row]] = await db.query(
      `SELECT COALESCE(SUM(TOTAL), 0) AS total FROM TRANSAKSI WHERE DATE(TANGGAL) BETWEEN ? AND ?`,
      [tgl_awal, tgl_akhir],
    );
    res.json({ success: true, data: { total: row.total, tgl_awal, tgl_akhir } });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};

// ── GET PENGELUARAN ───────────────────────────────────────────────────────────
// Pengeluaran = sum(TOTAL) dari tabel PENGELUARAN (pengisian stok sparepart)
exports.getPengeluaran = async (req, res) => {
  const { tgl_awal, tgl_akhir } = getPeriode(req.query);
  try {
    const [[row]] = await db.query(
      `SELECT COALESCE(SUM(TOTAL), 0) AS total FROM PENGELUARAN WHERE DATE(TANGGAL) BETWEEN ? AND ?`,
      [tgl_awal, tgl_akhir],
    );
    res.json({ success: true, data: { total: row.total, tgl_awal, tgl_akhir } });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};

// ── GET TOP SPAREPART ─────────────────────────────────────────────────────────
// Ranking 10 sparepart paling banyak terjual (dari TRANSAKSIPEMBELIANSPAREPART)
// Berguna untuk manajemen stok: tahu produk mana yang perlu sering di-restock
exports.getTopSparepart = async (req, res) => {
  const { tgl_awal, tgl_akhir } = getPeriode(req.query);
  try {
    const [rows] = await db.query(
      `SELECT sp.KODESPAREPART, sp.NAMA,
              COALESCE(SUM(tps.JUMLAH), 0) AS terjual
       FROM SPAREPART sp
       INNER JOIN TRANSAKSIPEMBELIANSPAREPART tps ON tps.IDSPAREPART = sp.IDSPAREPART
       INNER JOIN TRANSAKSI t ON t.IDTRANSAKSI = tps.IDTRANSAKSI
       WHERE DATE(t.TANGGAL) BETWEEN ? AND ?
       GROUP BY sp.IDSPAREPART, sp.KODESPAREPART, sp.NAMA
       ORDER BY terjual DESC
       LIMIT 10`,
      [tgl_awal, tgl_akhir],
    );
    res.json({ success: true, data: rows, tgl_awal, tgl_akhir });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};

// ── GET TOP LAYANAN ───────────────────────────────────────────────────────────
// Ranking 5 layanan servis paling sering diselesaikan
// Hanya menghitung servis berstatus "Selesai" agar data lebih akurat
exports.getTopLayanan = async (req, res) => {
  const { tgl_awal, tgl_akhir } = getPeriode(req.query);
  try {
    const [rows] = await db.query(
      `SELECT ls.KODELAYANAN, ls.NAMA,
              COUNT(dts.IDDETAILTRANSAKSISERVIS) AS terselesaikan
       FROM LAYANANSERVIS ls
       INNER JOIN DETAILTRANSAKSISERVIS dts ON dts.IDLAYANANSERVIS = ls.IDLAYANANSERVIS
       INNER JOIN SERVIS s ON s.IDSERVIS = dts.IDSERVIS
       WHERE s.STATUS = 'Selesai'
         AND DATE(s.TANGGALMASUK) BETWEEN ? AND ?
       GROUP BY ls.IDLAYANANSERVIS, ls.KODELAYANAN, ls.NAMA
       ORDER BY terselesaikan DESC
       LIMIT 5`,
      [tgl_awal, tgl_akhir],
    );
    res.json({ success: true, data: rows, tgl_awal, tgl_akhir });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};

// ── GET GRAFIK ────────────────────────────────────────────────────────────────
// Data untuk grafik garis/batang: pendapatan vs pengeluaran per bulan
// Dikelompokkan per bulan (FORMAT: YYYY-MM) dalam periode yang dipilih
exports.getGrafik = async (req, res) => {
  const { tgl_awal, tgl_akhir } = getPeriode(req.query);
  try {
    // Pendapatan dari TRANSAKSI per bulan
    const [pendapatan] = await db.query(
      `SELECT DATE_FORMAT(TANGGAL, '%Y-%m') AS bulan,
              COALESCE(SUM(TOTAL), 0) AS total
       FROM TRANSAKSI
       WHERE DATE(TANGGAL) BETWEEN ? AND ?
       GROUP BY DATE_FORMAT(TANGGAL, '%Y-%m')
       ORDER BY bulan ASC`,
      [tgl_awal, tgl_akhir],
    );

    // Pengeluaran dari PENGELUARAN per bulan
    const [pengeluaran] = await db.query(
      `SELECT DATE_FORMAT(TANGGAL, '%Y-%m') AS bulan,
              COALESCE(SUM(TOTAL), 0) AS total
       FROM PENGELUARAN
       WHERE DATE(TANGGAL) BETWEEN ? AND ?
       GROUP BY DATE_FORMAT(TANGGAL, '%Y-%m')
       ORDER BY bulan ASC`,
      [tgl_awal, tgl_akhir],
    );

    res.json({ success: true, data: { pendapatan, pengeluaran }, tgl_awal, tgl_akhir });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};
