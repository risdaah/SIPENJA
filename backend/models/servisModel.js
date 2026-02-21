const db = require('../config/db');

const Servis = {
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT s.*, 
             m.NAMA as NAMA_MEKANIK, 
             t.NOTRANSAKSI, t.TOTAL,
             k.NAMA as NAMA_KASIR
      FROM SERVIS s
      LEFT JOIN USER m ON s.IDUSER = m.IDUSER
      LEFT JOIN TRANSAKSI t ON s.IDTRANSAKSI = t.IDTRANSAKSI
      LEFT JOIN USER k ON t.IDUSER = k.IDUSER
      ORDER BY s.TANGGALMASUK DESC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(`
      SELECT s.*, 
             m.NAMA as NAMA_MEKANIK,
             t.NOTRANSAKSI, t.TOTAL,
             k.NAMA as NAMA_KASIR
      FROM SERVIS s
      LEFT JOIN USER m ON s.IDUSER = m.IDUSER
      LEFT JOIN TRANSAKSI t ON s.IDTRANSAKSI = t.IDTRANSAKSI
      LEFT JOIN USER k ON t.IDUSER = k.IDUSER
      WHERE s.IDSERVIS = ?
    `, [id]);
    return rows[0];
  },

  getByMekanik: async (IDUSER) => {
    const [rows] = await db.query(`
      SELECT s.*, 
             m.NAMA as NAMA_MEKANIK,
             t.NOTRANSAKSI, t.TOTAL,
             k.NAMA as NAMA_KASIR
      FROM SERVIS s
      LEFT JOIN USER m ON s.IDUSER = m.IDUSER
      LEFT JOIN TRANSAKSI t ON s.IDTRANSAKSI = t.IDTRANSAKSI
      LEFT JOIN USER k ON t.IDUSER = k.IDUSER
      WHERE s.IDUSER = ?
      ORDER BY s.TANGGALMASUK DESC
    `, [IDUSER]);
    return rows;
  },

  getByStatus: async (status) => {
    const [rows] = await db.query(`
      SELECT s.*, 
             m.NAMA as NAMA_MEKANIK,
             t.NOTRANSAKSI, t.TOTAL,
             k.NAMA as NAMA_KASIR
      FROM SERVIS s
      LEFT JOIN USER m ON s.IDUSER = m.IDUSER
      LEFT JOIN TRANSAKSI t ON s.IDTRANSAKSI = t.IDTRANSAKSI
      LEFT JOIN USER k ON t.IDUSER = k.IDUSER
      WHERE s.STATUS = ?
      ORDER BY s.TANGGALMASUK DESC
    `, [status]);
    return rows;
  },

  generateKodeAntrian: async () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [lastRow] = await db.query(
      `SELECT COUNT(*) as total FROM SERVIS WHERE DATE(TANGGALMASUK) = CURDATE()`
    );
    const count = (lastRow[0].total || 0) + 1;
    const sequence = String(count).padStart(3, '0');
    return `SRV-${dateStr}-${sequence}`;
  },

  create: async (data) => {
    const { IDUSER_MEKANIK, IDTRANSAKSI, NAMAPELANGGAN, KELUHAN } = data;
    const [lastRow] = await db.query('SELECT MAX(IDSERVIS) as lastId FROM SERVIS');
    const newId = (lastRow[0].lastId || 0) + 1;
    const KODEANTRIAN = await Servis.generateKodeAntrian();
    const now = new Date();
    await db.query(
      `INSERT INTO SERVIS (IDSERVIS, IDUSER, IDTRANSAKSI, KODEANTRIAN, TANGGALMASUK, STATUS, KELUHAN, NAMAPELANGGAN)
       VALUES (?, ?, ?, ?, ?, 'Belum', ?, ?)`,
      [newId, IDUSER_MEKANIK, IDTRANSAKSI, KODEANTRIAN, now, KELUHAN, NAMAPELANGGAN]
    );
    return { IDSERVIS: newId, IDUSER: IDUSER_MEKANIK, IDTRANSAKSI, KODEANTRIAN, TANGGALMASUK: now, STATUS: 'Belum', KELUHAN, NAMAPELANGGAN };
  },

  update: async (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await db.query(`UPDATE SERVIS SET ${fields} WHERE IDSERVIS = ?`, values);
    return { IDSERVIS: id, ...data };
  },

  updateStatus: async (id, STATUS) => {
    const updateData = { STATUS };
    if (STATUS === 'Selesai') {
      updateData.TANGGALSELESAI = new Date();
    }
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    await db.query(`UPDATE SERVIS SET ${fields} WHERE IDSERVIS = ?`, values);
  },

  updateTotal: async (IDSERVIS) => {
    const [sparepartTotal] = await db.query(
      'SELECT COALESCE(SUM(SUBTOTAL), 0) as total FROM SERVISSPAREPART WHERE IDSERVIS = ?',
      [IDSERVIS]
    );
    const [layananTotal] = await db.query(
      'SELECT COALESCE(SUM(BIAYA), 0) as total FROM DETAILTRANSAKSISERVIS WHERE IDSERVIS = ?',
      [IDSERVIS]
    );
    const total = Number(sparepartTotal[0].total) + Number(layananTotal[0].total);
    const [servis] = await db.query('SELECT IDTRANSAKSI FROM SERVIS WHERE IDSERVIS = ?', [IDSERVIS]);
    await db.query('UPDATE TRANSAKSI SET TOTAL = ? WHERE IDTRANSAKSI = ?', [total, servis[0].IDTRANSAKSI]);
    return total;
  },

  delete: async (id) => {
    const [servis] = await db.query('SELECT IDTRANSAKSI FROM SERVIS WHERE IDSERVIS = ?', [id]);
    await db.query('DELETE FROM PROGRESSSERVIS WHERE IDSERVIS = ?', [id]);
    await db.query('DELETE FROM SERVISSPAREPART WHERE IDSERVIS = ?', [id]);
    await db.query('DELETE FROM DETAILTRANSAKSISERVIS WHERE IDSERVIS = ?', [id]);
    await db.query('DELETE FROM SERVIS WHERE IDSERVIS = ?', [id]);
    if (servis[0].IDTRANSAKSI) {
      await db.query('DELETE FROM TRANSAKSI WHERE IDTRANSAKSI = ?', [servis[0].IDTRANSAKSI]);
    }
  },
};

module.exports = Servis;