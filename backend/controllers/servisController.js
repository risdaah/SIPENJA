const db = require("../config/db");
const Servis = require("../models/servisModel");
const DetailTransaksiServis = require("../models/detailTransaksiServisModel");
const ServisSparepart = require("../models/servisSparepartModel");
const ProgressServis = require("../models/progressServisModel");

/* ─────────────────────────────────────────────
   GET
───────────────────────────────────────────── */
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
      return res.status(400).json({
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

// ── DIPERBARUI: sertakan LAYANAN per servis ──────────────────────────────────
const getServisByMekanik = async (req, res) => {
  try {
    const idMekanik = parseInt(req.params.idMekanik, 10);

    console.log(
      "[getServisByMekanik] idMekanik (parsed):",
      idMekanik,
      typeof idMekanik,
    );

    if (isNaN(idMekanik)) {
      return res
        .status(400)
        .json({ success: false, message: "idMekanik tidak valid" });
    }

    const list = await Servis.getByMekanik(idMekanik);

    console.log("[getServisByMekanik] jumlah servis ditemukan:", list.length);

    const data = await Promise.all(
      list.map(async (s) => {
        const plain = { ...s };
        plain.LAYANAN = await DetailTransaksiServis.getByServis(s.IDSERVIS);
        console.log(
          "[getServisByMekanik] IDSERVIS:",
          s.IDSERVIS,
          "-> LAYANAN count:",
          plain.LAYANAN.length,
        );
        return plain;
      }),
    );

    res.json({ success: true, data });
  } catch (error) {
    console.error("[getServisByMekanik] ERROR:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

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

/* ─────────────────────────────────────────────
   UPDATE PROGRESS
   
   Body:
   {
     STATUS      : 'Belum' | 'Dalam Proses' | 'Selesai'  (wajib)
     KETERANGAN  : string                                  (opsional)
     SPAREPART   : [{ IDSPAREPART, QTY }]                 (opsional)
     LAYANAN     : [{ IDLAYANANSERVIS }]                   (opsional)
   }
───────────────────────────────────────────── */
const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { STATUS, KETERANGAN, SPAREPART, LAYANAN } = req.body;

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

    if (SPAREPART && SPAREPART.length > 0) {
      for (const item of SPAREPART) {
        if (!item.IDSPAREPART || !item.QTY || item.QTY <= 0) {
          return res.status(400).json({
            success: false,
            message:
              "IDSPAREPART dan QTY (> 0) wajib diisi pada setiap sparepart",
          });
        }
      }
    }

    if (LAYANAN && LAYANAN.length > 0) {
      for (const item of LAYANAN) {
        if (!item.IDLAYANANSERVIS) {
          return res.status(400).json({
            success: false,
            message: "IDLAYANANSERVIS wajib diisi pada setiap layanan",
          });
        }
      }
    }

    // 1. Update STATUS servis
    await Servis.updateStatus(id, STATUS);

    // 2. Tambah sparepart yang dipakai (jika ada)
    if (SPAREPART && SPAREPART.length > 0) {
      await ServisSparepart.create(id, SPAREPART);
    }

    // 3. Tambah layanan tambahan (jika ada)
    if (LAYANAN && LAYANAN.length > 0) {
      await DetailTransaksiServis.create(id, LAYANAN);
    }

    // 4. Recalculate total transaksi
    const total = await Servis.updateTotal(id);

    // 5. Catat progress baru
    const keterangan = KETERANGAN || defaultKeterangan(STATUS);
    const progress = await ProgressServis.create(id, STATUS, keterangan);

    // 6. Ambil data terbaru untuk response
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

function defaultKeterangan(STATUS) {
  const map = {
    Belum: "Kendaraan masuk, menunggu dikerjakan",
    "Dalam Proses": "Kendaraan sedang dikerjakan",
    Selesai: "Kendaraan selesai dikerjakan dan siap diambil",
  };
  return map[STATUS] || `Status diupdate menjadi ${STATUS}`;
}

/* ─────────────────────────────────────────────
   ADD SPAREPART (standalone)
───────────────────────────────────────────── */
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
      if (!item.IDSPAREPART || !item.QTY || item.QTY <= 0) {
        return res.status(400).json({
          success: false,
          message: "IDSPAREPART dan QTY (> 0) wajib diisi",
        });
      }
    }

    const existing = await Servis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    if (existing.STATUS === "Selesai") {
      return res.status(400).json({
        success: false,
        message: "Tidak bisa menambah sparepart, servis sudah Selesai",
      });
    }

    await ServisSparepart.create(id, ITEMS);
    const total = await Servis.updateTotal(id);

    res.json({
      success: true,
      message: "Sparepart berhasil ditambahkan",
      data: { TOTAL: total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────
   ADD LAYANAN (standalone)
───────────────────────────────────────────── */
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
          .json({ success: false, message: "IDLAYANANSERVIS wajib diisi" });
      }
    }

    const existing = await Servis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    if (existing.STATUS === "Selesai") {
      return res.status(400).json({
        success: false,
        message: "Tidak bisa menambah layanan, servis sudah Selesai",
      });
    }

    await DetailTransaksiServis.create(id, ITEMS);
    const total = await Servis.updateTotal(id);

    res.json({
      success: true,
      message: "Layanan berhasil ditambahkan",
      data: { TOTAL: total },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────
   UPDATE (kasir)
───────────────────────────────────────────── */
const updateServis = async (req, res) => {
  try {
    const { id } = req.params;
    const { NAMAPELANGGAN, KELUHAN, CATATAN } = req.body;

    if (!NAMAPELANGGAN && !KELUHAN && CATATAN === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Minimal satu field harus diisi" });
    }

    const existing = await Servis.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Servis tidak ditemukan" });
    if (existing.STATUS === "Selesai") {
      return res.status(400).json({
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

/* ─────────────────────────────────────────────
   UPDATE LAYANAN & SPAREPART (individual)
───────────────────────────────────────────── */
const updateLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { BIAYA, KETERANGAN } = req.body;

    if (BIAYA === undefined && KETERANGAN === undefined) {
      return res.status(400).json({
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
      return res.status(400).json({
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

const updateSparepart = async (req, res) => {
  try {
    const { id } = req.params;
    const { QTY } = req.body;

    if (!QTY || QTY <= 0) {
      return res.status(400).json({
        success: false,
        message: "QTY wajib diisi dan harus lebih dari 0",
      });
    }

    const existing = await ServisSparepart.getById(id);
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Sparepart tidak ditemukan" });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === "Selesai") {
      return res.status(400).json({
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

/* ─────────────────────────────────────────────
   DELETE
───────────────────────────────────────────── */
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
      return res.status(400).json({
        success: false,
        message: "Servis sudah Selesai, tidak bisa dihapus",
      });
    }

    const layanan = await DetailTransaksiServis.getByServis(existing.IDSERVIS);
    if (layanan.length <= 1) {
      return res
        .status(400)
        .json({ success: false, message: "Minimal harus ada 1 layanan" });
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
      return res.status(400).json({
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
