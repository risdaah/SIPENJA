const Sparepart = require('../models/sparepartModel');

const getAllSparepart = async (req, res) => {
  try {
    const data = await Sparepart.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSparepartById = async (req, res) => {
  try {
    const data = await Sparepart.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Sparepart tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLowStock = async (req, res) => {
  try {
    const data = await Sparepart.getLowStock();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSparepart = async (req, res) => {
  try {
    const { IDKATEGORI, IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL, STOK, STOKMINIMUM } = req.body;
    if (!IDSUPPLIER || !KODESPAREPART || !NAMA || !HARGAJUAL) {
      return res.status(400).json({ success: false, message: 'IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL wajib diisi' });
    }
    const data = await Sparepart.create(req.body);
    res.status(201).json({ success: true, message: 'Sparepart berhasil dibuat', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSparepart = async (req, res) => {
  try {
    const existing = await Sparepart.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Sparepart tidak ditemukan' });
    const data = await Sparepart.update(req.params.id, req.body);
    res.json({ success: true, message: 'Sparepart berhasil diupdate', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSparepart = async (req, res) => {
  try {
    const existing = await Sparepart.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Sparepart tidak ditemukan' });
    await Sparepart.delete(req.params.id);
    res.json({ success: true, message: 'Sparepart berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStok = async (req, res) => {
  try {
    const data = await Sparepart.getStok();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStok = async (req, res) => {
  try {
    const { STOK } = req.body;

    if (STOK === undefined || STOK === null) {
      return res.status(400).json({ success: false, message: 'STOK wajib diisi' });
    }
    if (STOK < 0) {
      return res.status(400).json({ success: false, message: 'STOK tidak boleh minus' });
    }

    const existing = await Sparepart.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Sparepart tidak ditemukan' });

    const data = await Sparepart.updateStok(req.params.id, STOK);
    res.json({ success: true, message: 'Stok berhasil diupdate', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllSparepart, getSparepartById, getLowStock, createSparepart, updateSparepart, deleteSparepart, getStok, updateStok };