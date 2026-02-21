const KategoriSparepart = require('../models/kategoriSparepartModel');

const getAllKategori = async (req, res) => {
  try {
    const data = await KategoriSparepart.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getKategoriById = async (req, res) => {
  try {
    const data = await KategoriSparepart.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createKategori = async (req, res) => {
  try {
    const { NAMA, KODE } = req.body;
    if (!NAMA || !KODE) {
      return res.status(400).json({ success: false, message: 'NAMA dan KODE wajib diisi' });
    }
    const data = await KategoriSparepart.create(NAMA, KODE);
    res.status(201).json({ success: true, message: 'Kategori berhasil dibuat', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateKategori = async (req, res) => {
  try {
    const { NAMA, KODE } = req.body;
    const existing = await KategoriSparepart.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    const data = await KategoriSparepart.update(req.params.id, NAMA, KODE);
    res.json({ success: true, message: 'Kategori berhasil diupdate', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteKategori = async (req, res) => {
  try {
    const existing = await KategoriSparepart.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }
    await KategoriSparepart.delete(req.params.id);
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllKategori, getKategoriById, createKategori, updateKategori, deleteKategori };