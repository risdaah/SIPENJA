const db = require('../config/db');

const DetailTransaksiServis = {
  getByServis: async (IDSERVIS) => {
    const [rows] = await db.query(`
      SELECT d.*, l.NAMA as NAMA_LAYANAN, l.KODELAYANAN, l.BIAYAPOKOK
      FROM DETAILTRANSAKSISERVIS d
      LEFT JOIN LAYANANSERVIS l ON d.IDLAYANANSERVIS = l.IDLAYANANSERVIS
      WHERE d.IDSERVIS = ?
    `, [IDSERVIS]);
    return rows;
  },

  getById: async (IDDETAILTRANSAKSISERVIS) => {
    const [rows] = await db.query(
      'SELECT * FROM DETAILTRANSAKSISERVIS WHERE IDDETAILTRANSAKSISERVIS = ?',
      [IDDETAILTRANSAKSISERVIS]
    );
    return rows[0];
  },

  create: async (IDSERVIS, ITEMS) => {
    const [lastRow] = await db.query('SELECT MAX(IDDETAILTRANSAKSISERVIS) as lastId FROM DETAILTRANSAKSISERVIS');
    let newId = (lastRow[0].lastId || 0) + 1;

    for (const item of ITEMS) {
      const { IDLAYANANSERVIS, KETERANGAN } = item;

      if (!IDLAYANANSERVIS) {
        throw new Error('IDLAYANANSERVIS wajib diisi pada setiap layanan');
      }

      // Ambil biaya pokok dari tabel master LAYANANSERVIS
      const [layanan] = await db.query(
        'SELECT BIAYAPOKOK FROM LAYANANSERVIS WHERE IDLAYANANSERVIS = ?',
        [IDLAYANANSERVIS]
      );

      if (!layanan[0]) {
        throw new Error(`Layanan dengan ID ${IDLAYANANSERVIS} tidak ditemukan`);
      }

      // Biaya default dari master, bisa di-override jika dikirim
      const BIAYA = item.BIAYA !== undefined ? item.BIAYA : layanan[0].BIAYAPOKOK;

      await db.query(
        `INSERT INTO DETAILTRANSAKSISERVIS (IDSERVIS, IDLAYANANSERVIS, IDDETAILTRANSAKSISERVIS, BIAYA, KETERANGAN)
         VALUES (?, ?, ?, ?, ?)`,
        [IDSERVIS, IDLAYANANSERVIS, newId, BIAYA, KETERANGAN || null]
      );

      newId++;
    }
  },

  // FIX: Mekanik bisa update BIAYA dan KETERANGAN
  update: async (IDDETAILTRANSAKSISERVIS, data) => {
    const { BIAYA, KETERANGAN } = data;

    // Setidaknya salah satu harus diisi
    const updates = [];
    const values = [];

    if (BIAYA !== undefined && BIAYA !== null) {
      if (BIAYA < 0) throw new Error('BIAYA tidak boleh negatif');
      updates.push('BIAYA = ?');
      values.push(BIAYA);
    }
    if (KETERANGAN !== undefined) {
      updates.push('KETERANGAN = ?');
      values.push(KETERANGAN);
    }

    if (updates.length === 0) {
      throw new Error('Minimal BIAYA atau KETERANGAN harus diisi untuk update');
    }

    values.push(IDDETAILTRANSAKSISERVIS);
    await db.query(
      `UPDATE DETAILTRANSAKSISERVIS SET ${updates.join(', ')} WHERE IDDETAILTRANSAKSISERVIS = ?`,
      values
    );

    // Ambil data terbaru
    const [rows] = await db.query(
      'SELECT * FROM DETAILTRANSAKSISERVIS WHERE IDDETAILTRANSAKSISERVIS = ?',
      [IDDETAILTRANSAKSISERVIS]
    );
    return rows[0];
  },

  deleteById: async (IDDETAILTRANSAKSISERVIS) => {
    await db.query(
      'DELETE FROM DETAILTRANSAKSISERVIS WHERE IDDETAILTRANSAKSISERVIS = ?',
      [IDDETAILTRANSAKSISERVIS]
    );
  },

  delete: async (IDSERVIS) => {
    await db.query('DELETE FROM DETAILTRANSAKSISERVIS WHERE IDSERVIS = ?', [IDSERVIS]);
  },
};

module.exports = DetailTransaksiServis;