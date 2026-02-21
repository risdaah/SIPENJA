const db = require('../config/db');

const ProgressServis = {
  getByServis: async (IDSERVIS) => {
    const [rows] = await db.query(`
      SELECT p.*
      FROM PROGRESSSERVIS p
      WHERE p.IDSERVIS = ?
      ORDER BY p.WAKTU ASC
    `, [IDSERVIS]);
    return rows;
  },

  create: async (IDSERVIS, STATUS, KETERANGAN) => {
    const [lastRow] = await db.query('SELECT MAX(IDPROGRESSERVIS) as lastId FROM PROGRESSSERVIS');
    const newId = (lastRow[0].lastId || 0) + 1;
    const now = new Date();
    await db.query(
      `INSERT INTO PROGRESSSERVIS (IDPROGRESSERVIS, IDSERVIS, WAKTU, STATUS, KETERANGAN)
       VALUES (?, ?, ?, ?, ?)`,
      [newId, IDSERVIS, now, STATUS, KETERANGAN]
    );
    return { IDPROGRESSERVIS: newId, IDSERVIS, WAKTU: now, STATUS, KETERANGAN };
  },
};

module.exports = ProgressServis;