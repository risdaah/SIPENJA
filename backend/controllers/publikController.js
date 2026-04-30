/**
 * controllers/publikController.js — Controller endpoint publik
 *
 * Berisi endpoint yang bisa diakses siapapun tanpa login.
 * Saat ini hanya ada satu endpoint: cek status servis via kode antrian.
 *
 * Kode antrian adalah kode unik yang diberikan kasir kepada pelanggan
 * saat mendaftarkan kendaraan untuk servis (format: SRV-YYYYMMDD-001).
 * Pelanggan bisa menggunakannya untuk memantau progress servis secara mandiri.
 */

const db = require("../config/db");

// ── CEK STATUS SERVIS ─────────────────────────────────────────────────────────
// GET /api/publik/cek-status/:kodeAntrian
// Mengembalikan info servis: nama pelanggan, keluhan, status, mekanik,
// daftar layanan yang dikerjakan, dan riwayat progress (timeline)
const cekStatusServis = async (req, res) => {
  try {
    const { kodeAntrian } = req.params;

    // Cari servis berdasarkan kode antrian, JOIN user untuk nama mekanik
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

    // Ambil layanan yang dikerjakan di servis ini
    const [layananRows] = await db.query(
      `SELECT d.*, l.NAMA as NAMA_LAYANAN, l.KODELAYANAN
       FROM detailtransaksiservis d
       LEFT JOIN layananservis l ON d.IDLAYANANSERVIS = l.IDLAYANANSERVIS
       WHERE d.IDSERVIS = ?`,
      [servis.IDSERVIS],
    );

    // Ambil riwayat progress diurutkan dari yang paling lama (untuk tampilan timeline)
    const [progressRows] = await db.query(
      `SELECT * FROM progressservis
       WHERE IDSERVIS = ?
       ORDER BY WAKTU ASC`,
      [servis.IDSERVIS],
    );

    // Hanya kembalikan field yang relevan untuk pelanggan (tidak ekspos data sensitif)
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

const getStats = async (req, res) => {
  try {
    const db = require("../config/db");

    const [[{ totalServis }]] = await db.query(
      "SELECT COUNT(*) as totalServis FROM LAYANANSERVIS",
    );

    const [[{ totalSparepart }]] = await db.query(
      "SELECT COUNT(*) as totalSparepart FROM SPAREPART WHERE STOK > 0",
    );

    return res.json({
      success: true,
      data: {
        totalServis,
        totalSparepart,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { cekStatusServis, getStats };
