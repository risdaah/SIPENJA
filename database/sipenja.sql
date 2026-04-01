-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 17, 2026 at 01:10 PM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sipenja`
--

-- --------------------------------------------------------

--
-- Table structure for table `detailtransaksiservis`
--

CREATE TABLE `detailtransaksiservis` (
  `IDSERVIS` int NOT NULL,
  `IDLAYANANSERVIS` int NOT NULL,
  `IDDETAILTRANSAKSISERVIS` int NOT NULL,
  `BIAYA` decimal(10,0) DEFAULT NULL,
  `KETERANGAN` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `detailtransaksiservis`
--

INSERT INTO `detailtransaksiservis` (`IDSERVIS`, `IDLAYANANSERVIS`, `IDDETAILTRANSAKSISERVIS`, `BIAYA`, `KETERANGAN`) VALUES
(1, 4, 1, '5000', NULL),
(2, 2, 2, '10000', NULL),
(2, 3, 3, '20000', NULL),
(2, 4, 4, '5000', NULL),
(3, 1, 6, '15000', NULL),
(3, 4, 5, '5000', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `kategorisparepart`
--

CREATE TABLE `kategorisparepart` (
  `IDKATEGORI` int NOT NULL,
  `NAMA` varchar(255) DEFAULT NULL,
  `KODE` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `kategorisparepart`
--

INSERT INTO `kategorisparepart` (`IDKATEGORI`, `NAMA`, `KODE`) VALUES
(1, 'Oli dan Pelumas', 'OLI'),
(2, 'Baut dan Mur', 'BTL'),
(3, 'Suspensi', 'SSP'),
(4, 'Ban', 'BAN'),
(5, 'Filter', 'FLT'),
(6, 'Kampas dan Cakram', 'REM');

-- --------------------------------------------------------

--
-- Table structure for table `layananservis`
--

CREATE TABLE `layananservis` (
  `IDLAYANANSERVIS` int NOT NULL,
  `KODELAYANAN` varchar(50) DEFAULT NULL,
  `NAMA` varchar(255) DEFAULT NULL,
  `BIAYAPOKOK` decimal(10,0) DEFAULT NULL,
  `DESKRIPSI` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `layananservis`
--

INSERT INTO `layananservis` (`IDLAYANANSERVIS`, `KODELAYANAN`, `NAMA`, `BIAYAPOKOK`, `DESKRIPSI`) VALUES
(1, 'SRV-1', 'Tambal Ban', '15000', ''),
(2, 'SRV-2', 'Ganti Ban Dalam', '10000', ''),
(3, 'SRV-3', 'Ganti Ban Luar', '20000', ''),
(4, 'SRV-4', 'Ganti Oli', '5000', ''),
(5, 'SRV-5', 'Ganti Kampas Rem', '10000', ''),
(6, 'SRV-6', 'Ganti Ruji', '20000', ''),
(7, 'SRV-7', 'Ganti Oli Samping', '5000', '');

-- --------------------------------------------------------

--
-- Table structure for table `pengeluaran`
--

CREATE TABLE `pengeluaran` (
  `IDPENGELUARAN` int NOT NULL,
  `IDUSER` int NOT NULL,
  `IDSPAREPART` int NOT NULL,
  `TANGGAL` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `QTY` int NOT NULL,
  `HARGA_BELI` decimal(10,0) NOT NULL,
  `TOTAL` decimal(10,0) NOT NULL,
  `KETERANGAN` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `pengeluaran`
--

INSERT INTO `pengeluaran` (`IDPENGELUARAN`, `IDUSER`, `IDSPAREPART`, `TANGGAL`, `QTY`, `HARGA_BELI`, `TOTAL`, `KETERANGAN`) VALUES
(1, 2, 2, '2026-03-13 05:19:03', 3, '45000', '135000', NULL),
(2, 1, 1, '2026-03-13 05:50:26', 1, '40000', '40000', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `progressservis`
--

CREATE TABLE `progressservis` (
  `IDPROGRESSERVIS` int NOT NULL,
  `IDSERVIS` int NOT NULL,
  `WAKTU` datetime DEFAULT NULL,
  `STATUS` varchar(15) DEFAULT NULL,
  `KETERANGAN` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `progressservis`
--

INSERT INTO `progressservis` (`IDPROGRESSERVIS`, `IDSERVIS`, `WAKTU`, `STATUS`, `KETERANGAN`) VALUES
(5, 1, '2026-03-04 02:32:04', 'Belum', 'Kendaraan masuk, menunggu dikerjakan'),
(6, 1, '2026-03-06 11:21:12', 'Dalam Proses', 'Sedang dalam proses penggantian oli'),
(7, 1, '2026-03-06 11:23:33', 'Selesai', 'Kendaraan selesai dikerjakan dan siap diambil'),
(8, 2, '2026-03-09 22:46:10', 'Belum', 'Kendaraan masuk, menunggu dikerjakan'),
(9, 2, '2026-03-09 22:48:09', 'Dalam Proses', 'sedang ganti ban dalam'),
(10, 2, '2026-03-09 22:48:19', 'Dalam Proses', 'sedang ganti ban luar'),
(11, 2, '2026-03-10 01:44:35', 'Dalam Proses', 'Kendaraan sedang dikerjakan'),
(12, 2, '2026-03-10 01:44:42', 'Selesai', 'Kendaraan selesai dikerjakan dan siap diambil'),
(13, 3, '2026-03-11 23:16:43', 'Belum', 'Kendaraan masuk, menunggu dikerjakan'),
(14, 3, '2026-03-11 23:30:54', 'Dalam Proses', 'sedang ganti oli'),
(15, 3, '2026-03-14 22:48:44', 'Selesai', 'Kendaraan selesai dikerjakan dan siap diambil');

-- --------------------------------------------------------

--
-- Table structure for table `servis`
--

CREATE TABLE `servis` (
  `IDSERVIS` int NOT NULL,
  `IDUSER` int NOT NULL,
  `IDTRANSAKSI` int DEFAULT NULL,
  `KODEANTRIAN` varchar(50) DEFAULT NULL,
  `TANGGALMASUK` datetime DEFAULT NULL,
  `TANGGALSELESAI` datetime DEFAULT NULL,
  `STATUS` varchar(15) DEFAULT NULL,
  `KELUHAN` text,
  `NAMAPELANGGAN` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `servis`
--

INSERT INTO `servis` (`IDSERVIS`, `IDUSER`, `IDTRANSAKSI`, `KODEANTRIAN`, `TANGGALMASUK`, `TANGGALSELESAI`, `STATUS`, `KELUHAN`, `NAMAPELANGGAN`) VALUES
(1, 3, 1, 'SRV-20260303-001', '2026-03-04 02:32:04', '2026-03-06 11:23:33', 'Selesai', '-', 'Bambang'),
(2, 3, 3, 'SRV-20260309-001', '2026-03-09 22:46:11', '2026-03-10 01:44:43', 'Selesai', 'Ban Bocor', 'Rama'),
(3, 3, 4, 'SRV-20260311-001', '2026-03-11 23:16:43', '2026-03-14 22:48:44', 'Selesai', '-', 'Nia');

-- --------------------------------------------------------

--
-- Table structure for table `servissparepart`
--

CREATE TABLE `servissparepart` (
  `IDSERVIS` int NOT NULL,
  `IDSPAREPART` int NOT NULL,
  `IDSERVISSPAREPART` int NOT NULL,
  `QTY` int DEFAULT NULL,
  `HARGASATUAN` decimal(10,0) DEFAULT NULL,
  `SUBTOTAL` decimal(10,0) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `servissparepart`
--

INSERT INTO `servissparepart` (`IDSERVIS`, `IDSPAREPART`, `IDSERVISSPAREPART`, `QTY`, `HARGASATUAN`, `SUBTOTAL`) VALUES
(1, 2, 2, 1, '55000', '55000'),
(2, 6, 3, 1, '55000', '55000'),
(3, 11, 5, 1, '50000', '50000');

-- --------------------------------------------------------

--
-- Table structure for table `sparepart`
--

CREATE TABLE `sparepart` (
  `IDSPAREPART` int NOT NULL,
  `IDKATEGORI` int DEFAULT NULL,
  `IDSUPPLIER` int NOT NULL,
  `KODESPAREPART` varchar(50) DEFAULT NULL,
  `NAMA` varchar(255) DEFAULT NULL,
  `HARGAJUAL` decimal(10,0) DEFAULT NULL,
  `STOK` int DEFAULT NULL,
  `STOKMINIMUM` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sparepart`
