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
require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

const app = express();

// ── Middleware Global ──────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ══════════════════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════════════════

app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/kategori-sparepart", require("./routes/kategoriSparepartRoute"));
app.use("/api/sparepart", require("./routes/sparepartRoute"));
app.use("/api/layanan-servis", require("./routes/layananServisRoute"));
app.use("/api/supplier", require("./routes/supplierRoute"));
app.use(
  "/api/transaksi-pembelian-sparepart",
  require("./routes/transaksiPembelianSparepartRoute"),
);
app.use("/api/servis", require("./routes/servisRoute"));
app.use("/api/transaksi", require("./routes/transaksiRoute"));
app.use("/api/laporan", require("./routes/laporanRoute"));
app.use("/api/dashboard", require("./routes/dashboardRoute"));
app.use("/api/pengeluaran", require("./routes/pengeluaranRoute"));
app.use("/api/publik", require("./routes/publikRoute"));

// ══════════════════════════════════════════════════════════
//  SERVER
//  - Di lokal: app.listen() berjalan normal
//  - Di Vercel: app di-export sebagai serverless function
// ══════════════════════════════════════════════════════════
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server SIPENJA berjalan di port ${PORT}`);
  });
}

module.exports = app;
