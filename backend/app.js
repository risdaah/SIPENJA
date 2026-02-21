const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/kategori-sparepart', require('./routes/kategoriSparepartRoute'));
app.use('/api/sparepart', require('./routes/sparepartRoute'));
app.use('/api/layanan-servis', require('./routes/layananServisRoute'));
app.use('/api/supplier', require('./routes/supplierRoute'));
app.use('/api/user', require('./routes/userRoute'));
app.use('/api/transaksi-pembelian-sparepart', require('./routes/transaksiPembelianSparepartRoute'));
app.use('/api/servis', require('./routes/servisRoute'));
app.use('/api/transaksi', require('./routes/transaksiRoute'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

