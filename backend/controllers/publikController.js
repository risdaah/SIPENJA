const db = require("../config/db");

// GET /api/publik/cek-status/:kodeAntrian
// Endpoint publik — tanpa authMiddleware
const cekStatusServis = async (req, res) => {
  try {
    const { kodeAntrian } = req.params;

    const [servisRows] = await db.query(
      `SELECT s.*, u.NAMA as NAMA_MEKANIK
       FROM servis s
       LEFT JOIN user u ON s.IDUSER = u.IDUSER
       WHERE s.KODEANTRIAN = ?
       LIMIT 1`,
      [kodeAntrian],
    );

    if (!servisRows.length) {
      return res.json({
        success: false,
        message: "Servis tidak ditemukan",
        data: null,
      });
    }

    const servis = servisRows[0];

    const [layananRows] = await db.query(
      `SELECT d.*, l.NAMA as NAMA_LAYANAN, l.KODELAYANAN
       FROM detailtransaksiservis d
       LEFT JOIN layananservis l ON d.IDLAYANANSERVIS = l.IDLAYANANSERVIS
       WHERE d.IDSERVIS = ?`,
      [servis.IDSERVIS],
    );

    const [progressRows] = await db.query(
      `SELECT * FROM progressservis
       WHERE IDSERVIS = ?
       ORDER BY WAKTU ASC`,
      [servis.IDSERVIS],
    );

    res.json({
      success: true,
      data: {
        KODEANTRIAN: servis.KODEANTRIAN,
        NAMAPELANGGAN: servis.NAMAPELANGGAN,
        KELUHAN: servis.KELUHAN,
        STATUS: servis.STATUS,
        TANGGALMASUK: servis.TANGGALMASUK,
        TANGGALSELESAI: servis.TANGGALSELESAI,
        NAMA_MEKANIK: servis.NAMA_MEKANIK,
        LAYANAN: layananRows,
        PROGRESS: progressRows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { cekStatusServis };
