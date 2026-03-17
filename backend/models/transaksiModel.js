const db = require("../config/db");

const Transaksi = {
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT t.*, u.NAMA as NAMA_KASIR, s.IDSERVIS
      FROM TRANSAKSI t
      LEFT JOIN USER u ON t.IDUSER = u.IDUSER
      LEFT JOIN SERVIS s ON s.IDTRANSAKSI = t.IDTRANSAKSI
      ORDER BY t.TANGGAL DESC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT t.*, u.NAMA as NAMA_KASIR
       FROM TRANSAKSI t
       LEFT JOIN USER u ON t.IDUSER = u.IDUSER
       WHERE t.IDTRANSAKSI = ?`,
      [id],
    );
    return rows[0];
  },

  // Data lengkap untuk cetak struk PDF
  getStrukById: async (id) => {
    const [trxRows] = await db.query(
      `SELECT t.*, u.NAMA as NAMA_KASIR
       FROM TRANSAKSI t
       LEFT JOIN USER u ON t.IDUSER = u.IDUSER
       WHERE t.IDTRANSAKSI = ?`,
      [id],
    );
    if (!trxRows[0]) return null;
    const transaksi = trxRows[0];

    if (transaksi.JENISTRANSAKSI === "SERVIS") {
      const [servisRows] = await db.query(
        `SELECT s.*, u.NAMA as NAMA_MEKANIK
         FROM SERVIS s
         LEFT JOIN USER u ON s.IDUSER = u.IDUSER
         WHERE s.IDTRANSAKSI = ?`,
        [id],
      );
      transaksi.SERVIS = servisRows[0] || null;

      if (transaksi.SERVIS) {
        const [layananRows] = await db.query(
          `SELECT d.*, l.NAMA as NAMA_LAYANAN, l.KODELAYANAN
           FROM DETAILTRANSAKSISERVIS d
           LEFT JOIN LAYANANSERVIS l ON d.IDLAYANANSERVIS = l.IDLAYANANSERVIS
           WHERE d.IDSERVIS = ?`,
          [transaksi.SERVIS.IDSERVIS],
        );
        transaksi.LAYANAN = layananRows;

        const [sparepartRows] = await db.query(
          `SELECT ss.*, sp.NAMA as NAMA_SPAREPART, sp.KODESPAREPART
           FROM SERVISSPAREPART ss
           LEFT JOIN SPAREPART sp ON ss.IDSPAREPART = sp.IDSPAREPART
           WHERE ss.IDSERVIS = ?`,
          [transaksi.SERVIS.IDSERVIS],
        );
        transaksi.SPAREPART = sparepartRows;
      }
    } else if (transaksi.JENISTRANSAKSI === "PEMBELIAN") {
      const [beliRows] = await db.query(
        `SELECT tp.*, sp.NAMA as NAMA_SPAREPART, sp.KODESPAREPART
         FROM TRANSAKSIPEMBELIANSPAREPART tp
         LEFT JOIN SPAREPART sp ON tp.IDSPAREPART = sp.IDSPAREPART
         WHERE tp.IDTRANSAKSI = ?`,
        [id],
      );
      transaksi.ITEMS = beliRows;
    }

    return transaksi;
  },

  getByKasir: async (idUser, jenis = null) => {
    let query = `
      SELECT t.*, u.NAMA as NAMA_KASIR
      FROM TRANSAKSI t
      LEFT JOIN USER u ON t.IDUSER = u.IDUSER
      WHERE t.IDUSER = ?
    `;
    const params = [idUser];
    if (jenis) {
      query += " AND t.JENISTRANSAKSI = ?";
      params.push(jenis);
    }
    query += " ORDER BY t.TANGGAL DESC";
    const [rows] = await db.query(query, params);
    return rows;
  },

  getByJenis: async (jenis) => {
    const [rows] = await db.query(
      `SELECT t.*, u.NAMA as NAMA_KASIR
       FROM TRANSAKSI t
       LEFT JOIN USER u ON t.IDUSER = u.IDUSER
       WHERE t.JENISTRANSAKSI = ?
       ORDER BY t.TANGGAL DESC`,
      [jenis],
    );
    return rows;
  },

  getByDateRange: async (startDate, endDate, jenis = null) => {
    let query = `
      SELECT t.*, u.NAMA as NAMA_KASIR
      FROM TRANSAKSI t
      LEFT JOIN USER u ON t.IDUSER = u.IDUSER
      WHERE DATE(t.TANGGAL) BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];
    if (jenis) {
      query += " AND t.JENISTRANSAKSI = ?";
      params.push(jenis);
    }
    query += " ORDER BY t.TANGGAL DESC";
    const [rows] = await db.query(query, params);
    return rows;
  },

  getByBulan: async (bulan, tahun, jenis = null) => {
    let query = `
      SELECT t.*, u.NAMA as NAMA_KASIR
      FROM TRANSAKSI t
      LEFT JOIN USER u ON t.IDUSER = u.IDUSER
      WHERE MONTH(t.TANGGAL) = ? AND YEAR(t.TANGGAL) = ?
    `;
    const params = [bulan, tahun];
    if (jenis) {
      query += " AND t.JENISTRANSAKSI = ?";
      params.push(jenis);
    }
    query += " ORDER BY t.TANGGAL DESC";
    const [rows] = await db.query(query, params);
    return rows;
  },

  generateNoTransaksi: async (JENISTRANSAKSI) => {
    const prefix = JENISTRANSAKSI === "SERVIS" ? "TRX-SRV" : "TRX-PBL";
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const [lastRow] = await db.query(
      `SELECT COUNT(*) as total FROM TRANSAKSI
       WHERE JENISTRANSAKSI = ? AND DATE(TANGGAL) = CURDATE()`,
      [JENISTRANSAKSI],
    );
    const count = (lastRow[0].total || 0) + 1;
    const sequence = String(count).padStart(3, "0");
    return `${prefix}-${dateStr}-${sequence}`;
  },

  create: async (data) => {
    const { IDUSER, JENISTRANSAKSI, TOTAL, CATATAN, NOHP } = data;
    const [lastRow] = await db.query(
      "SELECT MAX(IDTRANSAKSI) as lastId FROM TRANSAKSI",
    );
    const newId = (lastRow[0].lastId || 0) + 1;
    const NOTRANSAKSI = await Transaksi.generateNoTransaksi(JENISTRANSAKSI);
    const now = new Date();
    await db.query(
      `INSERT INTO TRANSAKSI (IDTRANSAKSI, IDUSER, NOTRANSAKSI, TANGGAL, JENISTRANSAKSI, TOTAL, CATATAN, NOHP)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        IDUSER,
        NOTRANSAKSI,
        now,
        JENISTRANSAKSI,
        TOTAL || 0,
        CATATAN || null,
        NOHP || null,
      ],
    );
    return {
      IDTRANSAKSI: newId,
      IDUSER,
      NOTRANSAKSI,
      TANGGAL: now,
      JENISTRANSAKSI,
      TOTAL: TOTAL || 0,
      CATATAN: CATATAN || null,
      NOHP: NOHP || null,
    };
  },

  updateNohp: async (id, nohp) => {
    await db.query("UPDATE TRANSAKSI SET NOHP = ? WHERE IDTRANSAKSI = ?", [
      nohp || null,
      id,
    ]);
  },

  delete: async (id) => {
    await db.query("DELETE FROM TRANSAKSI WHERE IDTRANSAKSI = ?", [id]);
  },
};

module.exports = Transaksi;
