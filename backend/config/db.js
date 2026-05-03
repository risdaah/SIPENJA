const mysql = require("mysql2");
// Pastikan path dotenv ini benar jika file .env ada di folder backend
require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,

  // --- PENYESUAIAN UNTUK TIDB CLOUD ---
  ssl:
    process.env.DB_HOST && process.env.DB_HOST !== "localhost"
      ? { rejectUnauthorized: true } // Pakai SSL jika bukan localhost (TiDB butuh ini)
      : false, // Matikan SSL jika di localhost (Laragon)

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Log sederhana untuk memastikan koneksi (hanya muncul di log terminal/Vercel)
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Database connected successfully!");
    connection.release();
  }
});

module.exports = pool.promise();