--

INSERT INTO `sparepart` (`IDSPAREPART`, `IDKATEGORI`, `IDSUPPLIER`, `KODESPAREPART`, `NAMA`, `HARGAJUAL`, `STOK`, `STOKMINIMUM`) VALUES
(1, 1, 8, 'OLI-1', 'AHM OLI SPX-2 (0.8 L)', '50000', 20, 5),
(2, 1, 8, 'OLI-2', 'AHM OLI SPX-2 (1 L)', '55000', 17, 5),
(3, 1, 8, 'OLI-3', 'AHM MPX-1 (0.8 L)', '50000', 15, 5),
(4, 1, 8, 'OLI-4', 'AHM MPX-1(1 L)', '55000', 15, 5),
(5, 1, 4, 'OLI-5', 'SHELL AX3 (0.8 L)', '55000', 15, 5),
(6, 1, 4, 'OLI-6', 'SHELL AX7 (0.8 L)', '55000', 14, 5),
(7, 1, 4, 'OLI-7', 'SHELL HELIX AX-5 (1 L)', '65000', 15, 5),
(8, 1, 1, 'OLI-8', 'YAMALUBE Super Matic (1 L)', '55000', 4, 5),
(9, 1, 1, 'OLI-9', 'YAMALUBE 20W (0.8 L)', '50000', 15, 5),
(10, 1, 1, 'OLI-10', 'YAMALUBE SILVER (0.8 L)', '50000', 5, 5),
(11, 1, 8, 'OLI-11', 'FEDERAL ULTRATEC 20W-50 (0.8 L)', '50000', 14, 5),
(12, 1, 8, 'OLI-12', 'FEDERAL ULTRATEC 20W-50 (1 L)', '55000', 15, 5),
(13, 1, 8, 'OLI-13', 'FEDERAL ULTRATEC 10W-30 (0.8 L)', '45000', 15, 5),
(14, 1, 8, 'OLI-14', 'FEDERAL ULTRATEC 20W-40 (0.8 L)', '45000', 15, 5);

