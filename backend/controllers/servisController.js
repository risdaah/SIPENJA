/**
 * controllers/servisController.js — Controller pekerjaan servis kendaraan
 *
 * Servis mencatat detail pengerjaan tiap kendaraan yang masuk bengkel.
 * Setiap servis memiliki:
 *   - STATUS : Belum → Dalam Proses → Selesai (tidak bisa mundur setelah Selesai)
 *   - LAYANAN  : Pekerjaan yang dilakukan (DetailTransaksiServis)
 *   - SPAREPART: Suku cadang yang dipakai — stok berkurang saat ditambah, kembali saat dihapus
 *   - PROGRESS : Riwayat perubahan status dengan timestamp dan keterangan
 *
 * Aturan bisnis penting:
 *   - Servis berstatus "Selesai" tidak bisa diubah/ditambah/dihapus item-nya
 *   - Minimal harus ada 1 layanan (tidak bisa hapus layanan terakhir)
 *   - Saat servis dihapus: stok semua sparepart dikembalikan + transaksi ikut terhapus
 */

const db = require("../config/db");
const Servis = require("../models/servisModel");
const DetailTransaksiServis = require("../models/detailTransaksiServisModel");
const ServisSparepart = require("../models/servisSparepartModel");
const ProgressServis = require("../models/progressServisModel");

/* ── GET ──────────────────────────────────────────────────────────────────── */

// Ambil semua servis dengan info mekanik, kasir, dan total
const getAllServis = async (req, res) => {
  try {
    const data = await Servis.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ambil detail satu servis lengkap: + layanan + sparepart + riwayat progress
const getServisById = async (req, res) => {
  try {
    const data = await Servis.getById(req.params.id);
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });

    // Lampirkan sub-data dari tabel relasi
    data.LAYANAN = await DetailTransaksiServis.getByServis(data.IDSERVIS);
    data.SPAREPART = await ServisSparepart.getByServis(data.IDSERVIS);
    data.PROGRESS = await ProgressServis.getByServis(data.IDSERVIS);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Filter servis berdasarkan STATUS: Belum | Dalam Proses | Selesai
const getServisByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    if (!["Belum", "Dalam Proses", "Selesai"].includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "STATUS harus Belum, Dalam Proses, atau Selesai",
        });
    }
    const data = await Servis.getByStatus(status);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Untuk halaman kerja mekanik: tampilkan servis yang ditugaskan padanya, beserta layanannya
