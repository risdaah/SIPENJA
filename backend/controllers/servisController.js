const db = require("../config/db");
const Servis = require("../models/servisModel");
const DetailTransaksiServis = require("../models/detailTransaksiServisModel");
const ServisSparepart = require("../models/servisSparepartModel");
const ProgressServis = require("../models/progressServisModel");

const getAllServis = async (req, res) => {
  try {
    const data = await Servis.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getServisById = async (req, res) => {
  try {
    const data = await Servis.getById(req.params.id);
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    data.LAYANAN = await DetailTransaksiServis.getByServis(data.IDSERVIS);
    data.SPAREPART = await ServisSparepart.getByServis(data.IDSERVIS);
    data.PROGRESS = await ProgressServis.getByServis(data.IDSERVIS);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

// Endpoint publik: Pelanggan tracking status servis via kode antrian (tidak perlu login)
const trackServis = async (req, res) => {
  try {
    const { kodeAntrian } = req.params;
    const data = await Servis.getByKodeAntrian(kodeAntrian);
    if (!data) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Kode antrian tidak ditemukan. Pastikan kode antrian sudah benar.",
        });
    }

    // Ambil progress untuk ditampilkan ke pelanggan (hanya info yang diperlukan)
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

// Lihat servis yang ditugaskan ke mekanik tertentu
const getServisByMekanik = async (req, res) => {
  try {
    const data = await Servis.getByMekanik(req.params.idMekanik);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Filter servis by rentang tanggal
const getServisByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "startDate dan endDate wajib diisi (format: YYYY-MM-DD)",
        });
    }
    const data = await Servis.getByDateRange(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Kasir update data servis
const updateServis = async (req, res) => {
  try {
    const { id } = req.params;
    const { NAMAPELANGGAN, KELUHAN, CATATAN } = req.body;

    // Validasi minimal satu field diisi
    if (!NAMAPELANGGAN && !KELUHAN && CATATAN === undefined) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Minimal satu field (NAMAPELANGGAN, KELUHAN, atau CATATAN) harus diisi",
        });
    }

    const existing = await Servis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    if (existing.STATUS === "Selesai") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa diubah",
        });
    }

    const updateData = {};
    if (NAMAPELANGGAN) updateData.NAMAPELANGGAN = NAMAPELANGGAN;
    if (KELUHAN) updateData.KELUHAN = KELUHAN;
    if (Object.keys(updateData).length > 0) await Servis.update(id, updateData);

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

// Mekanik update progress servis
// Ganti fungsi updateProgress di servisController.js dengan ini:

const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { STATUS, KETERANGAN } = req.body;

    if (!STATUS) {
      return res
        .status(400)
        .json({ success: false, message: "STATUS wajib diisi" });
    }
    if (!["Belum", "Dalam Proses", "Selesai"].includes(STATUS)) {
      return res.status(400).json({
        success: false,
        message: "STATUS harus Belum, Dalam Proses, atau Selesai",
      });
    }

    const existing = await Servis.getById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    }
    if (existing.STATUS === "Selesai") {
      return res.status(400).json({
        success: false,
        message: "Servis sudah Selesai, tidak bisa diubah",
      });
    }

    // 1. Update STATUS di tabel SERVIS
    //    Jika Selesai → TANGGALSELESAI otomatis diisi via Servis.updateStatus
    await Servis.updateStatus(id, STATUS);

    // 2. Catat progress baru di PROGRESSSERVIS
    const keterangan = KETERANGAN || defaultKeterangan(STATUS);
    const progress = await ProgressServis.create(id, STATUS, keterangan);

    res.json({
      success: true,
      message: `Progress servis berhasil diupdate menjadi ${STATUS}`,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper keterangan default per status
function defaultKeterangan(STATUS) {
  const map = {
    Belum: "Kendaraan masuk, menunggu dikerjakan",
    "Dalam Proses": "Kendaraan sedang dikerjakan",
    Selesai: "Kendaraan selesai dikerjakan dan siap diambil",
  };
  return map[STATUS] || `Status diupdate menjadi ${STATUS}`;
}

// Mekanik tambah sparepart ke servis
const addSparepart = async (req, res) => {
  try {
    const { id } = req.params;
    const { ITEMS } = req.body;

    if (!ITEMS || ITEMS.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "ITEMS wajib diisi" });
    }
    for (const item of ITEMS) {
      if (!item.IDSPAREPART || !item.QTY) {
        return res
          .status(400)
          .json({
            success: false,
            message: "IDSPAREPART dan QTY wajib diisi pada setiap item",
          });
      }
      if (item.QTY <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "QTY harus lebih dari 0" });
      }
    }

    const existing = await Servis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    if (existing.STATUS === "Selesai") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Tidak bisa menambah sparepart, servis sudah Selesai",
        });
    }

    await ServisSparepart.create(id, ITEMS);
    const total = await Servis.updateTotal(id);

    res.json({
      success: true,
      message: "Sparepart berhasil ditambahkan",
      data: { TOTAL: total, ITEMS },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mekanik tambah layanan ke servis
const addLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { ITEMS } = req.body;

    if (!ITEMS || ITEMS.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "ITEMS wajib diisi" });
    }
    for (const item of ITEMS) {
      if (!item.IDLAYANANSERVIS) {
        return res
          .status(400)
          .json({
            success: false,
            message: "IDLAYANANSERVIS wajib diisi pada setiap item",
          });
      }
    }

    const existing = await Servis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    if (existing.STATUS === "Selesai") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Tidak bisa menambah layanan, servis sudah Selesai",
        });
    }

    await DetailTransaksiServis.create(id, ITEMS);
    const total = await Servis.updateTotal(id);

    res.json({
      success: true,
      message: "Layanan berhasil ditambahkan",
      data: { TOTAL: total, ITEMS },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// FIX: Mekanik update layanan — sekarang BIAYA bisa diubah juga
const updateLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { BIAYA, KETERANGAN } = req.body;

    if (BIAYA === undefined && KETERANGAN === undefined) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Minimal BIAYA atau KETERANGAN harus diisi",
        });
    }

    const existing = await DetailTransaksiServis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Layanan tidak ditemukan" });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === "Selesai") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa diubah",
        });
    }

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

// FIX: Mekanik update sparepart — hapus validasi HARGASATUAN karena harga tetap dari DB
const updateSparepart = async (req, res) => {
  try {
    const { id } = req.params;
    const { QTY } = req.body;

    if (!QTY) {
      return res
        .status(400)
        .json({ success: false, message: "QTY wajib diisi" });
    }
    if (QTY <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "QTY harus lebih dari 0" });
    }

    const existing = await ServisSparepart.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Sparepart tidak ditemukan" });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === "Selesai") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa diubah",
        });
    }

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

// Mekanik hapus layanan
const deleteLayanan = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await DetailTransaksiServis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Layanan tidak ditemukan" });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === "Selesai") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa dihapus",
        });
    }

    const layanan = await DetailTransaksiServis.getByServis(existing.IDSERVIS);
    if (layanan.length <= 1) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Minimal harus ada 1 layanan, tidak bisa dihapus",
        });
    }

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

// Mekanik hapus sparepart
const deleteSparepart = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await ServisSparepart.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Sparepart tidak ditemukan" });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === "Selesai") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Servis sudah Selesai, tidak bisa dihapus",
        });
    }

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

// Kasir hapus servis (stok otomatis dikembalikan via servisModel.delete)
const deleteServis = async (req, res) => {
  try {
    const existing = await Servis.getById(req.params.id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
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
