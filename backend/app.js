const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ══════════════════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════════════════

// Auth — publik (tidak perlu token)
app.use("/api/auth", require("./routes/authRoute"));

// User
app.use("/api/user", require("./routes/userRoute"));

// Data master & transaksi
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
app.use("/api/publik", require("./routes/publikRoute")); // Route publik — tanpa authMiddleware

// ══════════════════════════════════════════════════════════
//  SERVER
// ══════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server SIPENJA berjalan di port ${PORT}`);
});