const getServisByMekanik = async (req, res) => {
  try {
    const idMekanik = parseInt(req.params.idMekanik, 10);

    if (isNaN(idMekanik)) {
      return res
        .status(400)
        .json({ success: false, message: "idMekanik tidak valid" });
    }

    const list = await Servis.getByMekanik(idMekanik);

    // Lampirkan data layanan ke setiap servis (untuk tampilan daftar pekerjaan mekanik)
    const data = await Promise.all(
      list.map(async (s) => {
        const plain = { ...s };
        plain.LAYANAN = await DetailTransaksiServis.getByServis(s.IDSERVIS);
        return plain;
      }),
    );

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cek status servis via kode antrian — dipanggil dari halaman tracking pelanggan
const trackServis = async (req, res) => {
  try {
    const { kodeAntrian } = req.params;
    const data = await Servis.getByKodeAntrian(kodeAntrian);
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Kode antrian tidak ditemukan." });
    }
    const progress = await ProgressServis.getByServis(data.IDSERVIS);
    res.json({
      success: true,
      data: {
        KODEANTRIAN: data.KODEANTRIAN,
        NAMAPELANGGAN: data.NAMAPELANGGAN,
        KELUHAN: data.KELUHAN,
        STATUS: data.STATUS,
        TANGGALMASUK: data.TANGGALMASUK,
        TANGGALSELESAI: data.TANGGALSELESAI,
        NAMA_MEKANIK: data.NAMA_MEKANIK,
        NOTRANSAKSI: data.NOTRANSAKSI,
        TOTAL: data.TOTAL,
        PROGRESS: progress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Filter servis berdasarkan rentang tanggal masuk
const getServisByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ success: false, message: "startDate dan endDate wajib diisi" });
    }
    const data = await Servis.getByDateRange(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── UPDATE PROGRESS ─────────────────────────────────────────────────────────
   Endpoint utama yang dipakai mekanik untuk mengupdate perkembangan servis.
   Dalam satu request mekanik bisa sekaligus:
     1. Mengubah STATUS (Belum → Dalam Proses → Selesai)
     2. Menambah sparepart yang dipakai (stok berkurang otomatis)
     3. Menambah layanan tambahan yang dikerjakan
   TOTAL transaksi di-recalculate setelah setiap perubahan.

   Body:
   {
     STATUS      : 'Belum' | 'Dalam Proses' | 'Selesai'  (wajib)
     KETERANGAN  : string                                  (opsional)
     SPAREPART   : [{ IDSPAREPART, QTY }]                 (opsional)
     LAYANAN     : [{ IDLAYANANSERVIS }]                   (opsional)
   }
────────────────────────────────────────────────────────────────────────────── */
const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { STATUS, KETERANGAN, SPAREPART, LAYANAN } = req.body;

    if (!STATUS)
      return res
        .status(400)
        .json({ success: false, message: "STATUS wajib diisi" });
    if (!["Belum", "Dalam Proses", "Selesai"].includes(STATUS))
      return res
        .status(400)
        .json({
          success: false,
          message: "STATUS harus Belum, Dalam Proses, atau Selesai",
        });

    const existing = await Servis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });

    // Servis yang sudah selesai tidak bisa diubah lagi
    if (existing.STATUS === "Selesai")
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa diubah",
        });

    // Validasi item sparepart dan layanan sebelum menyimpan
    if (SPAREPART && SPAREPART.length > 0) {
      for (const item of SPAREPART) {
        if (!item.IDSPAREPART || !item.QTY || item.QTY <= 0)
          return res
            .status(400)
            .json({
              success: false,
              message:
                "IDSPAREPART dan QTY (> 0) wajib diisi pada setiap sparepart",
            });
      }
    }
    if (LAYANAN && LAYANAN.length > 0) {
      for (const item of LAYANAN) {
        if (!item.IDLAYANANSERVIS)
          return res
            .status(400)
            .json({
              success: false,
              message: "IDLAYANANSERVIS wajib diisi pada setiap layanan",
            });
      }
    }

    // 1. Update STATUS servis (jika Selesai, TANGGALSELESAI juga diisi di model)
    await Servis.updateStatus(id, STATUS);

    // 2. Tambah sparepart yang dipakai (stok berkurang di model)
    if (SPAREPART && SPAREPART.length > 0)
      await ServisSparepart.create(id, SPAREPART);

    // 3. Tambah layanan tambahan
    if (LAYANAN && LAYANAN.length > 0)
      await DetailTransaksiServis.create(id, LAYANAN);

    // 4. Recalculate total transaksi (layanan + sparepart)
    const total = await Servis.updateTotal(id);

    // 5. Catat progress baru dengan keterangan default jika tidak diisi
    const keterangan = KETERANGAN || defaultKeterangan(STATUS);
    const progress = await ProgressServis.create(id, STATUS, keterangan);

    // 6. Kembalikan data terbaru untuk update UI di frontend
    const updatedServis = await Servis.getById(id);
    updatedServis.LAYANAN = await DetailTransaksiServis.getByServis(id);
    updatedServis.SPAREPART = await ServisSparepart.getByServis(id);
    updatedServis.PROGRESS = await ProgressServis.getByServis(id);

    res.json({
      success: true,
      message: `Progress servis berhasil diupdate menjadi ${STATUS}`,
      data: {
        ...updatedServis,
        TOTAL: total,
        PROGRESS: updatedServis.PROGRESS,
        progress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: keterangan default berdasarkan STATUS (jika mekanik tidak mengisi keterangan)
function defaultKeterangan(STATUS) {
  const map = {
    Belum: "Kendaraan masuk, menunggu dikerjakan",
    "Dalam Proses": "Kendaraan sedang dikerjakan",
    Selesai: "Kendaraan selesai dikerjakan dan siap diambil",
  };
  return map[STATUS] || `Status diupdate menjadi ${STATUS}`;
}

/* ── ADD SPAREPART (standalone) ──────────────────────────────────────────────
   Menambah sparepart ke servis yang sudah ada tanpa mengubah STATUS.
   Stok berkurang otomatis di model.
────────────────────────────────────────────────────────────────────────────── */
const addSparepart = async (req, res) => {
  try {
    const { id } = req.params;
    const { ITEMS } = req.body;

    if (!ITEMS || ITEMS.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "ITEMS wajib diisi" });
    for (const item of ITEMS) {
      if (!item.IDSPAREPART || !item.QTY || item.QTY <= 0)
        return res
          .status(400)
          .json({
            success: false,
            message: "IDSPAREPART dan QTY (> 0) wajib diisi",
          });
    }

    const existing = await Servis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    if (existing.STATUS === "Selesai")
      return res
        .status(400)
        .json({
          success: false,
          message: "Tidak bisa menambah sparepart, servis sudah Selesai",
        });

    await ServisSparepart.create(id, ITEMS);
    const total = await Servis.updateTotal(id); // Recalculate total setelah sparepart ditambah

    res.json({
      success: true,
      message: "Sparepart berhasil ditambahkan",
      data: { TOTAL: total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── ADD LAYANAN (standalone) ────────────────────────────────────────────────
   Menambah layanan tambahan ke servis yang sudah ada tanpa mengubah STATUS.
────────────────────────────────────────────────────────────────────────────── */
const addLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { ITEMS } = req.body;

    if (!ITEMS || ITEMS.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "ITEMS wajib diisi" });
    for (const item of ITEMS) {
      if (!item.IDLAYANANSERVIS)
        return res
          .status(400)
          .json({ success: false, message: "IDLAYANANSERVIS wajib diisi" });
    }

    const existing = await Servis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    if (existing.STATUS === "Selesai")
      return res
        .status(400)
        .json({
          success: false,
          message: "Tidak bisa menambah layanan, servis sudah Selesai",
        });

    await DetailTransaksiServis.create(id, ITEMS);
    const total = await Servis.updateTotal(id); // Recalculate total

    res.json({
      success: true,
      message: "Layanan berhasil ditambahkan",
      data: { TOTAL: total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── UPDATE DATA SERVIS (kasir/admin) ────────────────────────────────────────
   Edit info dasar: nama pelanggan, keluhan, atau catatan transaksi.
   Tidak bisa diubah jika servis sudah Selesai.
────────────────────────────────────────────────────────────────────────────── */
const updateServis = async (req, res) => {
  try {
    const { id } = req.params;
    const { NAMAPELANGGAN, KELUHAN, CATATAN } = req.body;

    if (!NAMAPELANGGAN && !KELUHAN && CATATAN === undefined)
      return res
        .status(400)
        .json({ success: false, message: "Minimal satu field harus diisi" });

    const existing = await Servis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    if (existing.STATUS === "Selesai")
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa diubah",
        });

    // Update tabel SERVIS untuk field yang dikirim
    const updateData = {};
    if (NAMAPELANGGAN) updateData.NAMAPELANGGAN = NAMAPELANGGAN;
    if (KELUHAN) updateData.KELUHAN = KELUHAN;
    if (Object.keys(updateData).length > 0) await Servis.update(id, updateData);

    // Update CATATAN di tabel TRANSAKSI (bukan di tabel SERVIS)
    if (CATATAN !== undefined) {
      await db.query("UPDATE TRANSAKSI SET CATATAN = ? WHERE IDTRANSAKSI = ?", [
        CATATAN,
        existing.IDTRANSAKSI,
      ]);
    }

    res.json({ success: true, message: "Data servis berhasil diupdate" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── UPDATE LAYANAN & SPAREPART (individual) ─────────────────────────────────
   Edit biaya atau keterangan satu layanan tertentu.
   Total transaksi di-recalculate setelah perubahan.
────────────────────────────────────────────────────────────────────────────── */
const updateLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { BIAYA, KETERANGAN } = req.body;

    if (BIAYA === undefined && KETERANGAN === undefined)
      return res
        .status(400)
        .json({
          success: false,
          message: "Minimal BIAYA atau KETERANGAN harus diisi",
        });

    const existing = await DetailTransaksiServis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Layanan tidak ditemukan" });

    // Cek status servis induk
    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === "Selesai")
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa diubah",
        });

    const data = await DetailTransaksiServis.update(id, { BIAYA, KETERANGAN });
    const total = await Servis.updateTotal(existing.IDSERVIS);

    res.json({
      success: true,
      message: "Layanan berhasil diupdate",
      data: { ...data, TOTAL: total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit qty satu sparepart di servis (stok di-adjust di model)
const updateSparepart = async (req, res) => {
  try {
    const { id } = req.params;
    const { QTY } = req.body;

    if (!QTY || QTY <= 0)
      return res
        .status(400)
        .json({
          success: false,
          message: "QTY wajib diisi dan harus lebih dari 0",
        });

    const existing = await ServisSparepart.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Sparepart tidak ditemukan" });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === "Selesai")
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa diubah",
        });

    const data = await ServisSparepart.update(id, { QTY });
    const total = await Servis.updateTotal(existing.IDSERVIS);

    res.json({
      success: true,
      message: "Sparepart berhasil diupdate",
      data: { ...data, TOTAL: total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ── DELETE ──────────────────────────────────────────────────────────────────
   Aturan delete:
     - Tidak bisa hapus item dari servis yang sudah Selesai
     - Tidak bisa hapus layanan terakhir (minimal harus ada 1)
     - Hapus sparepart → stok dikembalikan
     - Hapus seluruh servis → semua stok dikembalikan + transaksi ikut terhapus
────────────────────────────────────────────────────────────────────────────── */
const deleteLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await DetailTransaksiServis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Layanan tidak ditemukan" });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === "Selesai")
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa dihapus",
        });

    // Cegah penghapusan layanan terakhir
    const layanan = await DetailTransaksiServis.getByServis(existing.IDSERVIS);
    if (layanan.length <= 1)
      return res
        .status(400)
        .json({ success: false, message: "Minimal harus ada 1 layanan" });

    await DetailTransaksiServis.deleteById(id);
    const total = await Servis.updateTotal(existing.IDSERVIS);

    res.json({
      success: true,
      message: "Layanan berhasil dihapus",
      data: { TOTAL: total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSparepart = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await ServisSparepart.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Sparepart tidak ditemukan" });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === "Selesai")
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa dihapus",
        });

    // Stok dikembalikan di dalam ServisSparepart.deleteById
    await ServisSparepart.deleteById(id);
    const total = await Servis.updateTotal(existing.IDSERVIS);

    res.json({
      success: true,
      message: "Sparepart berhasil dihapus",
      data: { TOTAL: total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hapus seluruh servis beserta semua relasinya + kembalikan stok + hapus transaksi
const deleteServis = async (req, res) => {
  try {
    const existing = await Servis.getById(req.params.id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });

    // Servis.delete menangani: kembalikan stok + hapus child records + hapus transaksi
    await Servis.delete(req.params.id);
    res.json({ success: true, message: "Servis berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllServis,
  getServisById,
  getServisByStatus,
  getServisByMekanik,
  trackServis,
  getServisByDateRange,
  addSparepart,
  addLayanan,
  updateServis,
  updateLayanan,
  updateSparepart,
  updateProgress,
  deleteLayanan,
  deleteSparepart,
  deleteServis,
};
