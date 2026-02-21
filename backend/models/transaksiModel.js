const db = require('../config/db');

const Transaksi = {
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT t.*, u.NAMA as NAMA_KASIR
      FROM TRANSAKSI t
      LEFT JOIN USER u ON t.IDUSER = u.IDUSER
      ORDER BY t.TANGGAL DESC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(`
      SELECT t.*, u.NAMA as NAMA_KASIR
      FROM TRANSAKSI t
      LEFT JOIN USER u ON t.IDUSER = u.IDUSER
      WHERE t.IDTRANSAKSI = ?
    `, [id]);
    return rows[0];
  },

  getByJenis: async (jenis) => {
    const [rows] = await db.query(`
      SELECT t.*, u.NAMA as NAMA_KASIR
      FROM TRANSAKSI t
      LEFT JOIN USER u ON t.IDUSER = u.IDUSER
      WHERE t.JENISTRANSAKSI = ?
      ORDER BY t.TANGGAL DESC
    `, [jenis]);
    return rows;
  },

  generateNoTransaksi: async (JENISTRANSAKSI) => {
    const prefix = JENISTRANSAKSI === 'SERVIS' ? 'TRX-SRV' : 'TRX-PBL';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [lastRow] = await db.query(
      `SELECT COUNT(*) as total FROM TRANSAKSI 
       WHERE JENISTRANSAKSI = ? AND DATE(TANGGAL) = CURDATE()`,
      [JENISTRANSAKSI]
    );
    const count = (lastRow[0].total || 0) + 1;
    const sequence = String(count).padStart(3, '0');
    return `${prefix}-${dateStr}-${sequence}`;
  },

  create: async (data) => {
    const { IDUSER, JENISTRANSAKSI, TOTAL, CATATAN } = data;
    const [lastRow] = await db.query('SELECT MAX(IDTRANSAKSI) as lastId FROM TRANSAKSI');
    const newId = (lastRow[0].lastId || 0) + 1;
    const NOTRANSAKSI = await Transaksi.generateNoTransaksi(JENISTRANSAKSI);
    const now = new Date();
    await db.query(
      `INSERT INTO TRANSAKSI (IDTRANSAKSI, IDUSER, NOTRANSAKSI, TANGGAL, JENISTRANSAKSI, TOTAL, CATATAN)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newId, IDUSER, NOTRANSAKSI, now, JENISTRANSAKSI, TOTAL || 0, CATATAN]
    );
    return { IDTRANSAKSI: newId, IDUSER, NOTRANSAKSI, TANGGAL: now, JENISTRANSAKSI, TOTAL: TOTAL || 0, CATATAN };
  },

  delete: async (id) => {
    await db.query('DELETE FROM TRANSAKSI WHERE IDTRANSAKSI = ?', [id]);
  },
};

module.exports = Transaksi;