const db = require('../config/db');

const ServisSparepart = {
  getByServis: async (IDSERVIS) => {
    const [rows] = await db.query(`
      SELECT ss.*, s.NAMA as NAMA_SPAREPART, s.KODESPAREPART, s.HARGAJUAL
      FROM SERVISSPAREPART ss
      LEFT JOIN SPAREPART s ON ss.IDSPAREPART = s.IDSPAREPART
      WHERE ss.IDSERVIS = ?
    `, [IDSERVIS]);
    return rows;
  },

  getById: async (IDSERVISSPAREPART) => {
    const [rows] = await db.query(
      'SELECT * FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );
    return rows[0];
  },

  create: async (IDSERVIS, ITEMS) => {
    const [lastRow] = await db.query('SELECT MAX(IDSERVISSPAREPART) as lastId FROM SERVISSPAREPART');
    let newId = (lastRow[0].lastId || 0) + 1;

    for (const item of ITEMS) {
      const { IDSPAREPART, QTY } = item;

      // Validasi IDSPAREPART dan QTY wajib ada
      if (!IDSPAREPART || !QTY || QTY <= 0) {
        throw new Error('IDSPAREPART dan QTY (> 0) wajib diisi pada setiap item');
      }

      // Ambil harga dari tabel master SPAREPART
      const [sparepart] = await db.query(
        'SELECT HARGAJUAL, STOK FROM SPAREPART WHERE IDSPAREPART = ?',
        [IDSPAREPART]
      );

      if (!sparepart[0]) {
        throw new Error(`Sparepart dengan ID ${IDSPAREPART} tidak ditemukan`);
      }
      if (sparepart[0].STOK < QTY) {
        throw new Error(`Stok sparepart ID ${IDSPAREPART} tidak cukup, stok tersedia: ${sparepart[0].STOK}`);
      }

      const HARGASATUAN = sparepart[0].HARGAJUAL;
      const SUBTOTAL = QTY * HARGASATUAN;

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

  update: async (IDSERVISSPAREPART, data) => {
    const { QTY } = data;

    if (!QTY || QTY <= 0) {
      throw new Error('QTY harus lebih dari 0');
    }

    const [oldRows] = await db.query(
      'SELECT QTY, IDSPAREPART, HARGASATUAN FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );

    if (!oldRows[0]) {
      throw new Error('Sparepart servis tidak ditemukan');
    }

    const old = oldRows[0];
    const qtyDiff = QTY - old.QTY;

    // Cek stok cukup untuk qty baru jika bertambah
    if (qtyDiff > 0) {
      const [sparepart] = await db.query(
        'SELECT STOK FROM SPAREPART WHERE IDSPAREPART = ?',
        [old.IDSPAREPART]
      );
      if (sparepart[0].STOK < qtyDiff) {
        throw new Error(`Stok tidak cukup, stok tersedia: ${sparepart[0].STOK}`);
      }
    }

    // Harga tetap dari data yang sudah tersimpan (tidak berubah)
    const HARGASATUAN = old.HARGASATUAN;
    const SUBTOTAL = QTY * HARGASATUAN;

    await db.query(
      'UPDATE SERVISSPAREPART SET QTY = ?, SUBTOTAL = ? WHERE IDSERVISSPAREPART = ?',
      [QTY, SUBTOTAL, IDSERVISSPAREPART]
    );

    // Adjust stok: positif = tambah pakai (stok berkurang), negatif = kurang pakai (stok kembali)
    await db.query(
      'UPDATE SPAREPART SET STOK = STOK - ? WHERE IDSPAREPART = ?',
      [qtyDiff, old.IDSPAREPART]
    );

    return { IDSERVISSPAREPART, QTY, HARGASATUAN, SUBTOTAL };
  },

  deleteById: async (IDSERVISSPAREPART) => {
    const [itemRows] = await db.query(
      'SELECT QTY, IDSPAREPART FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );

    if (!itemRows[0]) {
      throw new Error('Sparepart servis tidak ditemukan');
    }

    // Kembalikan stok
    await db.query(
      'UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?',
      [itemRows[0].QTY, itemRows[0].IDSPAREPART]
    );

    await db.query(
      'DELETE FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );
  },

  // Digunakan saat delete seluruh servis
  delete: async (IDSERVIS) => {
    const [items] = await db.query(
      'SELECT QTY, IDSPAREPART FROM SERVISSPAREPART WHERE IDSERVIS = ?',
      [IDSERVIS]
    );
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