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

const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  // Jika kamu pakai Service URI (disarankan untuk Aiven)
  uri: process.env.DATABASE_URL,

  // Jika kamu tetap ingin pakai format pisah, gunakan ini:
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,

  // KRUSIAL UNTUK AIVEN: Tambahkan konfigurasi SSL
  ssl: {
    rejectUnauthorized: true, // Aiven mendukung koneksi aman
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool.promise();
