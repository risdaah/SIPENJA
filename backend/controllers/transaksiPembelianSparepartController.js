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
    }

    const TOTAL = ITEMS.reduce((sum, item) => sum + item.JUMLAH * item.HARGA_SATUAN, 0);
    const transaksi = await Transaksi.create({ IDUSER, JENISTRANSAKSI: 'PEMBELIAN', TOTAL, CATATAN });
    await TransaksiPembelianSparepart.createDetail(transaksi.IDTRANSAKSI, ITEMS);

    res.status(201).json({
      success: true,
      message: 'Transaksi pembelian sparepart berhasil dibuat',
      data: {
        IDTRANSAKSI: transaksi.IDTRANSAKSI,
        IDUSER: transaksi.IDUSER,
        NOTRANSAKSI: transaksi.NOTRANSAKSI,
        TANGGAL: transaksi.TANGGAL,
        JENISTRANSAKSI: transaksi.JENISTRANSAKSI,
        TOTAL: transaksi.TOTAL,
        CATATAN: transaksi.CATATAN,
        ITEMS,
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

//CRUD KELOLA TRANSAKSI
const updateTransaksiPembelianSparepart = async (req, res) => {
  try {
    const { id } = req.params;
    const { CATATAN } = req.body;

    const existing = await TransaksiPembelianSparepart.getById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Transaksi pembelian sparepart tidak ditemukan' });

    await TransaksiPembelianSparepart.updateCatatan(id, CATATAN);

    res.json({ success: true, message: 'Transaksi pembelian sparepart berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateItemPembelian = async (req, res) => {
  try {
    const { id } = req.params;
    const { JUMLAH, HARGA_SATUAN } = req.body;

    if (!JUMLAH) {
      return res.status(400).json({ success: false, message: 'JUMLAH wajib diisi' });
    }

    const existing = await TransaksiPembelianSparepart.getDetailById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Item tidak ditemukan' });

    const data = await TransaksiPembelianSparepart.updateDetail(id, { JUMLAH, HARGA_SATUAN });

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

    await TransaksiPembelianSparepart.deleteDetail(id);

    res.json({ success: true, message: 'Item pembelian berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getAllTransaksiPembelianSparepart, getTransaksiPembelianSparepartById, 
  createTransaksiPembelianSparepart, 
  updateTransaksiPembelianSparepart, updateItemPembelian,
  deleteItemPembelian, deleteTransaksiPembelianSparepart 
};