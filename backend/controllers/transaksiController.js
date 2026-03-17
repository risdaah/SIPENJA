const db = require("../config/db");
const Transaksi = require("../models/transaksiModel");
const Servis = require("../models/servisModel");
const DetailTransaksiServis = require("../models/detailTransaksiServisModel");
const ServisSparepart = require("../models/servisSparepartModel");
const ProgressServis = require("../models/progressServisModel");
const TransaksiPembelianSparepart = require("../models/transaksiPembelianSparepartModel");

// ── GET ALL ──────────────────────────────────────────────────────────────────
const getAllTransaksi = async (req, res) => {
  try {
    const data = await Transaksi.getAll();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET BY ID (dengan detail lengkap SERVIS / PEMBELIAN) ─────────────────────
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
        const servis = { ...servisRows[0] };
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

// ── GET BY JENIS ─────────────────────────────────────────────────────────────
const getTransaksiByJenis = async (req, res) => {
  try {
    const { jenis } = req.params;
    if (!["SERVIS", "PEMBELIAN"].includes(jenis.toUpperCase()))
      return res
        .status(400)
        .json({ success: false, message: "JENIS harus SERVIS atau PEMBELIAN" });
    const data = await Transaksi.getByJenis(jenis.toUpperCase());
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET BY KASIR ─────────────────────────────────────────────────────────────
const getTransaksiByKasir = async (req, res) => {
  try {
    const idKasir = parseInt(req.params.idKasir, 10);
    if (isNaN(idKasir))
      return res
        .status(400)
        .json({ success: false, message: "idKasir tidak valid" });
    const { jenis } = req.query;
    if (jenis && !["SERVIS", "PEMBELIAN"].includes(jenis.toUpperCase()))
      return res
        .status(400)
        .json({ success: false, message: "jenis harus SERVIS atau PEMBELIAN" });
    const data = await Transaksi.getByKasir(
      idKasir,
      jenis ? jenis.toUpperCase() : null,
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET BY DATE RANGE ────────────────────────────────────────────────────────
const getTransaksiByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, jenis } = req.query;
    if (!startDate || !endDate)
      return res.status(400).json({
        success: false,
        message: "startDate dan endDate wajib diisi (format: YYYY-MM-DD)",
      });
    if (jenis && !["SERVIS", "PEMBELIAN"].includes(jenis.toUpperCase()))
      return res
        .status(400)
        .json({ success: false, message: "jenis harus SERVIS atau PEMBELIAN" });
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

// ── GET BY BULAN ─────────────────────────────────────────────────────────────
const getTransaksiByBulan = async (req, res) => {
  try {
    const { bulan, tahun, jenis } = req.query;
    if (!bulan || !tahun)
      return res
        .status(400)
        .json({ success: false, message: "bulan dan tahun wajib diisi" });
    if (isNaN(bulan) || bulan < 1 || bulan > 12)
      return res
        .status(400)
        .json({ success: false, message: "bulan harus antara 1-12" });
    if (jenis && !["SERVIS", "PEMBELIAN"].includes(jenis.toUpperCase()))
      return res
        .status(400)
        .json({ success: false, message: "jenis harus SERVIS atau PEMBELIAN" });
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

// ── CREATE ───────────────────────────────────────────────────────────────────
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
      NOHP,
    } = req.body;

    if (!IDUSER_KASIR || !JENISTRANSAKSI)
      return res.status(400).json({
        success: false,
        message: "IDUSER_KASIR dan JENISTRANSAKSI wajib diisi",
      });
    if (!["SERVIS", "PEMBELIAN"].includes(JENISTRANSAKSI))
      return res.status(400).json({
        success: false,
        message: "JENISTRANSAKSI harus SERVIS atau PEMBELIAN",
      });

    // ── SERVIS ──
    if (JENISTRANSAKSI === "SERVIS") {
      if (!IDUSER_MEKANIK)
        return res.status(400).json({
          success: false,
          message: "IDUSER_MEKANIK wajib diisi untuk transaksi SERVIS",
        });
      if (!NAMAPELANGGAN || !KELUHAN)
        return res.status(400).json({
          success: false,
          message:
            "NAMAPELANGGAN dan KELUHAN wajib diisi untuk transaksi SERVIS",
        });
      if (!LAYANAN || LAYANAN.length === 0)
        return res.status(400).json({
          success: false,
          message: "Minimal satu LAYANAN wajib diisi untuk transaksi SERVIS",
        });
      for (const item of LAYANAN) {
        if (!item.IDLAYANANSERVIS)
          return res.status(400).json({
            success: false,
            message: "IDLAYANANSERVIS wajib diisi pada setiap layanan",
          });
      }

      const transaksi = await Transaksi.create({
        IDUSER: IDUSER_KASIR,
        JENISTRANSAKSI,
        TOTAL: 0,
        CATATAN: CATATAN || null,
        NOHP: NOHP || null,
      });
      const servis = await Servis.create({
        IDUSER_MEKANIK,
        IDTRANSAKSI: transaksi.IDTRANSAKSI,
        NAMAPELANGGAN,
        KELUHAN,
      });
      await DetailTransaksiServis.create(servis.IDSERVIS, LAYANAN);
      const total = await Servis.updateTotal(servis.IDSERVIS);
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
          NOHP: transaksi.NOHP,
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

    // ── PEMBELIAN ──
    if (JENISTRANSAKSI === "PEMBELIAN") {
      if (!ITEMS || ITEMS.length === 0)
        return res.status(400).json({
          success: false,
          message: "Minimal satu ITEMS wajib diisi untuk transaksi PEMBELIAN",
        });
      for (const item of ITEMS) {
        if (!item.IDSPAREPART || !item.JUMLAH)
          return res.status(400).json({
            success: false,
            message: "IDSPAREPART dan JUMLAH wajib diisi pada setiap item",
          });
        if (item.JUMLAH <= 0)
          return res
            .status(400)
            .json({ success: false, message: "JUMLAH harus lebih dari 0" });
      }

      const transaksi = await Transaksi.create({
        IDUSER: IDUSER_KASIR,
        JENISTRANSAKSI,
        TOTAL: 0,
        CATATAN: CATATAN || null,
        NOHP: NOHP || null,
      });
      await TransaksiPembelianSparepart.createDetail(
        transaksi.IDTRANSAKSI,
        ITEMS,
      );

      const [totalRow] = await db.query(
        "SELECT COALESCE(SUM(SUB_TOTAL), 0) as total FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?",
        [transaksi.IDTRANSAKSI],
      );
      const TOTAL = totalRow[0].total;
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
          NOHP: transaksi.NOHP,
          ITEMS,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET STRUK ─────────────────────────────────────────────────────────────────
const getStrukTransaksi = async (req, res) => {
  try {
    const data = await Transaksi.getStrukById(req.params.id);
    if (!data)
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan" });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── UPDATE NOHP ───────────────────────────────────────────────────────────────
const updateNohpTransaksi = async (req, res) => {
  try {
    const { NOHP } = req.body;
    await Transaksi.updateNohp(req.params.id, NOHP || null);
    res.json({ success: true, message: "Nomor HP berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllTransaksi,
  getTransaksiById,
  getTransaksiByJenis,
  getTransaksiByKasir,
  getTransaksiByDateRange,
  getTransaksiByBulan,
  createTransaksi,
  getStrukTransaksi,
  updateNohpTransaksi,
};
