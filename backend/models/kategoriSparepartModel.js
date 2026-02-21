const db = require('../config/db');

const KategoriSparepart = {
  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM KATEGORISPAREPART');
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query('SELECT * FROM KATEGORISPAREPART WHERE IDKATEGORI = ?', [id]);
    return rows[0];
  },

  create: async (NAMA, KODE) => {
    const [lastRow] = await db.query('SELECT MAX(IDKATEGORI) as lastId FROM KATEGORISPAREPART');
    const newId = (lastRow[0].lastId || 0) + 1;
    await db.query(
      'INSERT INTO KATEGORISPAREPART (IDKATEGORI, NAMA, KODE) VALUES (?, ?, ?)',
      [newId, NAMA, KODE]
    );
    return { IDKATEGORI: newId, NAMA, KODE };
  },

  update: async (id, NAMA, KODE) => {
    await db.query(
      'UPDATE KATEGORISPAREPART SET NAMA = ?, KODE = ? WHERE IDKATEGORI = ?',
      [NAMA, KODE, id]
    );
    return { IDKATEGORI: id, NAMA, KODE };
  },

  delete: async (id) => {
    await db.query('DELETE FROM KATEGORISPAREPART WHERE IDKATEGORI = ?', [id]);
  },
};

module.exports = KategoriSparepart;