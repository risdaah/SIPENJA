/**
 * models/servisSparepartModel.js — Model sparepart yang dipakai dalam servis
 *
 * Berinteraksi dengan tabel SERVISSPAREPART.
 * Setiap row mewakili satu jenis sparepart yang digunakan mekanik dalam mengerjakan servis.
 *
 * Manajemen stok yang dikelola model ini:
 *   create()    : Stok BERKURANG saat mekanik menambah sparepart ke servis
 *   update()    : Stok di-adjust sesuai selisih QTY baru vs lama
 *   deleteById(): Stok DIKEMBALIKAN saat satu item sparepart dihapus dari servis
 *   delete()    : Stok SEMUA ITEM dikembalikan (dipanggil saat hapus seluruh servis)
 *
 * Harga diambil snapshot dari HARGAJUAL master saat ditambahkan,
 * tidak berubah meskipun harga master diubah nantinya.
 */

const db = require('../config/db');

const ServisSparepart = {
  // Ambil semua sparepart yang dipakai di satu servis, sertakan nama & harga dari master
  getByServis: async (IDSERVIS) => {
    const [rows] = await db.query(`
      SELECT ss.*, s.NAMA as NAMA_SPAREPART, s.KODESPAREPART, s.HARGAJUAL
      FROM SERVISSPAREPART ss
      LEFT JOIN SPAREPART s ON ss.IDSPAREPART = s.IDSPAREPART
      WHERE ss.IDSERVIS = ?
    `, [IDSERVIS]);
    return rows;
  },

  // Ambil satu item sparepart servis by ID
  getById: async (IDSERVISSPAREPART) => {
    const [rows] = await db.query(
      'SELECT * FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );
    return rows[0];
  },

  // Tambah sparepart ke servis — harga dari master, stok berkurang otomatis
  create: async (IDSERVIS, ITEMS) => {
    const [lastRow] = await db.query('SELECT MAX(IDSERVISSPAREPART) as lastId FROM SERVISSPAREPART');
    let newId = (lastRow[0].lastId || 0) + 1;

    for (const item of ITEMS) {
      const { IDSPAREPART, QTY } = item;
      if (!IDSPAREPART || !QTY || QTY <= 0) throw new Error('IDSPAREPART dan QTY (> 0) wajib diisi pada setiap item');

      // Ambil harga jual dan cek ketersediaan stok
      const [sparepart] = await db.query(
        'SELECT HARGAJUAL, STOK FROM SPAREPART WHERE IDSPAREPART = ?',
        [IDSPAREPART]
      );
      if (!sparepart[0]) throw new Error(`Sparepart dengan ID ${IDSPAREPART} tidak ditemukan`);
      if (sparepart[0].STOK < QTY) throw new Error(`Stok sparepart ID ${IDSPAREPART} tidak cukup, stok tersedia: ${sparepart[0].STOK}`);

      // Snapshot harga saat sparepart ditambahkan ke servis
      const HARGASATUAN = sparepart[0].HARGAJUAL;
      const SUBTOTAL    = QTY * HARGASATUAN;

      await db.query(
        `INSERT INTO SERVISSPAREPART (IDSERVIS, IDSPAREPART, IDSERVISSPAREPART, QTY, HARGASATUAN, SUBTOTAL)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [IDSERVIS, IDSPAREPART, newId, QTY, HARGASATUAN, SUBTOTAL]
      );

      // Kurangi stok (sparepart dipakai untuk servis)
      await db.query(
        'UPDATE SPAREPART SET STOK = STOK - ? WHERE IDSPAREPART = ?',
        [QTY, IDSPAREPART]
      );

      newId++;
    }
  },

  // Update qty sparepart di servis — harga tetap, stok di-adjust sesuai selisih
  update: async (IDSERVISSPAREPART, data) => {
    const { QTY } = data;
    if (!QTY || QTY <= 0) throw new Error('QTY harus lebih dari 0');

    const [oldRows] = await db.query(
      'SELECT QTY, IDSPAREPART, HARGASATUAN FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );
    if (!oldRows[0]) throw new Error('Sparepart servis tidak ditemukan');

    const old     = oldRows[0];
    const qtyDiff = QTY - old.QTY; // Positif = tambah pakai, negatif = kurangi pakai

    // Cek stok jika qty bertambah
    if (qtyDiff > 0) {
      const [sparepart] = await db.query('SELECT STOK FROM SPAREPART WHERE IDSPAREPART = ?', [old.IDSPAREPART]);
      if (sparepart[0].STOK < qtyDiff) throw new Error(`Stok tidak cukup, stok tersedia: ${sparepart[0].STOK}`);
    }

    // Harga tetap dari snapshot awal
    const HARGASATUAN = old.HARGASATUAN;
    const SUBTOTAL    = QTY * HARGASATUAN;

    await db.query(
      'UPDATE SERVISSPAREPART SET QTY = ?, SUBTOTAL = ? WHERE IDSERVISSPAREPART = ?',
      [QTY, SUBTOTAL, IDSERVISSPAREPART]
    );

    // Adjust stok: qtyDiff positif → stok berkurang, negatif → stok kembali sebagian
    await db.query(
      'UPDATE SPAREPART SET STOK = STOK - ? WHERE IDSPAREPART = ?',
      [qtyDiff, old.IDSPAREPART]
    );

    return { IDSERVISSPAREPART, QTY, HARGASATUAN, SUBTOTAL };
  },

  // Hapus satu sparepart dari servis — stok dikembalikan ke gudang
  deleteById: async (IDSERVISSPAREPART) => {
    const [itemRows] = await db.query(
      'SELECT QTY, IDSPAREPART FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );
    if (!itemRows[0]) throw new Error('Sparepart servis tidak ditemukan');

    // Kembalikan stok yang dipakai
    await db.query(
      'UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?',
      [itemRows[0].QTY, itemRows[0].IDSPAREPART]
    );

    await db.query(
      'DELETE FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );
  },

  // Hapus SEMUA sparepart dari satu servis dan kembalikan semua stok
  // Dipanggil oleh Servis.delete() sebagai bagian dari cleanup berantai
  delete: async (IDSERVIS) => {
    const [items] = await db.query(
      'SELECT QTY, IDSPAREPART FROM SERVISSPAREPART WHERE IDSERVIS = ?',
      [IDSERVIS]
    );

    // Kembalikan stok semua item sebelum menghapus
    for (const item of items) {
      await db.query(
        'UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?',
        [item.QTY, item.IDSPAREPART]
      );
    }

    await db.query('DELETE FROM SERVISSPAREPART WHERE IDSERVIS = ?', [IDSERVIS]);
  },
};

module.exports = ServisSparepart;
