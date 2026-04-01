/**
 * models/transaksiPembelianSparepartModel.js — Model detail pembelian sparepart
 *
 * Berinteraksi dengan tabel TRANSAKSIPEMBELIANSPAREPART.
 * Setiap row mewakili satu jenis sparepart dalam satu transaksi pembelian.
 *
 * Aturan stok yang dikelola model ini:
 *   createDetail  : Stok BERKURANG (pelanggan beli → stok keluar)
 *   updateDetail  : Stok di-adjust sesuai selisih qty baru vs lama
 *                   (beli lebih → berkurang lagi | beli kurang → sebagian dikembalikan)
 *   deleteDetail  : Stok DIKEMBALIKAN (item dibatalkan)
 *   delete        : Stok SEMUA ITEM dikembalikan (seluruh transaksi dibatalkan)
 *
 * Harga item selalu diambil dari HARGAJUAL di master SPAREPART saat transaksi dibuat.
 * Harga tidak bisa diubah setelah transaksi terbentuk (snapshot harga saat jual).
 */

const db = require('../config/db');

const TransaksiPembelianSparepart = {
  // Ambil semua transaksi pembelian (header saja, tanpa detail item)
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT t.IDTRANSAKSI, t.IDUSER, t.NOTRANSAKSI, t.TANGGAL, t.JENISTRANSAKSI, t.TOTAL, t.CATATAN,
             u.NAMA as NAMA_KASIR
      FROM TRANSAKSI t
      LEFT JOIN USER u ON t.IDUSER = u.IDUSER
      WHERE t.JENISTRANSAKSI = 'PEMBELIAN'
      ORDER BY t.TANGGAL DESC
    `);
    return rows;
  },

  // Ambil satu transaksi pembelian by ID (header saja)
  getById: async (id) => {
    const [rows] = await db.query(`
      SELECT t.IDTRANSAKSI, t.IDUSER, t.NOTRANSAKSI, t.TANGGAL, t.JENISTRANSAKSI, t.TOTAL, t.CATATAN,
             u.NAMA as NAMA_KASIR
      FROM TRANSAKSI t
      LEFT JOIN USER u ON t.IDUSER = u.IDUSER
      WHERE t.IDTRANSAKSI = ? AND t.JENISTRANSAKSI = 'PEMBELIAN'
    `, [id]);
    return rows[0];
  },

  // Ambil semua item detail dari satu transaksi pembelian
  getDetailByTransaksi: async (IDTRANSAKSI) => {
    const [rows] = await db.query(`
      SELECT tp.IDTRANSAKSI, tp.IDSPAREPART, tp.IDBELISPAREPART, tp.JUMLAH, tp.HARGA_SATUAN, tp.SUB_TOTAL,
             s.NAMA as NAMA_SPAREPART, s.KODESPAREPART
      FROM TRANSAKSIPEMBELIANSPAREPART tp
      LEFT JOIN SPAREPART s ON tp.IDSPAREPART = s.IDSPAREPART
      WHERE tp.IDTRANSAKSI = ?
    `, [IDTRANSAKSI]);
    return rows;
  },

  // Ambil satu item detail by ID item (IDBELISPAREPART)
  getDetailById: async (IDBELISPAREPART) => {
    const [rows] = await db.query(
      'SELECT * FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDBELISPAREPART = ?',
      [IDBELISPAREPART]
    );
    return rows[0];
  },

  // Filter transaksi pembelian berdasarkan rentang tanggal
  getByDateRange: async (startDate, endDate) => {
    const [rows] = await db.query(`
      SELECT t.IDTRANSAKSI, t.IDUSER, t.NOTRANSAKSI, t.TANGGAL, t.JENISTRANSAKSI, t.TOTAL, t.CATATAN,
             u.NAMA as NAMA_KASIR
      FROM TRANSAKSI t
      LEFT JOIN USER u ON t.IDUSER = u.IDUSER
      WHERE t.JENISTRANSAKSI = 'PEMBELIAN'
        AND DATE(t.TANGGAL) BETWEEN ? AND ?
      ORDER BY t.TANGGAL DESC
    `, [startDate, endDate]);
    return rows;
  },

  // Buat detail item pembelian — harga dari master, stok berkurang otomatis per item
  createDetail: async (IDTRANSAKSI, ITEMS) => {
    const [lastRow] = await db.query('SELECT MAX(IDBELISPAREPART) as lastId FROM TRANSAKSIPEMBELIANSPAREPART');
    let newId = (lastRow[0].lastId || 0) + 1;

    for (const item of ITEMS) {
      const { IDSPAREPART, JUMLAH } = item;

      if (!IDSPAREPART || !JUMLAH || JUMLAH <= 0) {
        throw new Error('IDSPAREPART dan JUMLAH (> 0) wajib diisi pada setiap item');
      }

      // Ambil harga jual dan stok saat ini dari master
      const [sparepart] = await db.query(
        'SELECT HARGAJUAL, STOK FROM SPAREPART WHERE IDSPAREPART = ?',
        [IDSPAREPART]
      );
      if (!sparepart[0]) throw new Error(`Sparepart dengan ID ${IDSPAREPART} tidak ditemukan`);
      if (sparepart[0].STOK < JUMLAH) throw new Error(`Stok sparepart tidak cukup, stok tersedia: ${sparepart[0].STOK}`);

      // Snapshot harga saat transaksi (tidak berubah meskipun harga master diubah nantinya)
      const HARGA_SATUAN = sparepart[0].HARGAJUAL;
      const SUB_TOTAL    = JUMLAH * HARGA_SATUAN;

      await db.query(
        `INSERT INTO TRANSAKSIPEMBELIANSPAREPART (IDTRANSAKSI, IDSPAREPART, IDBELISPAREPART, JUMLAH, HARGA_SATUAN, SUB_TOTAL)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [IDTRANSAKSI, IDSPAREPART, newId, JUMLAH, HARGA_SATUAN, SUB_TOTAL]
      );

      // Kurangi stok (pelanggan membeli)
      await db.query(
        'UPDATE SPAREPART SET STOK = STOK - ? WHERE IDSPAREPART = ?',
        [JUMLAH, IDSPAREPART]
      );

      newId++;
    }
  },

  // Update qty satu item — harga tetap dari data tersimpan, stok di-adjust sesuai selisih
  updateDetail: async (IDBELISPAREPART, data) => {
    const { JUMLAH } = data;
    if (!JUMLAH || JUMLAH <= 0) throw new Error('JUMLAH harus lebih dari 0');

    const [oldRows] = await db.query(
      'SELECT JUMLAH, IDSPAREPART, HARGA_SATUAN, IDTRANSAKSI FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDBELISPAREPART = ?',
      [IDBELISPAREPART]
    );
    if (!oldRows[0]) throw new Error('Item pembelian tidak ditemukan');

    const old        = oldRows[0];
    const jumlahDiff = JUMLAH - old.JUMLAH; // Positif = beli lebih, negatif = beli kurang

    // Cek stok cukup jika jumlah bertambah
    if (jumlahDiff > 0) {
      const [sparepart] = await db.query('SELECT STOK FROM SPAREPART WHERE IDSPAREPART = ?', [old.IDSPAREPART]);
      if (sparepart[0].STOK < jumlahDiff) throw new Error(`Stok tidak cukup, stok tersedia: ${sparepart[0].STOK}`);
    }

    // Harga tetap dari saat transaksi dibuat (snapshot)
    const HARGA_SATUAN = old.HARGA_SATUAN;
    const SUB_TOTAL    = JUMLAH * HARGA_SATUAN;

    await db.query(
      'UPDATE TRANSAKSIPEMBELIANSPAREPART SET JUMLAH = ?, SUB_TOTAL = ? WHERE IDBELISPAREPART = ?',
      [JUMLAH, SUB_TOTAL, IDBELISPAREPART]
    );

    // Adjust stok: selisih positif → stok berkurang lagi, selisih negatif → stok sebagian kembali
    await db.query(
      'UPDATE SPAREPART SET STOK = STOK - ? WHERE IDSPAREPART = ?',
      [jumlahDiff, old.IDSPAREPART]
    );

    // Recalculate TOTAL transaksi induk
    const [totalRows] = await db.query(
      'SELECT COALESCE(SUM(SUB_TOTAL), 0) as total FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?',
      [old.IDTRANSAKSI]
    );
    await db.query(
      'UPDATE TRANSAKSI SET TOTAL = ? WHERE IDTRANSAKSI = ?',
      [totalRows[0].total, old.IDTRANSAKSI]
    );

    return { IDBELISPAREPART, JUMLAH, HARGA_SATUAN, SUB_TOTAL };
  },

  // Hapus satu item — stok dikembalikan, TOTAL transaksi di-recalculate
  deleteDetail: async (IDBELISPAREPART) => {
    const [itemRows] = await db.query(
      'SELECT JUMLAH, IDSPAREPART, IDTRANSAKSI FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDBELISPAREPART = ?',
      [IDBELISPAREPART]
    );
    if (!itemRows[0]) throw new Error('Item pembelian tidak ditemukan');

    const item = itemRows[0];

    // Kembalikan stok karena item dibatalkan
    await db.query(
      'UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?',
      [item.JUMLAH, item.IDSPAREPART]
    );

    await db.query(
      'DELETE FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDBELISPAREPART = ?',
      [IDBELISPAREPART]
    );

    // Recalculate TOTAL transaksi induk setelah item dihapus
    const [totalRows] = await db.query(
      'SELECT COALESCE(SUM(SUB_TOTAL), 0) as total FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?',
      [item.IDTRANSAKSI]
    );
    await db.query(
      'UPDATE TRANSAKSI SET TOTAL = ? WHERE IDTRANSAKSI = ?',
      [totalRows[0].total, item.IDTRANSAKSI]
    );
  },

  // Update catatan transaksi induk
  updateCatatan: async (IDTRANSAKSI, CATATAN) => {
    await db.query(
      'UPDATE TRANSAKSI SET CATATAN = ? WHERE IDTRANSAKSI = ?',
      [CATATAN, IDTRANSAKSI]
    );
  },

  // Hapus seluruh transaksi pembelian — semua stok item dikembalikan terlebih dahulu
  delete: async (IDTRANSAKSI) => {
    const [items] = await db.query(
      'SELECT JUMLAH, IDSPAREPART FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?',
      [IDTRANSAKSI]
    );

    // Kembalikan stok semua item sebelum menghapus transaksi
    for (const item of items) {
      await db.query(
        'UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?',
        [item.JUMLAH, item.IDSPAREPART]
      );
    }

    // Hapus detail dulu (FK constraint), baru hapus header transaksi
    await db.query('DELETE FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?', [IDTRANSAKSI]);
    await db.query('DELETE FROM TRANSAKSI WHERE IDTRANSAKSI = ?', [IDTRANSAKSI]);
  },
};

module.exports = TransaksiPembelianSparepart;
