const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  getAll: async () => {
    const [rows] = await db.query(
      'SELECT IDUSER, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, STATUS, DATECREATED, LASTLOGIN FROM USER'
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(
      'SELECT IDUSER, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, STATUS, DATECREATED, LASTLOGIN FROM USER WHERE IDUSER = ?',
      [id]
    );
    return rows[0];
  },

  getByUsername: async (username) => {
    const [rows] = await db.query('SELECT * FROM USER WHERE USERNAME = ?', [username]);
    return rows[0];
  },

  create: async (data) => {
    const { NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, PASSWORD } = data;
    const [lastRow] = await db.query('SELECT MAX(IDUSER) as lastId FROM USER');
    const newId = (lastRow[0].lastId || 0) + 1;
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const now = new Date();
    await db.query(
      `INSERT INTO USER (IDUSER, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, PASSWORD, STATUS, DATECREATED)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'AKTIF', ?)`,
      [newId, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, hashedPassword, now]
    );
    return { IDUSER: newId, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, STATUS: 'AKTIF', DATECREATED: now };
  },

  update: async (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await db.query(`UPDATE USER SET ${fields} WHERE IDUSER = ?`, values);
    return { IDUSER: id, ...data };
  },

  updatePassword: async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE USER SET PASSWORD = ? WHERE IDUSER = ?', [hashedPassword, id]);
  },

  updateStatus: async (id, status) => {
    await db.query('UPDATE USER SET STATUS = ? WHERE IDUSER = ?', [status, id]);
  },

  delete: async (id) => {
    await db.query('DELETE FROM USER WHERE IDUSER = ?', [id]);
  },

  createAdmin: async (data) => {
    const { NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, PASSWORD } = data;
    const [lastRow] = await db.query('SELECT MAX(IDUSER) as lastId FROM USER');
    const newId = (lastRow[0].lastId || 0) + 1;
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);
    const now = new Date();
    await db.query(
      `INSERT INTO USER (IDUSER, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE, PASSWORD, STATUS, DATECREATED)
       VALUES (?, ?, ?, ?, ?, 'admin', ?, 'AKTIF', ?)`,
      [newId, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, hashedPassword, now]
    );
    return { IDUSER: newId, NAMA, USERNAME, TANGGALLAHIR, JENISKELAMIN, ROLE: 'admin', STATUS: 'AKTIF', DATECREATED: now };
  },
};

module.exports = User;