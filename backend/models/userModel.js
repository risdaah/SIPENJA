/**
 * models/userModel.js — Model data user/karyawan
 *
 * Berinteraksi langsung dengan tabel USER di database.
 * Password di-hash menggunakan bcrypt (salt rounds = 10) sebelum disimpan.
 *
 * Catatan keamanan:
 *   - getAll dan getById TIDAK menyertakan kolom PASSWORD di SELECT
 *   - getByUsername menyertakan PASSWORD (dibutuhkan untuk verifikasi di authController)
 *   - ID di-generate manual dengan MAX(IDUSER)+1 (tidak menggunakan AUTO_INCREMENT)
 */

const db     = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  // Ambil semua user — kolom PASSWORD dikecualikan untuk keamanan
  getAll: async () => {
    const [rows] = await db.query(
      'SELECT IDUSER, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, STATUS, DATECREATED, LASTLOGIN FROM USER'
    );
    return rows;
  },

  // Ambil satu user by ID — kolom PASSWORD dikecualikan
  getById: async (id) => {
    const [rows] = await db.query(
      'SELECT IDUSER, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, STATUS, DATECREATED, LASTLOGIN FROM USER WHERE IDUSER = ?',
      [id]
    );
    return rows[0];
  },

  // Ambil user by USERNAME — kolom PASSWORD DI-SERTAKAN karena dibutuhkan untuk login
  getByUsername: async (username) => {
    const [rows] = await db.query('SELECT * FROM USER WHERE USERNAME = ?', [username]);
    return rows[0];
  },

  // Buat user baru dengan password ter-hash
  create: async (data) => {
    const { NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, PASSWORD } = data;

    // Generate ID manual (MAX + 1)
    const [lastRow]        = await db.query('SELECT MAX(IDUSER) as lastId FROM USER');
    const newId            = (lastRow[0].lastId || 0) + 1;
    const hashedPassword   = await bcrypt.hash(PASSWORD, 10); // Hash dengan salt factor 10
    const now              = new Date();

    await db.query(
      `INSERT INTO USER (IDUSER, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, PASSWORD, STATUS, DATECREATED)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'AKTIF', ?)`,
      [newId, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, hashedPassword, now]
    );
    // Kembalikan tanpa password
    return { IDUSER: newId, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, STATUS: 'AKTIF', DATECREATED: now };
  },

  // Update data profil user (dinamis — hanya kolom yang dikirim yang diupdate)
  update: async (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await db.query(`UPDATE USER SET ${fields} WHERE IDUSER = ?`, values);
    return { IDUSER: id, ...data };
  },

  // Ganti password — hash ulang sebelum disimpan
  updatePassword: async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE USER SET PASSWORD = ? WHERE IDUSER = ?', [hashedPassword, id]);
  },

  // Aktifkan atau nonaktifkan akun user (STATUS: 'AKTIF' | 'NONAKTIF')
  updateStatus: async (id, status) => {
    await db.query('UPDATE USER SET STATUS = ? WHERE IDUSER = ?', [status, id]);
  },

  // Hapus user permanen dari database
  delete: async (id) => {
    await db.query('DELETE FROM USER WHERE IDUSER = ?', [id]);
  },

  // Buat akun admin — sama seperti create tapi ROLE di-hardcode 'admin'
  createAdmin: async (data) => {
    const { NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, PASSWORD } = data;
    const [lastRow]      = await db.query('SELECT MAX(IDUSER) as lastId FROM USER');
    const newId          = (lastRow[0].lastId || 0) + 1;
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const now            = new Date();

    await db.query(
      `INSERT INTO USER (IDUSER, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, PASSWORD, STATUS, DATECREATED)
       VALUES (?, ?, ?, ?, ?, 'admin', ?, 'AKTIF', ?)`,
      [newId, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, hashedPassword, now]
    );
    return { IDUSER: newId, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE: 'admin', STATUS: 'AKTIF', DATECREATED: now };
  },
};

module.exports = User;
