/**
 * config/db.js — Konfigurasi koneksi database MySQL
 *
 * Membuat connection pool ke MySQL menggunakan kredensial dari .env:
 *   DB_HOST     = host server database (contoh: localhost)
 *   DB_USER     = username MySQL
 *   DB_PASSWORD = password MySQL
 *   DB_NAME     = nama database (contoh: sipenja)
 *
 * Menggunakan pool (bukan single connection) agar aplikasi dapat
 * menangani banyak request secara bersamaan tanpa membuat koneksi baru
 * setiap kali ada query.
 *
 * Module ini diekspor sebagai Promise-based pool (pool.promise()),
 * sehingga semua query bisa menggunakan async/await:
 *   const [rows] = await db.query('SELECT * FROM ...');
 */

const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Export sebagai promise pool agar bisa digunakan dengan async/await
module.exports = pool.promise();
