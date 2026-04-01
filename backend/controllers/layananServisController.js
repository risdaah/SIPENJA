/**
 * controllers/layananServisController.js — Controller layanan servis
 *
 * Layanan servis adalah jenis-jenis pekerjaan bengkel beserta biaya pokoknya
 * (contoh: Ganti Oli - Rp 50.000, Tune Up - Rp 150.000, Balancing - Rp 75.000).
 *
 * Saat kasir membuat transaksi servis, satu atau lebih layanan dipilih.
 * Biaya dari master layanan digunakan sebagai default, tapi mekanik bisa
 * mengubahnya (update BIAYA di DetailTransaksiServis) untuk kasus khusus.
 */

const LayananServis = require('../models/layananServisModel');

// Ambil semua layanan — dipakai untuk dropdown saat input transaksi servis
const getAllLayanan = async (req, res) => {
  try {
    const data = await LayananServis.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Ambil satu layanan berdasarkan ID
const getLayananById = async (req, res) => {
  try {
    const data = await LayananServis.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Layanan tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Tambah layanan baru — KODELAYANAN, NAMA, dan BIAYAPOKOK wajib diisi
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

// Edit layanan
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

// Hapus layanan
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
