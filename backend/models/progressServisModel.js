/**
 * models/progressServisModel.js — Model riwayat progress servis
 *
 * Berinteraksi dengan tabel PROGRESSSERVIS.
 * Setiap kali status servis berubah, satu record progress baru dibuat.
 * Ini menghasilkan timeline riwayat pengerjaan yang bisa dilihat pelanggan.
 *
 * Contoh riwayat progress untuk satu servis:
 *   1. STATUS: Belum        | WAKTU: 09:00 | "Kendaraan masuk, menunggu dikerjakan"
 *   2. STATUS: Dalam Proses | WAKTU: 10:15 | "Sedang ganti oli dan tune up"
 *   3. STATUS: Selesai      | WAKTU: 12:30 | "Kendaraan selesai dikerjakan dan siap diambil"
 *
 * Tabel ini menggunakan AUTO_INCREMENT untuk ID (berbeda dari model lain yang manual).
 */

const db = require("../config/db");

const ProgressServis = {
  // Ambil semua progress suatu servis, diurutkan dari yang terlama (ASC) untuk tampilan timeline
  getByServis: async (IDSERVIS) => {
    const [rows] = await db.query(
      `SELECT p.*
       FROM PROGRESSSERVIS p
       WHERE p.IDSERVIS = ?
       ORDER BY p.WAKTU ASC`,
      [IDSERVIS],
    );
    return rows;
  },

  // Catat progress baru — dipanggil setiap kali STATUS servis berubah
  // WAKTU diisi dengan NOW() (waktu server saat record dibuat)
  // ID menggunakan AUTO_INCREMENT — tidak perlu generate manual seperti model lain
  create: async (IDSERVIS, STATUS, KETERANGAN) => {
    const [result] = await db.query(
      `INSERT INTO PROGRESSSERVIS (IDSERVIS, WAKTU, STATUS, KETERANGAN)
       VALUES (?, NOW(), ?, ?)`,
      [IDSERVIS, STATUS, KETERANGAN],
    );
    return {
      IDPROGRESSERVIS: result.insertId, // ID dari AUTO_INCREMENT
      IDSERVIS,
      WAKTU: new Date(),
      STATUS,
      KETERANGAN,
    };
  },
};

module.exports = ProgressServis;
