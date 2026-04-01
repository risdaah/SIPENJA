/**
 * models/sparepartModel.js — Model data sparepart
 *
 * Berinteraksi dengan tabel SPAREPART di database.
 * Tabel ini menyimpan informasi suku cadang/barang bengkel beserta stok dan harga jual.
 *
 * Relasi tabel:
 *   SPAREPART → KATEGORISPAREPART (JOIN LEFT, kategori bisa NULL)
 *   SPAREPART → SUPPLIER (JOIN LEFT, supplier wajib ada)
 *
 * Catatan penting tentang stok:
 *   - Stok berkurang saat digunakan di servis (ServisSparepart.create)
 *   - Stok berkurang saat pelanggan membeli (TransaksiPembelianSparepart.createDetail)
 *   - Stok bertambah saat pengisian via pengeluaranController.tambahStok (STOK + QTY)
 *   - updateStok() adalah koreksi manual — langsung SET nilai baru, bukan increment
 */

const db = require('../config/db');

const Sparepart = {
  // Ambil semua sparepart, sertakan nama kategori dan supplier via JOIN
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT s.*, k.NAMA as NAMA_KATEGORI, sup.NAMA as NAMA_SUPPLIER
      FROM SPAREPART s
      LEFT JOIN KATEGORISPAREPART k ON s.IDKATEGORI = k.IDKATEGORI
      LEFT JOIN SUPPLIER sup ON s.IDSUPPLIER = sup.IDSUPPLIER
    `);
    return rows;
  },

  // Ambil satu sparepart by ID, sertakan nama kategori dan supplier
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

  // Ambil sparepart yang stoknya di bawah batas minimum (untuk notifikasi)
  // Sertakan selisih stok agar admin tahu seberapa kritis kekurangannya
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

  // Tambah sparepart baru ke database
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

  // Update semua field sparepart sekaligus (termasuk stok & harga)
  update: async (id, data) => {
    const { IDKATEGORI, IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL, STOK, STOKMINIMUM } = data;
    await db.query(
      `UPDATE SPAREPART SET IDKATEGORI = ?, IDSUPPLIER = ?, KODESPAREPART = ?, NAMA = ?,
       HARGAJUAL = ?, STOK = ?, STOKMINIMUM = ? WHERE IDSPAREPART = ?`,
      [IDKATEGORI, IDSUPPLIER, KODESPAREPART, NAMA, HARGAJUAL, STOK, STOKMINIMUM, id]
    );
    return { IDSPAREPART: id, ...data };
  },

  // Hapus sparepart permanen dari database
  delete: async (id) => {
    await db.query('DELETE FROM SPAREPART WHERE IDSPAREPART = ?', [id]);
  },

  // Ambil daftar sparepart dengan info stok saja — lebih ringan untuk dropdown input
  getStok: async () => {
    const [rows] = await db.query(
      'SELECT IDSPAREPART, KODESPAREPART, NAMA, STOK FROM SPAREPART ORDER BY NAMA ASC'
    );
    return rows;
  },

  // Koreksi stok manual — SET nilai baru (berbeda dari increment di tambahStok)
  updateStok: async (id, STOK) => {
    await db.query('UPDATE SPAREPART SET STOK = ? WHERE IDSPAREPART = ?', [STOK, id]);
    return { IDSPAREPART: id, STOK };
  },
};

module.exports = Sparepart;
