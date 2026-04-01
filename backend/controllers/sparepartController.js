/**
 * controllers/sparepartController.js — Controller data sparepart
 *
 * Mengelola data suku cadang/barang yang dijual atau digunakan untuk servis.
 * Stok dikelola secara otomatis:
 *   - Berkurang saat sparepart dipakai di servis (ServisSparepart.create)
 *   - Berkurang saat pelanggan membeli (TransaksiPembelianSparepart.createDetail)
 *   - Bertambah saat pengisian stok dicatat lewat pengeluaranController.tambahStok
 *   - Dikembalikan saat transaksi/servis dihapus
 */

const Sparepart = require('../models/sparepartModel');

// ── GET ALL ──────────────────────────────────────────────────────────────────
// Mengembalikan semua sparepart beserta nama kategori dan nama supplier (JOIN di model)
const getAllSparepart = async (req, res) => {
  try {
    const data = await Sparepart.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET BY ID ────────────────────────────────────────────────────────────────
const getSparepartById = async (req, res) => {
  try {
    const data = await Sparepart.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Sparepart tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET LOW STOCK ─────────────────────────────────────────────────────────────
// Mengembalikan sparepart yang STOK < STOKMINIMUM
// Digunakan untuk notifikasi di panel admin / topbar
const getLowStock = async (req, res) => {
  try {
    const data = await Sparepart.getLowStock();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE ───────────────────────────────────────────────────────────────────
const createSparepart = async (req, res) => {
  try {
    const { IDKATEGORI, IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL, STOK, STOKMINIMUM } = req.body;

    // Field wajib — IDKATEGORI opsional (bisa NULL)
    if (!IDSUPPLIER || !KODESPAREPART || !NAMA || !HARGAJUAL) {
      return res.status(400).json({ success: false, message: 'IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL wajib diisi' });
    }

    const data = await Sparepart.create(req.body);
    res.status(201).json({ success: true, message: 'Sparepart berhasil dibuat', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
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

// ── DELETE ───────────────────────────────────────────────────────────────────
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

// ── GET STOK (untuk dropdown) ────────────────────────────────────────────────
// Mengembalikan hanya kolom ID, kode, nama, dan stok — lebih ringan dari getAll
// Dipakai di frontend sebagai pilihan dropdown saat input transaksi
const getStok = async (req, res) => {
  try {
    const data = await Sparepart.getStok();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE STOK (koreksi manual) ─────────────────────────────────────────────
// Override nilai stok secara langsung — berbeda dengan tambahStok di pengeluaran
// yang menambahkan nilai (STOK + QTY). Ini meng-SET stok ke nilai baru.
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
