const db = require('../config/db');

const LayananServis = {
  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM LAYANANSERVIS');
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query('SELECT * FROM LAYANANSERVIS WHERE IDLAYANANSERVIS = ?', [id]);
    return rows[0];
  },

  create: async (data) => {
    const { KODELAYANAN, NAMA, BIAYAPOKOK, DESKRIPSI } = data;
    const [lastRow] = await db.query('SELECT MAX(IDLAYANANSERVIS) as lastId FROM LAYANANSERVIS');
    const newId = (lastRow[0].lastId || 0) + 1;
    await db.query(
      `INSERT INTO LAYANANSERVIS (IDLAYANANSERVIS, KODELAYANAN, NAMA, BIAYAPOKOK, DESKRIPSI) 
       VALUES (?, ?, ?, ?, ?)`,
      [newId, KODELAYANAN, NAMA, BIAYAPOKOK, DESKRIPSI]
    );
    return { IDLAYANANSERVIS: newId, ...data };
  },

  update: async (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await db.query(`UPDATE LAYANANSERVIS SET ${fields} WHERE IDLAYANANSERVIS = ?`, values);
    return { IDLAYANANSERVIS: id, ...data };
  },

  delete: async (id) => {
    await db.query('DELETE FROM LAYANANSERVIS WHERE IDLAYANANSERVIS = ?', [id]);
  },
};

module.exports = LayananServis;