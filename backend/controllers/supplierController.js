/**
 * controllers/supplierController.js — Controller data supplier
 *
 * Supplier adalah pemasok/vendor yang menyediakan sparepart ke bengkel.
 * Data supplier digunakan untuk:
 *   - Menandai asal sparepart (setiap sparepart punya IDSUPPLIER)
 *   - Referensi kontak saat perlu restock
 */

const Supplier = require('../models/supplierModel');

// Ambil semua supplier
const getAllSupplier = async (req, res) => {
  try {
    const data = await Supplier.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ambil satu supplier berdasarkan ID
const getSupplierById = async (req, res) => {
  try {
    const data = await Supplier.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tambah supplier baru — NAMA dan NOHP wajib diisi
const createSupplier = async (req, res) => {
  try {
    const { NAMA, NOHP } = req.body;
    if (!NAMA || !NOHP) {
      return res.status(400).json({ success: false, message: 'NAMA dan NOHP wajib diisi' });
    }
    const data = await Supplier.create(req.body);
    res.status(201).json({ success: true, message: 'Supplier berhasil dibuat', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit data supplier
const updateSupplier = async (req, res) => {
  try {
    const existing = await Supplier.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });

    const data = await Supplier.update(req.params.id, req.body);
    res.json({ success: true, message: 'Supplier berhasil diupdate', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hapus supplier
const deleteSupplier = async (req, res) => {
  try {
    const existing = await Supplier.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan' });

    await Supplier.delete(req.params.id);
    res.json({ success: true, message: 'Supplier berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllSupplier, getSupplierById, createSupplier, updateSupplier, deleteSupplier };
