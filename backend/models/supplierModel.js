const db = require('../config/db');

const Supplier = {
  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM SUPPLIER');
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query('SELECT * FROM SUPPLIER WHERE IDSUPPLIER = ?', [id]);
    return rows[0];
  },

  create: async (data) => {
    const { NAMA, NOHP, ALAMAT } = data;
    const [lastRow] = await db.query('SELECT MAX(IDSUPPLIER) as lastId FROM SUPPLIER');
    const newId = (lastRow[0].lastId || 0) + 1;
    await db.query(
      `INSERT INTO SUPPLIER (IDSUPPLIER, NAMA, NOHP, ALAMAT) VALUES (?, ?, ?, ?)`,
      [newId, NAMA, NOHP, ALAMAT]
    );
    return { IDSUPPLIER: newId, ...data };
  },

  update: async (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await db.query(`UPDATE SUPPLIER SET ${fields} WHERE IDSUPPLIER = ?`, values);
    return { IDSUPPLIER: id, ...data };
  },

  delete: async (id) => {
    await db.query('DELETE FROM SUPPLIER WHERE IDSUPPLIER = ?', [id]);
  },
};

module.exports = Supplier;