/**
 * models/kategoriSparepartModel.js — Model kategori sparepart
 *
 * Berinteraksi dengan tabel KATEGORISPAREPART.
 * Digunakan untuk mengelompokkan sparepart (contoh: Oli, Filter, Rem, Busi).
 */

const db = require('../config/db');

const KategoriSparepart = {
  // Ambil semua kategori
  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM KATEGORISPAREPART');
    return rows;
  },

  // Ambil satu kategori by ID
  getById: async (id) => {
    const [rows] = await db.query('SELECT * FROM KATEGORISPAREPART WHERE IDKATEGORI = ?', [id]);
    return rows[0];
  },

  // Tambah kategori baru dengan ID manual (MAX + 1)
  create: async (NAMA, KODE) => {
    const [lastRow] = await db.query('SELECT MAX(IDKATEGORI) as lastId FROM KATEGORISPAREPART');
    const newId = (lastRow[0].lastId || 0) + 1;
    await db.query(
      'INSERT INTO KATEGORISPAREPART (IDKATEGORI, NAMA, KODE) VALUES (?, ?, ?)',
      [newId, NAMA, KODE]
    );
    return { IDKATEGORI: newId, NAMA, KODE };
  },

  // Update nama dan kode kategori
  update: async (id, NAMA, KODE) => {
    await db.query(
      'UPDATE KATEGORISPAREPART SET NAMA = ?, KODE = ? WHERE IDKATEGORI = ?',
      [NAMA, KODE, id]
    );
    return { IDKATEGORI: id, NAMA, KODE };
  },

  // Hapus kategori — akan error jika masih ada sparepart yang memakai kategori ini (FK constraint)
  delete: async (id) => {
    await db.query('DELETE FROM KATEGORISPAREPART WHERE IDKATEGORI = ?', [id]);
  },
};

module.exports = KategoriSparepart;
