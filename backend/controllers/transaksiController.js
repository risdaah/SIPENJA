const db = require('../config/db');
const Transaksi = require('../models/transaksiModel');
const Servis = require('../models/servisModel');
const DetailTransaksiServis = require('../models/detailTransaksiServisModel');
const ProgressServis = require('../models/progressServisModel');
const TransaksiPembelianSparepart = require('../models/transaksiPembelianSparepartModel');

const getAllTransaksi = async (req, res) => {
  try {
    const data = await Transaksi.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransaksiById = async (req, res) => {
  try {
    const data = await Transaksi.getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransaksiByJenis = async (req, res) => {
  try {
    const { jenis } = req.params;
    if (!['SERVIS', 'PEMBELIAN'].includes(jenis.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'JENIS harus SERVIS atau PEMBELIAN' });
    }
    const data = await Transaksi.getByJenis(jenis.toUpperCase());
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createTransaksi = async (req, res) => {
  try {
    const {
      IDUSER_KASIR,
      IDUSER_MEKANIK,
      JENISTRANSAKSI,
      CATATAN,
      NAMAPELANGGAN,
      KELUHAN,
      LAYANAN,
      ITEMS,
    } = req.body;

    // Validasi umum
    if (!IDUSER_KASIR || !JENISTRANSAKSI) {
      return res.status(400).json({ success: false, message: 'IDUSER_KASIR dan JENISTRANSAKSI wajib diisi' });
    }
    if (!['SERVIS', 'PEMBELIAN'].includes(JENISTRANSAKSI)) {
      return res.status(400).json({ success: false, message: 'JENISTRANSAKSI harus SERVIS atau PEMBELIAN' });
    }

    // ==============================
    // FLOW SERVIS
    // ==============================
    if (JENISTRANSAKSI === 'SERVIS') {
      if (!IDUSER_MEKANIK) {
        return res.status(400).json({ success: false, message: 'IDUSER_MEKANIK wajib diisi untuk transaksi SERVIS' });
      }
      if (!NAMAPELANGGAN || !KELUHAN) {
        return res.status(400).json({ success: false, message: 'NAMAPELANGGAN dan KELUHAN wajib diisi untuk transaksi SERVIS' });
      }
      if (!LAYANAN || LAYANAN.length === 0) {
        return res.status(400).json({ success: false, message: 'Minimal satu LAYANAN wajib diisi untuk transaksi SERVIS' });
      }
      for (const item of LAYANAN) {
        if (!item.IDLAYANANSERVIS) {
          return res.status(400).json({ success: false, message: 'IDLAYANANSERVIS wajib diisi pada setiap layanan' });
        }
      }

      // Create TRANSAKSI (IDUSER = kasir)
      const transaksi = await Transaksi.create({ IDUSER: IDUSER_KASIR, JENISTRANSAKSI, TOTAL: 0, CATATAN });

      // Create SERVIS (IDUSER = mekanik)
      const servis = await Servis.create({ IDUSER_MEKANIK, IDTRANSAKSI: transaksi.IDTRANSAKSI, NAMAPELANGGAN, KELUHAN });

      // Create DETAILTRANSAKSISERVIS (biaya otomatis dari master)
      await DetailTransaksiServis.create(servis.IDSERVIS, LAYANAN);

      // Create PROGRESSSERVIS awal
      await ProgressServis.create(servis.IDSERVIS, 'Belum', 'Servis baru masuk');

      // Hitung TOTAL otomatis dari master
      const total = await Servis.updateTotal(servis.IDSERVIS);

      return res.status(201).json({
        success: true,
        message: 'Transaksi servis berhasil dibuat',
        data: {
          IDTRANSAKSI: transaksi.IDTRANSAKSI,
          NOTRANSAKSI: transaksi.NOTRANSAKSI,
          JENISTRANSAKSI: transaksi.JENISTRANSAKSI,
          TANGGAL: transaksi.TANGGAL,
          TOTAL: total,
          CATATAN: transaksi.CATATAN,
          SERVIS: {
            IDSERVIS: servis.IDSERVIS,
            KODEANTRIAN: servis.KODEANTRIAN,
            IDUSER_MEKANIK: servis.IDUSER,
            NAMAPELANGGAN: servis.NAMAPELANGGAN,
            KELUHAN: servis.KELUHAN,
            STATUS: servis.STATUS,
            TANGGALMASUK: servis.TANGGALMASUK,
            LAYANAN,
          },
        },
      });
    }

    // ==============================
    // FLOW PEMBELIAN
    // ==============================
    if (JENISTRANSAKSI === 'PEMBELIAN') {
      if (!ITEMS || ITEMS.length === 0) {
        return res.status(400).json({ success: false, message: 'Minimal satu ITEMS wajib diisi untuk transaksi PEMBELIAN' });
      }
      for (const item of ITEMS) {
        if (!item.IDSPAREPART || !item.JUMLAH) {
          return res.status(400).json({ success: false, message: 'IDSPAREPART dan JUMLAH wajib diisi pada setiap item' });
        }
      }

      // Create TRANSAKSI (TOTAL = 0 dulu, akan diupdate setelah detail dibuat)
      const transaksi = await Transaksi.create({ IDUSER: IDUSER_KASIR, JENISTRANSAKSI, TOTAL: 0, CATATAN });

      // Create TRANSAKSIPEMBELIANSPAREPART (harga otomatis dari master, stok otomatis naik)
      await TransaksiPembelianSparepart.createDetail(transaksi.IDTRANSAKSI, ITEMS);

      // Ambil TOTAL yang sudah dihitung dari master
      const [totalRow] = await db.query(
        'SELECT COALESCE(SUM(SUB_TOTAL), 0) as total FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?',
        [transaksi.IDTRANSAKSI]
      );
      const TOTAL = totalRow[0].total;

      // Update TOTAL di TRANSAKSI
      await db.query('UPDATE TRANSAKSI SET TOTAL = ? WHERE IDTRANSAKSI = ?', [TOTAL, transaksi.IDTRANSAKSI]);

      return res.status(201).json({
        success: true,
        message: 'Transaksi pembelian sparepart berhasil dibuat',
        data: {
          IDTRANSAKSI: transaksi.IDTRANSAKSI,
          NOTRANSAKSI: transaksi.NOTRANSAKSI,
          JENISTRANSAKSI: transaksi.JENISTRANSAKSI,
          TANGGAL: transaksi.TANGGAL,
          TOTAL,
          CATATAN: transaksi.CATATAN,
          ITEMS,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAllTransaksi, getTransaksiById, getTransaksiByJenis, createTransaksi };