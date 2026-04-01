/**
 * models/servisModel.js — Model data servis kendaraan
 *
 * Berinteraksi dengan tabel SERVIS.
 * Setiap record mewakili satu kendaraan yang masuk bengkel untuk diservis.
 *
 * Kolom penting:
 *   IDUSER       : ID mekanik yang mengerjakan (bukan kasir)
 *   KODEANTRIAN  : Kode unik untuk tracking pelanggan (SRV-YYYYMMDD-001)
 *   STATUS       : 'Belum' | 'Dalam Proses' | 'Selesai' (tidak bisa mundur setelah Selesai)
 *   TANGGALSELESAI: Diisi otomatis saat STATUS diubah menjadi 'Selesai'
 *
 * Relasi:
 *   SERVIS → TRANSAKSI (setiap servis punya satu transaksi induk)
 *   SERVIS → USER (mekanik)
 *   SERVIS 1 → N DETAILTRANSAKSISERVIS (layanan yang dikerjakan)
 *   SERVIS 1 → N SERVISSPAREPART (sparepart yang dipakai)
 *   SERVIS 1 → N PROGRESSSERVIS (riwayat perubahan status)
 *
 * Catatan penting tentang delete:
 *   Servis.delete() menangani semua cleanup:
 *   1. Kembalikan stok sparepart
 *   2. Hapus PROGRESSSERVIS (FK)
 *   3. Hapus SERVISSPAREPART (FK)
 *   4. Hapus DETAILTRANSAKSISERVIS (FK)
 *   5. Hapus SERVIS
 *   6. Hapus TRANSAKSI induk
 *   Urutan penting karena FK RESTRICT!
 */

const db = require('../config/db');

