const db = require('../config/db');
const TransaksiPembelianSparepart = require('../models/transaksiPembelianSparepartModel');
const Transaksi = require('../models/transaksiModel');

const getAllTransaksiPembelianSparepart = async (req, res) => {
  try {
    const data = await TransaksiPembelianSparepart.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransaksiPembelianSparepartById = async (req, res) => {
  try {
    const data = await TransaksiPembelianSparepart.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Transaksi pembelian sparepart tidak ditemukan' });
    data.ITEMS = await TransaksiPembelianSparepart.getDetailByTransaksi(data.IDTRANSAKSI);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Filter by rentang tanggal
// GET /pembelian-sparepart/filter?startDate=2026-01-01&endDate=2026-01-31
const getTransaksiPembelianByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate dan endDate wajib diisi (format: YYYY-MM-DD)' });
    }
    const data = await TransaksiPembelianSparepart.getByDateRange(startDate, endDate);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTransaksiPembelianSparepart = async (req, res) => {
  try {
    const { IDUSER, CATATAN, ITEMS } = req.body;

    if (!IDUSER) {
      return res.status(400).json({ success: false, message: 'IDUSER wajib diisi' });
    }
    if (!ITEMS || ITEMS.length === 0) {
      return res.status(400).json({ success: false, message: 'Minimal satu ITEMS wajib diisi' });
    }
    for (const item of ITEMS) {
      if (!item.IDSPAREPART || !item.JUMLAH) {
        return res.status(400).json({ success: false, message: 'IDSPAREPART dan JUMLAH wajib diisi pada setiap item' });
      }
      if (item.JUMLAH <= 0) {
        return res.status(400).json({ success: false, message: 'JUMLAH harus lebih dari 0' });
      }
    }

    // Create transaksi header dulu
    const transaksi = await Transaksi.create({ IDUSER, JENISTRANSAKSI: 'PEMBELIAN', TOTAL: 0, CATATAN });

    // Create detail (harga dari master, stok berkurang otomatis)
    await TransaksiPembelianSparepart.createDetail(transaksi.IDTRANSAKSI, ITEMS);

    // Ambil detail yang sudah dibuat untuk response
    const itemsWithDetail = await TransaksiPembelianSparepart.getDetailByTransaksi(transaksi.IDTRANSAKSI);
    const TOTAL = itemsWithDetail.reduce((sum, item) => sum + Number(item.SUB_TOTAL), 0);

    // Update TOTAL di transaksi
    await db.query('UPDATE TRANSAKSI SET TOTAL = ? WHERE IDTRANSAKSI = ?', [TOTAL, transaksi.IDTRANSAKSI]);

    res.status(201).json({
      success: true,
      message: 'Transaksi pembelian sparepart berhasil dibuat',
      data: {
        IDTRANSAKSI: transaksi.IDTRANSAKSI,
        IDUSER: transaksi.IDUSER,
        NOTRANSAKSI: transaksi.NOTRANSAKSI,
        TANGGAL: transaksi.TANGGAL,
        JENISTRANSAKSI: transaksi.JENISTRANSAKSI,
        TOTAL,
        CATATAN: transaksi.CATATAN,
        ITEMS: itemsWithDetail,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTransaksiPembelianSparepart = async (req, res) => {
  try {
    const existing = await TransaksiPembelianSparepart.getById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Transaksi pembelian sparepart tidak ditemukan' });
    await TransaksiPembelianSparepart.delete(req.params.id);
    res.json({ success: true, message: 'Transaksi pembelian sparepart berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update catatan transaksi
const updateTransaksiPembelianSparepart = async (req, res) => {
  try {
    const { id } = req.params;
    const { CATATAN } = req.body;

    if (CATATAN === undefined) {
      return res.status(400).json({ success: false, message: 'CATATAN wajib diisi' });
    }

    const existing = await TransaksiPembelianSparepart.getById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Transaksi pembelian sparepart tidak ditemukan' });

    await TransaksiPembelianSparepart.updateCatatan(id, CATATAN);

    res.json({ success: true, message: 'Catatan transaksi berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update jumlah item pembelian (harga tetap dari DB, stok auto adjust)
const updateItemPembelian = async (req, res) => {
  try {
    const { id } = req.params;
    const { JUMLAH } = req.body;

    if (!JUMLAH) {
      return res.status(400).json({ success: false, message: 'JUMLAH wajib diisi' });
    }
    if (JUMLAH <= 0) {
      return res.status(400).json({ success: false, message: 'JUMLAH harus lebih dari 0' });
    }

    const existing = await TransaksiPembelianSparepart.getDetailById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });

    const data = await TransaksiPembelianSparepart.updateDetail(id, { JUMLAH });

    res.json({ success: true, message: 'Item pembelian berhasil diupdate', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteItemPembelian = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await TransaksiPembelianSparepart.getDetailById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });

    // Cek apakah ini item terakhir — transaksi tidak boleh kosong tanpa item
    const semuaItem = await TransaksiPembelianSparepart.getDetailByTransaksi(existing.IDTRANSAKSI);
    if (semuaItem.length <= 1) {
      return res.status(400).json({ success: false, message: 'Minimal harus ada 1 item. Hapus transaksi jika ingin membatalkan seluruhnya.' });
    }

    await TransaksiPembelianSparepart.deleteDetail(id);

    res.json({ success: true, message: 'Item pembelian berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllTransaksiPembelianSparepart, getTransaksiPembelianSparepartById,
  getTransaksiPembelianByDateRange,
  createTransaksiPembelianSparepart,
  updateTransaksiPembelianSparepart, updateItemPembelian,
  deleteItemPembelian, deleteTransaksiPembelianSparepart,
};