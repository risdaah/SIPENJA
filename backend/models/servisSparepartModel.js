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

      // Kurangi stok
      await db.query(
        'UPDATE SPAREPART SET STOK = STOK - ? WHERE IDSPAREPART = ?',
        [QTY, IDSPAREPART]
      );

      newId++;
    }
  },

  update: async (IDSERVISSPAREPART, data) => {
    const { QTY } = data;

    const [old] = await db.query(
      'SELECT QTY, IDSPAREPART, HARGASATUAN FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );

    // Cek stok cukup untuk qty baru
    const qtyDiff = QTY - old[0].QTY;
    if (qtyDiff > 0) {
      const [sparepart] = await db.query(
        'SELECT STOK FROM SPAREPART WHERE IDSPAREPART = ?',
        [old[0].IDSPAREPART]
      );
      if (sparepart[0].STOK < qtyDiff) {
        throw new Error(`Stok tidak cukup, stok tersedia: ${sparepart[0].STOK}`);
      }
    }

    // Harga tetap dari master (tidak berubah)
    const HARGASATUAN = old[0].HARGASATUAN;
    const SUBTOTAL = QTY * HARGASATUAN;

    await db.query(
      'UPDATE SERVISSPAREPART SET QTY = ?, SUBTOTAL = ? WHERE IDSERVISSPAREPART = ?',
      [QTY, SUBTOTAL, IDSERVISSPAREPART]
    );

    // Adjust stok
    await db.query(
      'UPDATE SPAREPART SET STOK = STOK - ? WHERE IDSPAREPART = ?',
      [qtyDiff, old[0].IDSPAREPART]
    );

    return { IDSERVISSPAREPART, QTY, HARGASATUAN, SUBTOTAL };
  },

  deleteById: async (IDSERVISSPAREPART) => {
    const [item] = await db.query(
      'SELECT QTY, IDSPAREPART FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );

    // Kembalikan stok
    await db.query(
      'UPDATE SPAREPART SET STOK = STOK + ? WHERE IDSPAREPART = ?',
      [item[0].QTY, item[0].IDSPAREPART]
    );

    await db.query(
      'DELETE FROM SERVISSPAREPART WHERE IDSERVISSPAREPART = ?',
      [IDSERVISSPAREPART]
    );
  },

  delete: async (IDSERVIS) => {
    // Kembalikan stok semua sparepart
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