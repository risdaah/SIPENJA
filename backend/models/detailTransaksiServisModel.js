/**
 * models/detailTransaksiServisModel.js — Model detail layanan per servis
 *
 * Berinteraksi dengan tabel DETAILTRANSAKSISERVIS.
 * Setiap row mewakili satu layanan yang dikerjakan dalam satu servis.
 *
 * Contoh: Servis kendaraan X mengerjakan:
 *   - Ganti Oli       (IDLAYANANSERVIS=1, BIAYA=50000)
 *   - Tune Up         (IDLAYANANSERVIS=2, BIAYA=150000)
 *   - Ganti Busi      (IDLAYANANSERVIS=3, BIAYA=75000)
 *
 * Catatan tentang BIAYA:
 *   - Default diambil dari BIAYAPOKOK di master LAYANANSERVIS
 *   - Bisa di-override oleh mekanik melalui update()
 *   - BIAYA di sini adalah snapshot saat transaksi, bukan referensi ke master
 *
 * Catatan tentang hapus:
 *   - deleteById(): hapus satu layanan by ID detail
 *   - delete(IDSERVIS): hapus SEMUA layanan di suatu servis (dipanggil saat hapus servis)
 */

const db = require('../config/db');

const DetailTransaksiServis = {
  // Ambil semua layanan di satu servis, sertakan nama & kode dari master layanan
  getByServis: async (IDSERVIS) => {
    const [rows] = await db.query(`
      SELECT d.*, l.NAMA as NAMA_LAYANAN, l.KODELAYANAN, l.BIAYAPOKOK
      FROM DETAILTRANSAKSISERVIS d
      LEFT JOIN LAYANANSERVIS l ON d.IDLAYANANSERVIS = l.IDLAYANANSERVIS
      WHERE d.IDSERVIS = ?
    `, [IDSERVIS]);
    return rows;
  },

  // Ambil satu detail layanan by ID
  getById: async (IDDETAILTRANSAKSISERVIS) => {
    const [rows] = await db.query(
      'SELECT * FROM DETAILTRANSAKSISERVIS WHERE IDDETAILTRANSAKSISERVIS = ?',
      [IDDETAILTRANSAKSISERVIS]
    );
    return rows[0];
  },

  // Tambah satu atau lebih layanan ke servis
  // Biaya default dari master LAYANANSERVIS, bisa di-override jika item.BIAYA dikirim
  create: async (IDSERVIS, ITEMS) => {
    const [lastRow] = await db.query('SELECT MAX(IDDETAILTRANSAKSISERVIS) as lastId FROM DETAILTRANSAKSISERVIS');
    let newId = (lastRow[0].lastId || 0) + 1;

    for (const item of ITEMS) {
      const { IDLAYANANSERVIS, KETERANGAN } = item;
      if (!IDLAYANANSERVIS) throw new Error('IDLAYANANSERVIS wajib diisi pada setiap layanan');

      // Ambil BIAYAPOKOK dari master sebagai nilai default
      const [layanan] = await db.query(
        'SELECT BIAYAPOKOK FROM LAYANANSERVIS WHERE IDLAYANANSERVIS = ?',
        [IDLAYANANSERVIS]
      );
      if (!layanan[0]) throw new Error(`Layanan dengan ID ${IDLAYANANSERVIS} tidak ditemukan`);

      // Gunakan biaya override jika ada, fallback ke BIAYAPOKOK dari master
      const BIAYA = item.BIAYA !== undefined ? item.BIAYA : layanan[0].BIAYAPOKOK;

      await db.query(
        `INSERT INTO DETAILTRANSAKSISERVIS (IDSERVIS, IDLAYANANSERVIS, IDDETAILTRANSAKSISERVIS, BIAYA, KETERANGAN)
         VALUES (?, ?, ?, ?, ?)`,
        [IDSERVIS, IDLAYANANSERVIS, newId, BIAYA, KETERANGAN || null]
      );

      newId++;
    }
  },

  // Update BIAYA dan/atau KETERANGAN satu layanan — minimal salah satu harus diisi
  // Dipanggil oleh mekanik untuk menyesuaikan biaya aktual pengerjaan
  update: async (IDDETAILTRANSAKSISERVIS, data) => {
    const { BIAYA, KETERANGAN } = data;
    const updates = [];
    const values  = [];

    if (BIAYA !== undefined && BIAYA !== null) {
      if (BIAYA < 0) throw new Error('BIAYA tidak boleh negatif');
      updates.push('BIAYA = ?');
      values.push(BIAYA);
    }
    if (KETERANGAN !== undefined) {
      updates.push('KETERANGAN = ?');
      values.push(KETERANGAN);
    }
    if (updates.length === 0) throw new Error('Minimal BIAYA atau KETERANGAN harus diisi untuk update');

    values.push(IDDETAILTRANSAKSISERVIS);
    await db.query(
      `UPDATE DETAILTRANSAKSISERVIS SET ${updates.join(', ')} WHERE IDDETAILTRANSAKSISERVIS = ?`,
      values
    );

    // Kembalikan data terbaru setelah update
    const [rows] = await db.query(
      'SELECT * FROM DETAILTRANSAKSISERVIS WHERE IDDETAILTRANSAKSISERVIS = ?',
      [IDDETAILTRANSAKSISERVIS]
    );
    return rows[0];
  },

  // Hapus satu layanan dari servis by ID detail
  deleteById: async (IDDETAILTRANSAKSISERVIS) => {
    await db.query(
      'DELETE FROM DETAILTRANSAKSISERVIS WHERE IDDETAILTRANSAKSISERVIS = ?',
      [IDDETAILTRANSAKSISERVIS]
    );
  },

  // Hapus SEMUA layanan dari suatu servis — dipanggil saat seluruh servis dihapus
  delete: async (IDSERVIS) => {
    await db.query('DELETE FROM DETAILTRANSAKSISERVIS WHERE IDSERVIS = ?', [IDSERVIS]);
  },
};

module.exports = DetailTransaksiServis;
