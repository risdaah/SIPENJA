const db = require('../config/db');
const Servis = require('../models/servisModel');
const DetailTransaksiServis = require('../models/detailTransaksiServisModel');
const ServisSparepart = require('../models/servisSparepartModel');
const ProgressServis = require('../models/progressServisModel');

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
    if (!data) return res.status(404).json({ success: false, message: 'Servis tidak ditemukan' });
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
    if (!['Belum', 'Dalam Proses', 'Selesai'].includes(status)) {
      return res.status(400).json({ success: false, message: 'STATUS harus Belum, Dalam Proses, atau Selesai' });
    }
    const data = await Servis.getByStatus(status);
    res.json({ success: true, data });
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

// Kasir update data servis
const updateServis = async (req, res) => {
  try {
    const { id } = req.params;
    const { NAMAPELANGGAN, KELUHAN, CATATAN } = req.body;

    const existing = await Servis.getById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Servis tidak ditemukan' });
    if (existing.STATUS === 'Selesai') {
      return res.status(400).json({ success: false, message: 'Servis sudah Selesai, tidak bisa diubah' });
    }

    const updateData = {};
    if (NAMAPELANGGAN) updateData.NAMAPELANGGAN = NAMAPELANGGAN;
    if (KELUHAN) updateData.KELUHAN = KELUHAN;
    if (Object.keys(updateData).length > 0) await Servis.update(id, updateData);

    if (CATATAN) {
      await db.query('UPDATE TRANSAKSI SET CATATAN = ? WHERE IDTRANSAKSI = ?', [CATATAN, existing.IDTRANSAKSI]);
    }

    res.json({ success: true, message: 'Data servis berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mekanik update progress servis
const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { STATUS, KETERANGAN } = req.body;

    if (!STATUS) {
      return res.status(400).json({ success: false, message: 'STATUS wajib diisi' });
    }
    if (!['Belum', 'Dalam Proses', 'Selesai'].includes(STATUS)) {
      return res.status(400).json({ success: false, message: 'STATUS harus Belum, Dalam Proses, atau Selesai' });
    }

    const existing = await Servis.getById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Servis tidak ditemukan' });
    if (existing.STATUS === 'Selesai') {
      return res.status(400).json({ success: false, message: 'Servis sudah Selesai, tidak bisa diubah' });
    }

    // Update status servis
    await Servis.updateStatus(id, STATUS);

    // Otomatis tambah progress baru
    const progress = await ProgressServis.create(id, STATUS, KETERANGAN || `Status diupdate menjadi ${STATUS}`);

    res.json({ success: true, message: `Progress servis berhasil diupdate menjadi ${STATUS}`, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mekanik tambah sparepart
const addSparepart = async (req, res) => {
  try {
    const { id } = req.params;
    const { ITEMS } = req.body;

    if (!ITEMS || ITEMS.length === 0) {
      return res.status(400).json({ success: false, message: 'ITEMS wajib diisi' });
    }

    const existing = await Servis.getById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Servis tidak ditemukan' });
    if (existing.STATUS === 'Selesai') {
      return res.status(400).json({ success: false, message: 'Tidak bisa menambah sparepart, servis sudah Selesai' });
    }

    await ServisSparepart.create(id, ITEMS);
    const total = await Servis.updateTotal(id);

    res.json({ success: true, message: 'Sparepart berhasil ditambahkan', data: { TOTAL: total, ITEMS } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mekanik tambah layanan baru
const addLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { ITEMS } = req.body;

    if (!ITEMS || ITEMS.length === 0) {
      return res.status(400).json({ success: false, message: 'ITEMS wajib diisi' });
    }

    const existing = await Servis.getById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Servis tidak ditemukan' });
    if (existing.STATUS === 'Selesai') {
      return res.status(400).json({ success: false, message: 'Tidak bisa menambah layanan, servis sudah Selesai' });
    }

    await DetailTransaksiServis.create(id, ITEMS);
    const total = await Servis.updateTotal(id);

    res.json({ success: true, message: 'Layanan berhasil ditambahkan', data: { TOTAL: total, ITEMS } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mekanik update layanan
const updateLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { BIAYA, KETERANGAN } = req.body;

    const existing = await DetailTransaksiServis.getById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === 'Selesai') {
      return res.status(400).json({ success: false, message: 'Servis sudah Selesai, tidak bisa diubah' });
    }

    const data = await DetailTransaksiServis.update(id, { BIAYA, KETERANGAN });
    const total = await Servis.updateTotal(existing.IDSERVIS);

    res.json({ success: true, message: 'Layanan berhasil diupdate', data: { ...data, TOTAL: total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mekanik update sparepart
const updateSparepart = async (req, res) => {
  try {
    const { id } = req.params;
    const { QTY, HARGASATUAN } = req.body;

    if (!QTY || !HARGASATUAN) {
      return res.status(400).json({ success: false, message: 'QTY dan HARGASATUAN wajib diisi' });
    }

    const existing = await ServisSparepart.getById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Sparepart tidak ditemukan' });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === 'Selesai') {
      return res.status(400).json({ success: false, message: 'Servis sudah Selesai, tidak bisa diubah' });
    }

    const data = await ServisSparepart.update(id, { QTY, HARGASATUAN });
    const total = await Servis.updateTotal(existing.IDSERVIS);

    res.json({ success: true, message: 'Sparepart berhasil diupdate', data: { ...data, TOTAL: total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mekanik hapus layanan
const deleteLayanan = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await DetailTransaksiServis.getById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === 'Selesai') {
      return res.status(400).json({ success: false, message: 'Servis sudah Selesai, tidak bisa dihapus' });
    }

    const layanan = await DetailTransaksiServis.getByServis(existing.IDSERVIS);
    if (layanan.length <= 1) {
      return res.status(400).json({ success: false, message: 'Minimal harus ada 1 layanan, tidak bisa dihapus' });
    }

    await DetailTransaksiServis.deleteById(id);
    const total = await Servis.updateTotal(existing.IDSERVIS);

    res.json({ success: true, message: 'Layanan berhasil dihapus', data: { TOTAL: total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mekanik hapus sparepart
const deleteSparepart = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await ServisSparepart.getById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Sparepart tidak ditemukan' });

    const servis = await Servis.getById(existing.IDSERVIS);
    if (servis.STATUS === 'Selesai') {
      return res.status(400).json({ success: false, message: 'Servis sudah Selesai, tidak bisa dihapus' });
    }

    await ServisSparepart.deleteById(id);
    const total = await Servis.updateTotal(existing.IDSERVIS);

    res.json({ success: true, message: 'Sparepart berhasil dihapus', data: { TOTAL: total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Kasir hapus servis
const deleteServis = async (req, res) => {
  try {
    const existing = await Servis.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Servis tidak ditemukan' });
    await Servis.delete(req.params.id);
    res.json({ success: true, message: 'Servis berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllServis, getServisById, getServisByStatus, getServisByMekanik,
  addSparepart, addLayanan,
  updateServis, updateLayanan, updateSparepart, updateProgress,
  deleteLayanan, deleteSparepart, deleteServis
};