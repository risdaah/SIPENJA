const LayananServis = require('../models/layananServisModel');

const getAllLayanan = async (req, res) => {
  try {
    const data = await LayananServis.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLayananById = async (req, res) => {
  try {
    const data = await LayananServis.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createLayanan = async (req, res) => {
  try {
    const { KODELAYANAN, NAMA, BIAYAPOKOK } = req.body;
    if (!KODELAYANAN || !NAMA || !BIAYAPOKOK) {
      return res.status(400).json({ success: false, message: 'KODELAYANAN, NAMA, BIAYAPOKOK wajib diisi' });
    }
    const data = await LayananServis.create(req.body);
    res.status(201).json({ success: true, message: 'Layanan berhasil dibuat', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateLayanan = async (req, res) => {
  try {
    const existing = await LayananServis.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });
    const data = await LayananServis.update(req.params.id, req.body);
    res.json({ success: true, message: 'Layanan berhasil diupdate', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteLayanan = async (req, res) => {
  try {
    const existing = await LayananServis.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });
    await LayananServis.delete(req.params.id);
    res.json({ success: true, message: 'Layanan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllLayanan, getLayananById, createLayanan, updateLayanan, deleteLayanan };