/**
 * app.js — Entry point utama server SIPENJA
 *
 * File ini bertanggung jawab untuk:
 *   1. Menginisialisasi aplikasi Express
 *   2. Mendaftarkan semua middleware global (CORS, JSON parser)
 *   3. Mendaftarkan semua route API
 *   4. Menjalankan server pada port yang ditentukan (.env atau default 3000)
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Muat variabel dari file .env (DB_HOST, JWT_SECRET, PORT, dll.)

const app = express();

// ── Middleware Global ──────────────────────────────────────────────────────────
app.use(cors());          // Izinkan request dari origin berbeda (frontend di port lain)
app.use(express.json());  // Parse body request bertipe application/json

// ══════════════════════════════════════════════════════════
//  ROUTES
//  Setiap route dikelompokkan berdasarkan fitur/domain.
//  Semua route diawali dengan /api/
// ══════════════════════════════════════════════════════════

// Auth — publik (tidak perlu token)
// Menangani login, cek user aktif (me), dan logout
app.use("/api/auth", require("./routes/authRoute"));

// User — manajemen akun karyawan (hanya admin)
// CRUD user: kasir, mekanik, admin
app.use("/api/user", require("./routes/userRoute"));

// Kategori Sparepart — pengelompokan jenis sparepart (contoh: Oli, Filter, Rem)
app.use("/api/kategori-sparepart", require("./routes/kategoriSparepartRoute"));

// Sparepart — data barang/suku cadang beserta stok dan harga jual
app.use("/api/sparepart", require("./routes/sparepartRoute"));

// Layanan Servis — daftar jenis pekerjaan servis dan biaya pokoknya
app.use("/api/layanan-servis", require("./routes/layananServisRoute"));

// Supplier — data pemasok/vendor sparepart
app.use("/api/supplier", require("./routes/supplierRoute"));

// Transaksi Pembelian Sparepart — pelanggan membeli sparepart langsung (tanpa servis)
app.use(
  "/api/transaksi-pembelian-sparepart",
  require("./routes/transaksiPembelianSparepartRoute"),
);

// Servis — data pekerjaan servis kendaraan (progress, sparepart pakai, dll.)
app.use("/api/servis", require("./routes/servisRoute"));

// Transaksi — induk semua transaksi (SERVIS & PEMBELIAN)
// Berisi no. transaksi, tanggal, kasir, dan total
app.use("/api/transaksi", require("./routes/transaksiRoute"));

// Laporan — generate laporan sparepart & laporan servis dalam periode tertentu
app.use("/api/laporan", require("./routes/laporanRoute"));

// Dashboard — data statistik, keuangan, grafik, dan ranking untuk halaman admin
app.use("/api/dashboard", require("./routes/dashboardRoute"));

// Pengeluaran — pencatatan pengisian stok sparepart (pembelian ke supplier)
app.use("/api/pengeluaran", require("./routes/pengeluaranRoute"));

// Publik — route tanpa authMiddleware, bisa diakses siapapun
// Contoh: pelanggan cek status servis via kode antrian
app.use("/api/publik", require("./routes/publikRoute"));

// ══════════════════════════════════════════════════════════
//  SERVER — Jalankan Express di port yang ditentukan
// ══════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server SIPENJA berjalan di port ${PORT}`);
});
