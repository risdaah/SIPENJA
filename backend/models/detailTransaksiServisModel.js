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

      // Ambil biaya dari tabel master LAYANANSERVIS
      const [layanan] = await db.query(
        'SELECT BIAYAPOKOK FROM LAYANANSERVIS WHERE IDLAYANANSERVIS = ?',
        [IDLAYANANSERVIS]
      );

      if (!layanan[0]) {
        throw new Error(`Layanan dengan ID ${IDLAYANANSERVIS} tidak ditemukan`);
      }

      const BIAYA = layanan[0].BIAYAPOKOK;

      await db.query(
        `INSERT INTO DETAILTRANSAKSISERVIS (IDSERVIS, IDLAYANANSERVIS, IDDETAILTRANSAKSISERVIS, BIAYA, KETERANGAN)
         VALUES (?, ?, ?, ?, ?)`,
        [IDSERVIS, IDLAYANANSERVIS, newId, BIAYA, KETERANGAN]
      );

      newId++;
    }
  },

  update: async (IDDETAILTRANSAKSISERVIS, data) => {
    const { KETERANGAN } = data;

    // Hanya bisa update KETERANGAN, BIAYA tetap dari master
    await db.query(
      'UPDATE DETAILTRANSAKSISERVIS SET KETERANGAN = ? WHERE IDDETAILTRANSAKSISERVIS = ?',
      [KETERANGAN, IDDETAILTRANSAKSISERVIS]
    );

    return { IDDETAILTRANSAKSISERVIS, KETERANGAN };
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