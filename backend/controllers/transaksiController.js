const db = require("../config/db");
const Transaksi = require("../models/transaksiModel");
const Servis = require("../models/servisModel");
const DetailTransaksiServis = require("../models/detailTransaksiServisModel");
const ServisSparepart = require("../models/servisSparepartModel");
const ProgressServis = require("../models/progressServisModel");
const TransaksiPembelianSparepart = require("../models/transaksiPembelianSparepartModel");

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
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan" });

    if (data.JENISTRANSAKSI === "PEMBELIAN") {
      data.ITEMS = await TransaksiPembelianSparepart.getDetailByTransaksi(
        data.IDTRANSAKSI,
      );
    } else if (data.JENISTRANSAKSI === "SERVIS") {
      const [servisRows] = await db.query(
        "SELECT * FROM SERVIS WHERE IDTRANSAKSI = ?",
        [data.IDTRANSAKSI],
      );
      if (servisRows[0]) {
        const servis = servisRows[0];
        servis.LAYANAN = await DetailTransaksiServis.getByServis(
          servis.IDSERVIS,
        );
        servis.SPAREPART = await ServisSparepart.getByServis(servis.IDSERVIS);
        servis.PROGRESS = await ProgressServis.getByServis(servis.IDSERVIS);
        data.SERVIS = servis;
      }
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransaksiByJenis = async (req, res) => {
  try {
    const { jenis } = req.params;
    if (!["SERVIS", "PEMBELIAN"].includes(jenis.toUpperCase())) {
      return res
        .status(400)
        .json({ success: false, message: "JENIS harus SERVIS atau PEMBELIAN" });
    }
    const data = await Transaksi.getByJenis(jenis.toUpperCase());
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /transaksi/filter?startDate=2026-01-01&endDate=2026-01-31&jenis=SERVIS
const getTransaksiByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, jenis } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate dan endDate wajib diisi (format: YYYY-MM-DD)",
      });
    }
    if (jenis && !["SERVIS", "PEMBELIAN"].includes(jenis.toUpperCase())) {
      return res
        .status(400)
        .json({ success: false, message: "jenis harus SERVIS atau PEMBELIAN" });
    }
    const data = await Transaksi.getByDateRange(
      startDate,
      endDate,
      jenis ? jenis.toUpperCase() : null,
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /transaksi/filter-bulan?bulan=2&tahun=2026&jenis=PEMBELIAN
const getTransaksiByBulan = async (req, res) => {
  try {
    const { bulan, tahun, jenis } = req.query;
    if (!bulan || !tahun) {
      return res
        .status(400)
        .json({ success: false, message: "bulan dan tahun wajib diisi" });
    }
    if (isNaN(bulan) || bulan < 1 || bulan > 12) {
      return res
        .status(400)
        .json({ success: false, message: "bulan harus antara 1-12" });
    }
    if (jenis && !["SERVIS", "PEMBELIAN"].includes(jenis.toUpperCase())) {
      return res
        .status(400)
        .json({ success: false, message: "jenis harus SERVIS atau PEMBELIAN" });
    }
    const data = await Transaksi.getByBulan(
      bulan,
      tahun,
      jenis ? jenis.toUpperCase() : null,
    );
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

    // ── Validasi umum ──
    if (!IDUSER_KASIR || !JENISTRANSAKSI) {
      return res.status(400).json({
        success: false,
        message: "IDUSER_KASIR dan JENISTRANSAKSI wajib diisi",
      });
    }
    if (!["SERVIS", "PEMBELIAN"].includes(JENISTRANSAKSI)) {
      return res.status(400).json({
        success: false,
        message: "JENISTRANSAKSI harus SERVIS atau PEMBELIAN",
      });
    }

    // ══════════════════════════════════════════════
    // FLOW SERVIS
    // ══════════════════════════════════════════════
    if (JENISTRANSAKSI === "SERVIS") {
      if (!IDUSER_MEKANIK) {
        return res.status(400).json({
          success: false,
          message: "IDUSER_MEKANIK wajib diisi untuk transaksi SERVIS",
        });
      }
      if (!NAMAPELANGGAN || !KELUHAN) {
        return res.status(400).json({
          success: false,
          message:
            "NAMAPELANGGAN dan KELUHAN wajib diisi untuk transaksi SERVIS",
        });
      }
      if (!LAYANAN || LAYANAN.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Minimal satu LAYANAN wajib diisi untuk transaksi SERVIS",
        });
      }
      for (const item of LAYANAN) {
        if (!item.IDLAYANANSERVIS) {
          return res.status(400).json({
            success: false,
            message: "IDLAYANANSERVIS wajib diisi pada setiap layanan",
          });
        }
      }

      // 1. Buat header TRANSAKSI (IDUSER = kasir)
      const transaksi = await Transaksi.create({
        IDUSER: IDUSER_KASIR,
        JENISTRANSAKSI,
        TOTAL: 0,
        CATATAN: CATATAN || null,
      });

      // 2. Buat record SERVIS (IDUSER = mekanik)
      const servis = await Servis.create({
        IDUSER_MEKANIK,
        IDTRANSAKSI: transaksi.IDTRANSAKSI,
        NAMAPELANGGAN,
        KELUHAN,
      });

      // 3. Insert layanan ke DETAILTRANSAKSISERVIS
      await DetailTransaksiServis.create(servis.IDSERVIS, LAYANAN);

      // 4. Hitung & update TOTAL di TRANSAKSI
      const total = await Servis.updateTotal(servis.IDSERVIS);

      // 5. Catat progress awal (dilakukan terakhir agar IDSERVIS pasti sudah ada)
      await ProgressServis.create(
        servis.IDSERVIS,
        "Belum",
        "Kendaraan masuk, menunggu dikerjakan",
      );

      return res.status(201).json({
        success: true,
        message: "Transaksi servis berhasil dibuat",
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

    // ══════════════════════════════════════════════
    // FLOW PEMBELIAN SPAREPART
    // ══════════════════════════════════════════════
    if (JENISTRANSAKSI === "PEMBELIAN") {
      if (!ITEMS || ITEMS.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Minimal satu ITEMS wajib diisi untuk transaksi PEMBELIAN",
        });
      }
      for (const item of ITEMS) {
        if (!item.IDSPAREPART || !item.JUMLAH) {
          return res.status(400).json({
            success: false,
            message: "IDSPAREPART dan JUMLAH wajib diisi pada setiap item",
          });
        }
        if (item.JUMLAH <= 0) {
          return res
            .status(400)
            .json({ success: false, message: "JUMLAH harus lebih dari 0" });
        }
      }

      // 1. Buat header TRANSAKSI (TOTAL = 0 dulu)
      const transaksi = await Transaksi.create({
        IDUSER: IDUSER_KASIR,
        JENISTRANSAKSI,
        TOTAL: 0,
        CATATAN: CATATAN || null,
      });

      // 2. Insert detail — harga dari master, stok otomatis berkurang
      await TransaksiPembelianSparepart.createDetail(
        transaksi.IDTRANSAKSI,
        ITEMS,
      );

      // 3. Hitung TOTAL dari detail yang baru diinsert
      const [totalRow] = await db.query(
        "SELECT COALESCE(SUM(SUB_TOTAL), 0) as total FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?",
        [transaksi.IDTRANSAKSI],
      );
      const TOTAL = totalRow[0].total;

      // 4. Update TOTAL di header TRANSAKSI
      await db.query("UPDATE TRANSAKSI SET TOTAL = ? WHERE IDTRANSAKSI = ?", [
        TOTAL,
        transaksi.IDTRANSAKSI,
      ]);

      return res.status(201).json({
        success: true,
        message: "Transaksi pembelian sparepart berhasil dibuat",
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

module.exports = {
  getAllTransaksi,
  getTransaksiById,
  getTransaksiByJenis,
  getTransaksiByDateRange,
  getTransaksiByBulan,
  createTransaksi,
};