-- --------------------------------------------------------

--
-- Table structure for table `supplier`
--

CREATE TABLE `supplier` (
  `IDSUPPLIER` int NOT NULL,
  `NAMA` varchar(255) DEFAULT NULL,
  `NOHP` varchar(50) DEFAULT NULL,
  `ALAMAT` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `supplier`
--

INSERT INTO `supplier` (`IDSUPPLIER`, `NAMA`, `NOHP`, `ALAMAT`) VALUES
(1, 'Toko Sepeda Ali Jaya', '', 'Kec. Porong, Kab. Sidoarjo, Prov. Jawa Timur'),
(2, 'Mustika Motor', '', 'Kota Surabaya, Prov. Jawa Timur'),
(3, 'Cahaya Motor', '', 'Kota Surabaya, Prov. Jawa Timur'),
(4, 'Oli Motor 99', '', 'Kota Surabaya, Prov. Jawa Timur'),
(5, 'Mawise Motor Parts', '', 'Kab. Sidoarjo, Prov. Jawa Timur'),
(6, 'Gacoan Motor', '', 'Kota Surabaya, Prov. Jawa Timur'),
(7, 'HMN AUTOPART', '', 'Kota Tanggerang, Prov. Banten'),
(8, 'FLOWERSHOPIDN', '', 'Kota Surabaya, Prov. Jawa Timur');

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `IDTRANSAKSI` int NOT NULL,
  `IDUSER` int NOT NULL,
  `NOTRANSAKSI` varchar(50) DEFAULT NULL,
  `TANGGAL` datetime DEFAULT NULL,
  `JENISTRANSAKSI` varchar(20) DEFAULT NULL,
  `TOTAL` decimal(10,0) DEFAULT NULL,
  `CATATAN` text,
  `NOHP` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transaksi`
--

INSERT INTO `transaksi` (`IDTRANSAKSI`, `IDUSER`, `NOTRANSAKSI`, `TANGGAL`, `JENISTRANSAKSI`, `TOTAL`, `CATATAN`, `NOHP`) VALUES
(1, 2, 'TRX-SRV-20260303-001', '2026-03-04 02:32:04', 'SERVIS', '150000', '-', '083891942279'),
(2, 2, 'TRX-PBL-20260303-001', '2026-03-04 02:32:50', 'PEMBELIAN', '150000', 'beli 3 produk', NULL),
(3, 2, 'TRX-SRV-20260309-001', '2026-03-09 22:46:11', 'SERVIS', '90000', 'Ban Bocor', NULL),
(4, 2, 'TRX-SRV-20260311-001', '2026-03-11 23:16:43', 'SERVIS', '70000', '-', NULL),
(5, 2, 'TRX-PBL-20260315-001', '2026-03-15 16:05:28', 'PEMBELIAN', '605000', NULL, NULL),
(6, 2, 'TRX-PBL-20260315-002', '2026-03-15 16:32:58', 'PEMBELIAN', '500000', NULL, '083891942279');

-- --------------------------------------------------------

--
-- Table structure for table `transaksipembeliansparepart`
--

CREATE TABLE `transaksipembeliansparepart` (
  `IDTRANSAKSI` int NOT NULL,
  `IDSPAREPART` int NOT NULL,
  `IDBELISPAREPART` int NOT NULL,
  `JUMLAH` int DEFAULT NULL,
  `HARGA_SATUAN` decimal(10,0) DEFAULT NULL,
  `SUB_TOTAL` decimal(10,0) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transaksipembeliansparepart`
--

INSERT INTO `transaksipembeliansparepart` (`IDTRANSAKSI`, `IDSPAREPART`, `IDBELISPAREPART`, `JUMLAH`, `HARGA_SATUAN`, `SUB_TOTAL`) VALUES
(2, 1, 1, 3, '50000', '150000'),
(5, 8, 2, 11, '55000', '605000'),
(6, 10, 3, 10, '50000', '500000');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `IDUSER` int NOT NULL,
  `NAMA` varchar(255) DEFAULT NULL,
  `USERNAME` varchar(255) DEFAULT NULL,
  `TANGGALLAHIR` date DEFAULT NULL,
  `JENISKELAMIN` varchar(15) DEFAULT NULL,
  `ROLE` varchar(10) DEFAULT NULL,
  `PASSWORD` varchar(255) DEFAULT NULL,
  `STATUS` varchar(15) DEFAULT NULL,
  `DATECREATED` datetime DEFAULT NULL,
  `LASTLOGIN` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`IDUSER`, `NAMA`, `USERNAME`, `TANGGALLAHIR`, `JENISKELAMIN`, `ROLE`, `PASSWORD`, `STATUS`, `DATECREATED`, `LASTLOGIN`) VALUES
