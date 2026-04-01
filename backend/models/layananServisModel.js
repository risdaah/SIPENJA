/**
 * models/layananServisModel.js — Model layanan servis
 *
 * Berinteraksi dengan tabel LAYANANSERVIS.
 * Layanan adalah jenis pekerjaan bengkel beserta biaya pokoknya
 * (contoh: Ganti Oli — Rp 50.000, Tune Up — Rp 150.000).
 *
 * BIAYAPOKOK di sini adalah harga default. Saat layanan dipakai di servis,
 * biaya disimpan di DETAILTRANSAKSISERVIS.BIAYA dan bisa di-override oleh mekanik.
 */

const db = require('../config/db');

const LayananServis = {
  // Ambil semua layanan
  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM LAYANANSERVIS');
    return rows;
  },

  // Ambil satu layanan by ID
  getById: async (id) => {
    const [rows] = await db.query('SELECT * FROM LAYANANSERVIS WHERE IDLAYANANSERVIS = ?', [id]);
    return rows[0];
  },

  // Tambah layanan baru
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

  // Update layanan — field yang dikirim saja yang diupdate (dinamis)
  update: async (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await db.query(`UPDATE LAYANANSERVIS SET ${fields} WHERE IDLAYANANSERVIS = ?`, values);
    return { IDLAYANANSERVIS: id, ...data };
  },

  // Hapus layanan
  delete: async (id) => {
    await db.query('DELETE FROM LAYANANSERVIS WHERE IDLAYANANSERVIS = ?', [id]);
  },
};

module.exports = LayananServis;
