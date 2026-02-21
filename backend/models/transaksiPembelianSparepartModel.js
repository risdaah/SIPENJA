const db = require('../config/db');

const TransaksiPembelianSparepart = {
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

  getDetailById: async (IDBELISPAREPART) => {
    const [rows] = await db.query(
      'SELECT * FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDBELISPAREPART = ?',
      [IDBELISPAREPART]
    );
    return rows[0];
  },

  createDetail: async (IDTRANSAKSI, ITEMS) => {
    const [lastRow] = await db.query('SELECT MAX(IDBELISPAREPART) as lastId FROM TRANSAKSIPEMBELIANSPAREPART');
    let newId = (lastRow[0].lastId || 0) + 1;

    for (const item of ITEMS) {
      const { IDSPAREPART, JUMLAH } = item;

      // Ambil harga dari tabel master SPAREPART
      const [sparepart] = await db.query(
        'SELECT HARGAJUAL, STOK FROM SPAREPART WHERE IDSPAREPART = ?',
        [IDSPAREPART]
      );

      if (!sparepart[0]) {
        throw new Error(`Sparepart dengan ID ${IDSPAREPART} tidak ditemukan`);
      }
      if (sparepart[0].STOK < JUMLAH) {
        throw new Error(`Stok sparepart tidak cukup, stok tersedia: ${sparepart[0].STOK}`);
      }

      const HARGA_SATUAN = sparepart[0].HARGAJUAL;
      const SUB_TOTAL = JUMLAH * HARGA_SATUAN;

      await db.query(
        `INSERT INTO TRANSAKSIPEMBELIANSPAREPART (IDTRANSAKSI, IDSPAREPART, IDBELISPAREPART, JUMLAH, HARGA_SATUAN, SUB_TOTAL)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [IDTRANSAKSI, IDSPAREPART, newId, JUMLAH, HARGA_SATUAN, SUB_TOTAL]
      );

      // Pelanggan beli → stok berkurang
      await db.query(
        'UPDATE SPAREPART SET STOK = STOK - ? WHERE IDSPAREPART = ?',
        [JUMLAH, IDSPAREPART]
      );

      newId++;
    }
  },

  updateDetail: async (IDBELISPAREPART, data) => {
    const { JUMLAH } = data;

    const [old] = await db.query(
      'SELECT JUMLAH, IDSPAREPART, HARGA_SATUAN, IDTRANSAKSI FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDBELISPAREPART = ?',
      [IDBELISPAREPART]
    );

    const jumlahDiff = JUMLAH - old[0].JUMLAH;

    // Cek stok cukup jika jumlah bertambah
    if (jumlahDiff > 0) {
      const [sparepart] = await db.query(
        'SELECT STOK FROM SPAREPART WHERE IDSPAREPART = ?',
        [old[0].IDSPAREPART]
      );
      if (sparepart[0].STOK < jumlahDiff) {
        throw new Error(`Stok tidak cukup, stok tersedia: ${sparepart[0].STOK}`);
      }
    }

    // Harga tetap dari master
    const HARGA_SATUAN = old[0].HARGA_SATUAN;
    const SUB_TOTAL = JUMLAH * HARGA_SATUAN;

    await db.query(
      'UPDATE TRANSAKSIPEMBELIANSPAREPART SET JUMLAH = ?, SUB_TOTAL = ? WHERE IDBELISPAREPART = ?',
      [JUMLAH, SUB_TOTAL, IDBELISPAREPART]
    );

    // jumlahDiff positif = beli lebih banyak = stok berkurang
    // jumlahDiff negatif = beli lebih sedikit = stok dikembalikan
    await db.query(
      'UPDATE SPAREPART SET STOK = STOK - ? WHERE IDSPAREPART = ?',
      [jumlahDiff, old[0].IDSPAREPART]
    );

    // Recalculate TOTAL transaksi
    const [total] = await db.query(
      'SELECT COALESCE(SUM(SUB_TOTAL), 0) as total FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?',
      [old[0].IDTRANSAKSI]
    );
    await db.query(
      'UPDATE TRANSAKSI SET TOTAL = ? WHERE IDTRANSAKSI = ?',
      [total[0].total, old[0].IDTRANSAKSI]
    );

    return { IDBELISPAREPART, JUMLAH, HARGA_SATUAN, SUB_TOTAL };
  },

  deleteDetail: async (IDBELISPAREPART) => {
    const [item] = await db.query(
      'SELECT JUMLAH, IDSPAREPART, IDTRANSAKSI FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDBELISPAREPART = ?',
      [IDBELISPAREPART]
    );

    // Transaksi dibatalkan → stok dikembalikan
    await db.query(
      'UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?',
      [item[0].JUMLAH, item[0].IDSPAREPART]
    );

    await db.query(
      'DELETE FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDBELISPAREPART = ?',
      [IDBELISPAREPART]
    );

    // Recalculate TOTAL
    const [total] = await db.query(
      'SELECT COALESCE(SUM(SUB_TOTAL), 0) as total FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?',
      [item[0].IDTRANSAKSI]
    );
    await db.query(
      'UPDATE TRANSAKSI SET TOTAL = ? WHERE IDTRANSAKSI = ?',
      [total[0].total, item[0].IDTRANSAKSI]
    );
  },

  updateCatatan: async (IDTRANSAKSI, CATATAN) => {
    await db.query(
      'UPDATE TRANSAKSI SET CATATAN = ? WHERE IDTRANSAKSI = ?',
      [CATATAN, IDTRANSAKSI]
    );
  },

  delete: async (IDTRANSAKSI) => {
    const [items] = await db.query(
      'SELECT JUMLAH, IDSPAREPART FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?',
      [IDTRANSAKSI]
    );

    // Transaksi dihapus → stok semua item dikembalikan
    for (const item of items) {
      await db.query(
        'UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?',
        [item.JUMLAH, item.IDSPAREPART]
      );
    }

    await db.query('DELETE FROM TRANSAKSIPEMBELIANSPAREPART WHERE IDTRANSAKSI = ?', [IDTRANSAKSI]);
    await db.query('DELETE FROM TRANSAKSI WHERE IDTRANSAKSI = ?', [IDTRANSAKSI]);
  },
};

module.exports = TransaksiPembelianSparepart;