(1, 'Puji Yuliani', 'py.ani', '2003-07-08', 'PEREMPUAN', 'admin', '$2b$10$8F9VGyB4DgRUQzgZylh5a./XsTdG4jHxS99XUrBuo4yi0aKQlkBPi', 'AKTIF', '2026-02-20 12:58:49', '2026-03-17 19:28:37'),
(2, 'Pamuji Slamet', 'pakslamet', '1970-10-09', 'Laki-laki', 'kasir', '$2b$10$G6gpBTPhCZciIvz5IesVQO7qf7E2wnFQhqGKXXvtK9hxQ8EzPMe8G', 'AKTIF', '2026-02-20 13:00:29', '2026-03-17 19:32:12'),
(3, 'Muhammad Ridho Fajar', 'ridhof', '2002-10-09', 'Laki-laki', 'mekanik', '$2b$10$stLQIZt6immqw3I7FWNEhurFJqHH9KzsHUVy3IHd4mWDuNxHV0oaK', 'AKTIF', '2026-02-20 13:01:53', '2026-03-17 19:31:45'),
(4, 'Risda Rahmawati', 'risdarh', '2004-01-31', 'Perempuan', 'admin', '$2b$10$Zj95ktLlGPNB4HQyOAU/reXegEg72aof0xDkI3RHuE79tnezByS5W', 'AKTIF', '2026-03-15 16:18:09', '2026-03-17 19:22:33');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detailtransaksiservis`
--
ALTER TABLE `detailtransaksiservis`
  ADD PRIMARY KEY (`IDSERVIS`,`IDLAYANANSERVIS`,`IDDETAILTRANSAKSISERVIS`),
  ADD KEY `FK_MERUJUK` (`IDLAYANANSERVIS`);

--
-- Indexes for table `kategorisparepart`
--
ALTER TABLE `kategorisparepart`
  ADD PRIMARY KEY (`IDKATEGORI`);

--
-- Indexes for table `layananservis`
--
ALTER TABLE `layananservis`
  ADD PRIMARY KEY (`IDLAYANANSERVIS`);

--
-- Indexes for table `pengeluaran`
--
ALTER TABLE `pengeluaran`
  ADD PRIMARY KEY (`IDPENGELUARAN`),
  ADD KEY `FK_PENGELUARAN_USER` (`IDUSER`),
  ADD KEY `FK_PENGELUARAN_SPAREPART` (`IDSPAREPART`);

--
-- Indexes for table `progressservis`
--
ALTER TABLE `progressservis`
  ADD PRIMARY KEY (`IDPROGRESSERVIS`),
  ADD KEY `FK_MEMPUNYAI` (`IDSERVIS`);

--
-- Indexes for table `servis`
--
ALTER TABLE `servis`
  ADD PRIMARY KEY (`IDSERVIS`),
  ADD KEY `FK_BERISI` (`IDTRANSAKSI`),
  ADD KEY `FK_MENANGANI` (`IDUSER`);

--
-- Indexes for table `servissparepart`
--
ALTER TABLE `servissparepart`
  ADD PRIMARY KEY (`IDSERVIS`,`IDSPAREPART`,`IDSERVISSPAREPART`),
  ADD KEY `FK_MENGACU` (`IDSPAREPART`);

--
-- Indexes for table `sparepart`
--
ALTER TABLE `sparepart`
  ADD PRIMARY KEY (`IDSPAREPART`),
  ADD KEY `FK_BERDASARKAN` (`IDKATEGORI`),
  ADD KEY `FK_MENYEDIAKAN` (`IDSUPPLIER`);

--
-- Indexes for table `supplier`
--
ALTER TABLE `supplier`
  ADD PRIMARY KEY (`IDSUPPLIER`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`IDTRANSAKSI`),
  ADD KEY `FK_MENCATAT` (`IDUSER`);

--
-- Indexes for table `transaksipembeliansparepart`
--
ALTER TABLE `transaksipembeliansparepart`
  ADD PRIMARY KEY (`IDTRANSAKSI`,`IDSPAREPART`,`IDBELISPAREPART`),
  ADD KEY `FK_BERSUMBER` (`IDSPAREPART`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`IDUSER`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `kategorisparepart`
--
ALTER TABLE `kategorisparepart`
  MODIFY `IDKATEGORI` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `layananservis`
--
ALTER TABLE `layananservis`
  MODIFY `IDLAYANANSERVIS` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `pengeluaran`
--
ALTER TABLE `pengeluaran`
  MODIFY `IDPENGELUARAN` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `progressservis`
--
ALTER TABLE `progressservis`
  MODIFY `IDPROGRESSERVIS` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `servis`
--
ALTER TABLE `servis`
  MODIFY `IDSERVIS` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sparepart`
