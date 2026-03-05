const db = require("../config/db");

const ProgressServis = {
  getByServis: async (IDSERVIS) => {
    const [rows] = await db.query(
      `
      SELECT p.*
      FROM PROGRESSSERVIS p
      WHERE p.IDSERVIS = ?
      ORDER BY p.WAKTU ASC
    `,
      [IDSERVIS],
    );
    return rows;
  },

  create: async (IDSERVIS, STATUS, KETERANGAN) => {
    // Gunakan AUTO_INCREMENT — tidak perlu hitung manual
    const [result] = await db.query(
      `INSERT INTO PROGRESSSERVIS (IDSERVIS, WAKTU, STATUS, KETERANGAN)
       VALUES (?, NOW(), ?, ?)`,
      [IDSERVIS, STATUS, KETERANGAN],
    );
    return {
      IDPROGRESSERVIS: result.insertId,
      IDSERVIS,
      WAKTU: new Date(),
      STATUS,
      KETERANGAN,
    };
  },
};

module.exports = ProgressServis;
