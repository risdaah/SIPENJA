const db = require("../config/db");

// Helper: default periode = bulan ini
function getPeriode(query) {
  let { tgl_awal, tgl_akhir, bulan, tahun } = query;

  if (bulan && tahun) {
    const y = parseInt(tahun);
    const m = parseInt(bulan);
    const lastDay = new Date(y, m, 0).getDate();
    tgl_awal = `${y}-${String(m).padStart(2, "0")}-01`;
    tgl_akhir = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
  }

  if (!tgl_awal || !tgl_akhir) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    tgl_awal = `${y}-${String(m).padStart(2, "0")}-01`;
    tgl_akhir = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;
  }

  return { tgl_awal, tgl_akhir };
}

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const [[sp]] = await db.query(`SELECT COUNT(*) as total FROM SPAREPART`);
    const [[ls]] = await db.query(
      `SELECT COUNT(*) as total FROM LAYANANSERVIS`,
    );
    const [[tr]] = await db.query(`SELECT COUNT(*) as total FROM TRANSAKSI`);
    res.json({
      success: true,
      data: {
        total_sparepart: sp.total,
        total_layanan: ls.total,
        total_transaksi: tr.total,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};

// GET /api/dashboard/pendapatan
// Pendapatan = total transaksi SERVIS dalam periode
exports.getPendapatan = async (req, res) => {
  const { tgl_awal, tgl_akhir } = getPeriode(req.query);
  try {
    const [[row]] = await db.query(
      `
      SELECT COALESCE(SUM(TOTAL), 0) AS total
      FROM TRANSAKSI
      WHERE DATE(TANGGAL) BETWEEN ? AND ?
    `,
      [tgl_awal, tgl_akhir],
    );
    res.json({
      success: true,
      data: { total: row.total, tgl_awal, tgl_akhir },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};

// GET /api/dashboard/pengeluaran
// Pengeluaran = total dari tabel PENGELUARAN (pengisian stok) dalam periode
exports.getPengeluaran = async (req, res) => {
  const { tgl_awal, tgl_akhir } = getPeriode(req.query);
  try {
    const [[row]] = await db.query(
      `
      SELECT COALESCE(SUM(TOTAL), 0) AS total
      FROM PENGELUARAN
      WHERE DATE(TANGGAL) BETWEEN ? AND ?
    `,
      [tgl_awal, tgl_akhir],
    );
    res.json({
      success: true,
      data: { total: row.total, tgl_awal, tgl_akhir },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};

// GET /api/dashboard/top-sparepart
// Top 10 sparepart paling banyak terjual dalam periode
exports.getTopSparepart = async (req, res) => {
  const { tgl_awal, tgl_akhir } = getPeriode(req.query);
  try {
    const [rows] = await db.query(
      `
      SELECT sp.KODESPAREPART, sp.NAMA,
             COALESCE(SUM(tps.JUMLAH), 0) AS terjual
      FROM SPAREPART sp
      INNER JOIN TRANSAKSIPEMBELIANSPAREPART tps ON tps.IDSPAREPART = sp.IDSPAREPART
      INNER JOIN TRANSAKSI t ON t.IDTRANSAKSI = tps.IDTRANSAKSI
      WHERE DATE(t.TANGGAL) BETWEEN ? AND ?
      GROUP BY sp.IDSPAREPART, sp.KODESPAREPART, sp.NAMA
      ORDER BY terjual DESC
      LIMIT 10
    `,
      [tgl_awal, tgl_akhir],
    );
    res.json({ success: true, data: rows, tgl_awal, tgl_akhir });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};

// GET /api/dashboard/top-layanan
// Top 5 layanan paling sering dipakai pada servis Selesai dalam periode
exports.getTopLayanan = async (req, res) => {
  const { tgl_awal, tgl_akhir } = getPeriode(req.query);
  try {
    const [rows] = await db.query(
      `
      SELECT ls.KODELAYANAN, ls.NAMA,
             COUNT(dts.IDDETAILTRANSAKSISERVIS) AS terselesaikan
      FROM LAYANANSERVIS ls
      INNER JOIN DETAILTRANSAKSISERVIS dts ON dts.IDLAYANANSERVIS = ls.IDLAYANANSERVIS
      INNER JOIN SERVIS s ON s.IDSERVIS = dts.IDSERVIS
      WHERE s.STATUS = 'Selesai'
        AND DATE(s.TANGGALMASUK) BETWEEN ? AND ?
      GROUP BY ls.IDLAYANANSERVIS, ls.KODELAYANAN, ls.NAMA
      ORDER BY terselesaikan DESC
      LIMIT 5
    `,
      [tgl_awal, tgl_akhir],
    );
    res.json({ success: true, data: rows, tgl_awal, tgl_akhir });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};

// GET /api/dashboard/grafik
// Pendapatan = dari TRANSAKSI SERVIS
// Pengeluaran = dari tabel PENGELUARAN (pengisian stok)
exports.getGrafik = async (req, res) => {
  const { tgl_awal, tgl_akhir } = getPeriode(req.query);
  try {
    const [pendapatan] = await db.query(
      `
      SELECT DATE_FORMAT(TANGGAL, '%Y-%m') AS bulan,
             COALESCE(SUM(TOTAL), 0) AS total
      FROM TRANSAKSI
      WHERE DATE(TANGGAL) BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(TANGGAL, '%Y-%m')
      ORDER BY bulan ASC
    `,
      [tgl_awal, tgl_akhir],
    );

    const [pengeluaran] = await db.query(
      `
      SELECT DATE_FORMAT(TANGGAL, '%Y-%m') AS bulan,
             COALESCE(SUM(TOTAL), 0) AS total
      FROM PENGELUARAN
      WHERE DATE(TANGGAL) BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(TANGGAL, '%Y-%m')
      ORDER BY bulan ASC
    `,
      [tgl_awal, tgl_akhir],
    );

    res.json({
      success: true,
      data: { pendapatan, pengeluaran },
      tgl_awal,
      tgl_akhir,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "DB error", error: err });
  }
};