const Servis = {
  // Ambil semua servis dengan info mekanik, kasir, dan total dari transaksi
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT s.*,
             m.NAMA as NAMA_MEKANIK,
             t.NOTRANSAKSI, t.TOTAL, t.CATATAN,
             k.NAMA as NAMA_KASIR
      FROM SERVIS s
      LEFT JOIN USER m ON s.IDUSER = m.IDUSER
      LEFT JOIN TRANSAKSI t ON s.IDTRANSAKSI = t.IDTRANSAKSI
      LEFT JOIN USER k ON t.IDUSER = k.IDUSER
      ORDER BY s.TANGGALMASUK DESC
    `);
    return rows;
  },

  // Ambil satu servis by ID, sertakan info mekanik, kasir, dan transaksi
  getById: async (id) => {
    const [rows] = await db.query(`
      SELECT s.*,
             m.NAMA as NAMA_MEKANIK,
             t.NOTRANSAKSI, t.TOTAL, t.CATATAN,
             k.NAMA as NAMA_KASIR
      FROM SERVIS s
      LEFT JOIN USER m ON s.IDUSER = m.IDUSER
      LEFT JOIN TRANSAKSI t ON s.IDTRANSAKSI = t.IDTRANSAKSI
      LEFT JOIN USER k ON t.IDUSER = k.IDUSER
      WHERE s.IDSERVIS = ?
    `, [id]);
    return rows[0];
  },

  // Cari servis via kode antrian — untuk halaman tracking pelanggan (publik)
  // Hanya mengembalikan field yang relevan untuk pelanggan
  getByKodeAntrian: async (kodeAntrian) => {
    const [rows] = await db.query(`
      SELECT s.IDSERVIS, s.KODEANTRIAN, s.TANGGALMASUK, s.TANGGALSELESAI,
             s.STATUS, s.KELUHAN, s.NAMAPELANGGAN,
             m.NAMA as NAMA_MEKANIK,
             t.NOTRANSAKSI, t.TOTAL
      FROM SERVIS s
      LEFT JOIN USER m ON s.IDUSER = m.IDUSER
      LEFT JOIN TRANSAKSI t ON s.IDTRANSAKSI = t.IDTRANSAKSI
      WHERE s.KODEANTRIAN = ?
    `, [kodeAntrian]);
    return rows[0];
  },

  // Ambil semua servis yang ditugaskan ke mekanik tertentu
  getByMekanik: async (IDUSER) => {
    const [rows] = await db.query(`
      SELECT s.*,
             m.NAMA as NAMA_MEKANIK,
             t.NOTRANSAKSI, t.TOTAL, t.CATATAN,
             k.NAMA as NAMA_KASIR
      FROM SERVIS s
      LEFT JOIN USER m ON s.IDUSER = m.IDUSER
      LEFT JOIN TRANSAKSI t ON s.IDTRANSAKSI = t.IDTRANSAKSI
      LEFT JOIN USER k ON t.IDUSER = k.IDUSER
      WHERE s.IDUSER = ?
      ORDER BY s.TANGGALMASUK DESC
    `, [IDUSER]);
    return rows;
  },

  // Filter servis berdasarkan STATUS
  getByStatus: async (status) => {
    const [rows] = await db.query(`
      SELECT s.*,
             m.NAMA as NAMA_MEKANIK,
             t.NOTRANSAKSI, t.TOTAL, t.CATATAN,
             k.NAMA as NAMA_KASIR
      FROM SERVIS s
      LEFT JOIN USER m ON s.IDUSER = m.IDUSER
      LEFT JOIN TRANSAKSI t ON s.IDTRANSAKSI = t.IDTRANSAKSI
      LEFT JOIN USER k ON t.IDUSER = k.IDUSER
      WHERE s.STATUS = ?
      ORDER BY s.TANGGALMASUK DESC
    `, [status]);
    return rows;
  },

  // Filter servis dalam rentang tanggal masuk
  getByDateRange: async (startDate, endDate) => {
    const [rows] = await db.query(`
      SELECT s.*,
             m.NAMA as NAMA_MEKANIK,
             t.NOTRANSAKSI, t.TOTAL, t.CATATAN,
             k.NAMA as NAMA_KASIR
      FROM SERVIS s
      LEFT JOIN USER m ON s.IDUSER = m.IDUSER
      LEFT JOIN TRANSAKSI t ON s.IDTRANSAKSI = t.IDTRANSAKSI
      LEFT JOIN USER k ON t.IDUSER = k.IDUSER
      WHERE DATE(s.TANGGALMASUK) BETWEEN ? AND ?
      ORDER BY s.TANGGALMASUK DESC
    `, [startDate, endDate]);
    return rows;
  },

  // Generate kode antrian unik — format: SRV-YYYYMMDD-001
  // Sequence reset setiap hari (COUNT servis hari ini + 1)
  generateKodeAntrian: async () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const [lastRow] = await db.query(
      `SELECT COUNT(*) as total FROM SERVIS WHERE DATE(TANGGALMASUK) = CURDATE()`
    );
    const count    = (lastRow[0].total || 0) + 1;
    const sequence = String(count).padStart(3, '0');
    return `SRV-${dateStr}-${sequence}`;
  },

  // Buat record servis baru dengan kode antrian otomatis
  create: async (data) => {
    const { IDUSER_MEKANIK, IDTRANSAKSI, NAMAPELANGGAN, KELUHAN } = data;
    const [lastRow]    = await db.query('SELECT MAX(IDSERVIS) as lastId FROM SERVIS');
    const newId        = (lastRow[0].lastId || 0) + 1;
    const KODEANTRIAN  = await Servis.generateKodeAntrian();
    const now          = new Date();

    await db.query(
      `INSERT INTO SERVIS (IDSERVIS, IDUSER, IDTRANSAKSI, KODEANTRIAN, TANGGALMASUK, STATUS, KELUHAN, NAMAPELANGGAN)
       VALUES (?, ?, ?, ?, ?, 'Belum', ?, ?)`,
      [newId, IDUSER_MEKANIK, IDTRANSAKSI, KODEANTRIAN, now, KELUHAN, NAMAPELANGGAN]
    );
    return { IDSERVIS: newId, IDUSER: IDUSER_MEKANIK, IDTRANSAKSI, KODEANTRIAN, TANGGALMASUK: now, STATUS: 'Belum', KELUHAN, NAMAPELANGGAN };
  },

  // Update field tertentu di tabel SERVIS (dinamis)
  update: async (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    await db.query(`UPDATE SERVIS SET ${fields} WHERE IDSERVIS = ?`, values);
    return { IDSERVIS: id, ...data };
  },

  // Update STATUS servis — jika STATUS = 'Selesai', TANGGALSELESAI diisi otomatis
  updateStatus: async (id, STATUS) => {
    const updateData = { STATUS };
    if (STATUS === 'Selesai') {
      updateData.TANGGALSELESAI = new Date(); // Catat waktu selesai
    }
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    await db.query(`UPDATE SERVIS SET ${fields} WHERE IDSERVIS = ?`, values);
  },

  // Hitung ulang TOTAL transaksi dari sum(BIAYA layanan) + sum(SUBTOTAL sparepart)
  // Dipanggil setiap kali ada perubahan layanan atau sparepart di servis
  updateTotal: async (IDSERVIS) => {
    const [sparepartTotal] = await db.query(
      'SELECT COALESCE(SUM(SUBTOTAL), 0) as total FROM SERVISSPAREPART WHERE IDSERVIS = ?',
      [IDSERVIS]
    );
    const [layananTotal] = await db.query(
      'SELECT COALESCE(SUM(BIAYA), 0) as total FROM DETAILTRANSAKSISERVIS WHERE IDSERVIS = ?',
      [IDSERVIS]
    );
    const total  = Number(sparepartTotal[0].total) + Number(layananTotal[0].total);
    const [servis] = await db.query('SELECT IDTRANSAKSI FROM SERVIS WHERE IDSERVIS = ?', [IDSERVIS]);

    // Update TOTAL di tabel TRANSAKSI (induk)
    await db.query('UPDATE TRANSAKSI SET TOTAL = ? WHERE IDTRANSAKSI = ?', [total, servis[0].IDTRANSAKSI]);
    return total;
  },

  // Hapus servis beserta semua relasinya — urutan hapus penting karena FK RESTRICT
  delete: async (id) => {
    const [servisRows] = await db.query('SELECT IDTRANSAKSI FROM SERVIS WHERE IDSERVIS = ?', [id]);
    if (!servisRows[0]) return;

    const IDTRANSAKSI = servisRows[0].IDTRANSAKSI;

    // 1. Kembalikan stok semua sparepart yang dipakai di servis ini
    const [sparepartItems] = await db.query(
      'SELECT QTY, IDSPAREPART FROM SERVISSPAREPART WHERE IDSERVIS = ?',
      [id]
    );
    for (const item of sparepartItems) {
      await db.query(
        'UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?',
        [item.QTY, item.IDSPAREPART]
      );
    }

    // 2. Hapus child records dari yang paling dalam ke atas (urutan FK)
    await db.query('DELETE FROM PROGRESSSERVIS WHERE IDSERVIS = ?', [id]);
    await db.query('DELETE FROM SERVISSPAREPART WHERE IDSERVIS = ?', [id]);
    await db.query('DELETE FROM DETAILTRANSAKSISERVIS WHERE IDSERVIS = ?', [id]);
    await db.query('DELETE FROM SERVIS WHERE IDSERVIS = ?', [id]);

    // 3. Hapus transaksi induk
    if (IDTRANSAKSI) {
      await db.query('DELETE FROM TRANSAKSI WHERE IDTRANSAKSI = ?', [IDTRANSAKSI]);
    }
  },
};

module.exports = Servis;
