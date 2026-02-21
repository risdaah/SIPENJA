const db = require('../config/db');

const Sparepart = {
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT s.*, k.NAMA as NAMA_KATEGORI, sup.NAMA as NAMA_SUPPLIER
      FROM SPAREPART s
      LEFT JOIN KATEGORISPAREPART k ON s.IDKATEGORI = k.IDKATEGORI
      LEFT JOIN SUPPLIER sup ON s.IDSUPPLIER = sup.IDSUPPLIER
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(`
      SELECT s.*, k.NAMA as NAMA_KATEGORI, sup.NAMA as NAMA_SUPPLIER
      FROM SPAREPART s
      LEFT JOIN KATEGORISPAREPART k ON s.IDKATEGORI = k.IDKATEGORI
      LEFT JOIN SUPPLIER sup ON s.IDSUPPLIER = sup.IDSUPPLIER
      WHERE s.IDSPAREPART = ?
    `, [id]);
    return rows[0];
  },

  getLowStock: async () => {
      const [rows] = await db.query(`
        SELECT s.IDSPAREPART, s.KODESPAREPART, s.NAMA, s.STOK, s.STOKMINIMUM,
              s.STOK - s.STOKMINIMUM as SELISIH_STOK,
              k.NAMA as NAMA_KATEGORI,
              sup.NAMA as NAMA_SUPPLIER
        FROM SPAREPART s
        LEFT JOIN KATEGORISPAREPART k ON s.IDKATEGORI = k.IDKATEGORI
        LEFT JOIN SUPPLIER sup ON s.IDSUPPLIER = sup.IDSUPPLIER
        WHERE s.STOK < s.STOKMINIMUM
        ORDER BY s.STOK ASC
      `);
      return rows;
    },

  create: async (data) => {
    const { IDKATEGORI, IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL, STOK, STOKMINIMUM } = data;
    const [lastRow] = await db.query('SELECT MAX(IDSPAREPART) as lastId FROM SPAREPART');
    const newId = (lastRow[0].lastId || 0) + 1;
    await db.query(
      `INSERT INTO SPAREPART (IDSPAREPART, IDKATEGORI, IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL, STOK, STOKMINIMUM)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId, IDKATEGORI, IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL, STOK, STOKMINIMUM]
    );
    return { IDSPAREPART: newId, ...data };
  },

  update: async (id, data) => {
    const { IDKATEGORI, IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL, STOK, STOKMINIMUM } = data;
    await db.query(
      `UPDATE SPAREPART SET IDKATEGORI = ?, IDSUPPLIER = ?, KODESPAREPART = ?, NAMA = ?, 
       HARGAJUAL = ?, STOK = ?, STOKMINIMUM = ? WHERE IDSPAREPART = ?`,
      [IDKATEGORI, IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL, STOK, STOKMINIMUM, id]
    );
    return { IDSPAREPART: id, ...data };
  },

  delete: async (id) => {
    await db.query('DELETE FROM SPAREPART WHERE IDSPAREPART = ?', [id]);
  },

  getStok: async () => {
    const [rows] = await db.query(
      'SELECT IDSPAREPART, KODESPAREPART, NAMA, STOK FROM SPAREPART ORDER BY NAMA ASC'
    );
    return rows;
  },

  updateStok: async (id, STOK) => {
    await db.query('UPDATE SPAREPART SET STOK = ? WHERE IDSPAREPART = ?', [STOK, id]);
    return { IDSPAREPART: id, STOK };
  },
};

module.exports = Sparepart;