--
ALTER TABLE `sparepart`
  MODIFY `IDSPAREPART` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `supplier`
--
ALTER TABLE `supplier`
  MODIFY `IDSUPPLIER` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `IDTRANSAKSI` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `IDUSER` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detailtransaksiservis`
--
ALTER TABLE `detailtransaksiservis`
  ADD CONSTRAINT `FK_MERUJUK` FOREIGN KEY (`IDLAYANANSERVIS`) REFERENCES `layananservis` (`IDLAYANANSERVIS`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `FK_TERDIRI_DARI` FOREIGN KEY (`IDSERVIS`) REFERENCES `servis` (`IDSERVIS`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `pengeluaran`
--
ALTER TABLE `pengeluaran`
  ADD CONSTRAINT `FK_PENGELUARAN_SPAREPART` FOREIGN KEY (`IDSPAREPART`) REFERENCES `sparepart` (`IDSPAREPART`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `FK_PENGELUARAN_USER` FOREIGN KEY (`IDUSER`) REFERENCES `user` (`IDUSER`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `progressservis`
--
ALTER TABLE `progressservis`
  ADD CONSTRAINT `FK_MEMPUNYAI` FOREIGN KEY (`IDSERVIS`) REFERENCES `servis` (`IDSERVIS`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `servis`
--
ALTER TABLE `servis`
  ADD CONSTRAINT `FK_BERISI` FOREIGN KEY (`IDTRANSAKSI`) REFERENCES `transaksi` (`IDTRANSAKSI`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `FK_MENANGANI` FOREIGN KEY (`IDUSER`) REFERENCES `user` (`IDUSER`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `servissparepart`
--
ALTER TABLE `servissparepart`
  ADD CONSTRAINT `FK_MENGACU` FOREIGN KEY (`IDSPAREPART`) REFERENCES `sparepart` (`IDSPAREPART`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `FK_MENGGUNAKAN` FOREIGN KEY (`IDSERVIS`) REFERENCES `servis` (`IDSERVIS`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `sparepart`
--
ALTER TABLE `sparepart`
  ADD CONSTRAINT `FK_BERDASARKAN` FOREIGN KEY (`IDKATEGORI`) REFERENCES `kategorisparepart` (`IDKATEGORI`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `FK_MENYEDIAKAN` FOREIGN KEY (`IDSUPPLIER`) REFERENCES `supplier` (`IDSUPPLIER`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `FK_MENCATAT` FOREIGN KEY (`IDUSER`) REFERENCES `user` (`IDUSER`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `transaksipembeliansparepart`
--
ALTER TABLE `transaksipembeliansparepart`
  ADD CONSTRAINT `FK_BERSUMBER` FOREIGN KEY (`IDSPAREPART`) REFERENCES `sparepart` (`IDSPAREPART`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  ADD CONSTRAINT `FK_MEMILIKI` FOREIGN KEY (`IDTRANSAKSI`) REFERENCES `transaksi` (`IDTRANSAKSI`) ON DELETE RESTRICT ON UPDATE RESTRICT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
