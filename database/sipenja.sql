-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 12, 2026 at 01:33 AM
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
  `IDDETAILTRANSAKSISERVIS` int NOT NULL,
  `IDSERVIS` int NOT NULL,
  `IDLAYANANSERVIS` int NOT NULL,
  `BIAYA` decimal(10,0) DEFAULT NULL,
  `KETERANGAN` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `detailtransaksiservis`
--

INSERT INTO `detailtransaksiservis` (`IDDETAILTRANSAKSISERVIS`, `IDSERVIS`, `IDLAYANANSERVIS`, `BIAYA`, `KETERANGAN`) VALUES
(1, 1, 4, '5000', NULL),
(2, 2, 2, '10000', NULL),
(3, 2, 3, '20000', NULL),
(4, 2, 4, '5000', NULL),
(5, 3, 4, '5000', NULL),
(6, 3, 1, '15000', NULL),
(7, 4, 7, '5000', NULL),
(8, 4, 5, '10000', NULL),
(9, 4, 4, '5000', NULL),
(10, 5, 4, '5000', NULL),
(11, 6, 6, '20000', NULL),
(12, 7, 4, '5000', NULL),
(13, 8, 4, '5000', NULL);

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
(6, 'Kampas dan Cakram', 'REM'),
(7, 'Jeruji', 'JI');

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
(2, 1, 1, '2026-03-13 05:50:26', 1, '40000', '40000', NULL),
(3, 2, 8, '2026-03-20 21:00:07', 10, '55000', '550000', NULL),
(4, 4, 10, '2026-03-20 22:32:24', 5, '50000', '250000', NULL),
(5, 1, 3, '2026-05-03 23:15:50', 7, '35000', '245000', NULL),
(6, 2, 10, '2026-05-03 23:49:02', 2, '25000', '50000', NULL),
(8, 1, 3, '2026-05-04 22:55:33', 2, '25000', '50000', NULL),
(9, 2, 3, '2026-05-05 09:33:30', 2, '25000', '50000', NULL);

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
(15, 3, '2026-03-14 22:48:44', 'Selesai', 'Kendaraan selesai dikerjakan dan siap diambil'),
(16, 4, '2026-04-01 21:18:35', 'Belum', 'Kendaraan masuk, menunggu dikerjakan'),
(17, 4, '2026-04-01 21:19:21', 'Dalam Proses', 'Sedang ganti kampas rem'),
(18, 4, '2026-04-01 21:19:42', 'Dalam Proses', 'Sedang ganti oli samping dan oli utama'),
(19, 4, '2026-04-01 21:20:00', 'Selesai', 'Kendaraan selesai dikerjakan dan siap diambil'),
(20, 5, '2026-04-14 00:58:37', 'Belum', 'Kendaraan masuk, menunggu dikerjakan'),
(21, 5, '2026-04-15 10:32:15', 'Dalam Proses', 'Kendaraan sedang dikerjakan'),
(22, 5, '2026-04-15 10:32:26', 'Selesai', 'Kendaraan selesai dikerjakan dan siap diambil'),
(23, 6, '2026-05-03 23:21:34', 'Belum', 'Kendaraan masuk, menunggu dikerjakan'),
(24, 6, '2026-05-03 23:22:19', 'Dalam Proses', 'Sedang mengganti oli'),
(25, 6, '2026-05-03 23:23:08', 'Selesai', 'Kendaraan selesai dikerjakan dan siap diambil'),
(26, 7, '2026-05-03 23:47:54', 'Belum', 'Kendaraan masuk, menunggu dikerjakan'),
(27, 7, '2026-05-03 23:51:19', 'Dalam Proses', 'mekanik sedang mengganti oli'),
(28, 7, '2026-05-03 23:52:36', 'Selesai', 'Kendaraan selesai dikerjakan dan siap diambil'),
(29, 8, '2026-05-05 09:32:25', 'Belum', 'Kendaraan masuk, menunggu dikerjakan'),
(30, 8, '2026-05-05 09:34:12', 'Dalam Proses', 'Kendaraan sedang dikerjakan'),
(31, 8, '2026-05-05 09:35:05', 'Selesai', 'Kendaraan selesai dikerjakan dan siap diambil');

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
(3, 3, 4, 'SRV-20260311-001', '2026-03-11 23:16:43', '2026-03-14 22:48:44', 'Selesai', '-', 'Nia'),
(4, 3, 11, 'SRV-20260401-001', '2026-04-01 21:18:35', '2026-04-01 21:20:01', 'Selesai', 'Rem terasa kurang cekat', 'Yatno'),
(5, 3, 12, 'SRV-20260413-001', '2026-04-14 00:58:37', '2026-04-15 10:32:27', 'Selesai', 'kendaraan terasa tidak nyaman dan gas mampet', 'surya'),
(6, 3, 14, 'SRV-20260503-001', '2026-05-03 23:21:34', '2026-05-03 23:23:09', 'Selesai', 'Kendaraan terasa kurang lancar', 'Budi'),
(7, 3, 15, 'SRV-20260503-002', '2026-05-03 23:47:55', '2026-05-03 23:52:37', 'Selesai', '-', 'Lukman'),
(8, 3, 19, 'SRV-20260505-001', '2026-05-05 09:32:25', '2026-05-05 09:35:06', 'Selesai', '-', 'Surya');

-- --------------------------------------------------------

--
-- Table structure for table `servissparepart`
--

CREATE TABLE `servissparepart` (
  `IDSERVISSPAREPART` int NOT NULL,
  `IDSERVIS` int NOT NULL,
  `IDSPAREPART` int NOT NULL,
  `QTY` int DEFAULT NULL,
  `HARGASATUAN` decimal(10,0) DEFAULT NULL,
  `SUBTOTAL` decimal(10,0) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `servissparepart`
--

INSERT INTO `servissparepart` (`IDSERVISSPAREPART`, `IDSERVIS`, `IDSPAREPART`, `QTY`, `HARGASATUAN`, `SUBTOTAL`) VALUES
(2, 1, 2, 1, '55000', '55000'),
(3, 2, 6, 1, '55000', '55000'),
(5, 3, 11, 1, '50000', '50000'),
(6, 4, 5, 1, '55000', '55000'),
(7, 5, 8, 1, '55000', '55000'),
(8, 6, 3, 1, '50000', '50000'),
(9, 7, 7, 1, '65000', '65000'),
(10, 8, 5, 1, '55000', '55000');

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
(1, 1, 8, 'OLI-1', 'AHM OLI SPX-2 (0.8 L)', '50000', 10, 5),
(2, 1, 8, 'OLI-2', 'AHM OLI SPX-2 (1 L)', '55000', 17, 5),
(3, 1, 8, 'OLI-3', 'AHM MPX-1 (0.8 L)', '50000', 6, 5),
(4, 1, 8, 'OLI-4', 'AHM MPX-1(1 L)', '55000', 15, 5),
(5, 1, 4, 'OLI-5', 'SHELL AX3 (0.8 L)', '55000', 13, 5),
(6, 1, 4, 'OLI-6', 'SHELL AX7 (0.8 L)', '55000', 8, 5),
(7, 1, 4, 'OLI-7', 'SHELL HELIX AX-5 (1 L)', '65000', 14, 5),
(8, 1, 1, 'OLI-8', 'YAMALUBE Super Matic (1 L)', '55000', 11, 5),
(9, 1, 1, 'OLI-9', 'YAMALUBE 20W (0.8 L)', '50000', 12, 5),
(10, 1, 1, 'OLI-10', 'YAMALUBE SILVER (0.8 L)', '50000', 12, 5),
(11, 1, 8, 'OLI-11', 'FEDERAL ULTRATEC 20W-50 (0.8 L)', '50000', 9, 5),
(12, 1, 8, 'OLI-12', 'FEDERAL ULTRATEC 20W-50 (1 L)', '55000', 12, 5),
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
(6, 2, 'TRX-PBL-20260315-002', '2026-03-15 16:32:58', 'PEMBELIAN', '500000', NULL, '083891942279'),
(7, 2, 'TRX-PBL-20260323-001', '2026-03-23 18:45:14', 'PEMBELIAN', '250000', NULL, NULL),
(8, 2, 'TRX-PBL-20260323-002', '2026-03-23 18:45:31', 'PEMBELIAN', '165000', NULL, NULL),
(9, 2, 'TRX-PBL-20260323-003', '2026-03-23 18:45:49', 'PEMBELIAN', '550000', NULL, NULL),
(10, 2, 'TRX-PBL-20260401-001', '2026-04-01 21:15:46', 'PEMBELIAN', '150000', NULL, NULL),
(11, 2, 'TRX-SRV-20260401-001', '2026-04-01 21:18:35', 'SERVIS', '75000', 'Rem terasa kurang cekat', '083891942279'),
(12, 2, 'TRX-SRV-20260413-001', '2026-04-14 00:58:37', 'SERVIS', '60000', 'kendaraan terasa tidak nyaman dan gas mampet', NULL),
(13, 2, 'TRX-PBL-20260503-001', '2026-05-03 23:19:44', 'PEMBELIAN', '110000', NULL, NULL),
(14, 2, 'TRX-SRV-20260503-001', '2026-05-03 23:21:34', 'SERVIS', '70000', 'Kendaraan terasa kurang lancar', NULL),
(15, 2, 'TRX-SRV-20260503-002', '2026-05-03 23:47:55', 'SERVIS', '70000', '-', NULL),
(16, 2, 'TRX-PBL-20260503-002', '2026-05-03 23:49:27', 'PEMBELIAN', '300000', NULL, NULL),
(17, 2, 'TRX-PBL-20260504-001', '2026-05-04 23:19:50', 'PEMBELIAN', '500000', NULL, NULL),
(18, 2, 'TRX-PBL-20260504-002', '2026-05-04 23:21:06', 'PEMBELIAN', '100000', NULL, NULL),
(19, 2, 'TRX-SRV-20260505-001', '2026-05-05 09:32:25', 'SERVIS', '60000', '-', NULL),
(20, 2, 'TRX-PBL-20260505-001', '2026-05-05 10:35:46', 'PEMBELIAN', '330000', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `transaksipembeliansparepart`
--

CREATE TABLE `transaksipembeliansparepart` (
  `IDBELISPAREPART` int NOT NULL,
  `IDTRANSAKSI` int NOT NULL,
  `IDSPAREPART` int NOT NULL,
  `JUMLAH` int DEFAULT NULL,
  `HARGA_SATUAN` decimal(10,0) DEFAULT NULL,
  `SUB_TOTAL` decimal(10,0) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transaksipembeliansparepart`
--

INSERT INTO `transaksipembeliansparepart` (`IDBELISPAREPART`, `IDTRANSAKSI`, `IDSPAREPART`, `JUMLAH`, `HARGA_SATUAN`, `SUB_TOTAL`) VALUES
(1, 2, 1, 3, '50000', '150000'),
(2, 5, 8, 11, '55000', '605000'),
(3, 6, 10, 10, '50000', '500000'),
(4, 7, 11, 5, '50000', '250000'),
(5, 8, 12, 3, '55000', '165000'),
(6, 9, 3, 11, '50000', '550000'),
(7, 10, 9, 3, '50000', '150000'),
(8, 13, 8, 2, '55000', '110000'),
(9, 16, 3, 6, '50000', '300000'),
(10, 17, 1, 10, '50000', '500000'),
(11, 18, 3, 2, '50000', '100000'),
(12, 20, 6, 6, '55000', '330000');

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
(1, 'Puji Yuliani', 'py.ani', '2003-07-08', 'PEREMPUAN', 'admin', '$2b$10$8F9VGyB4DgRUQzgZylh5a./XsTdG4jHxS99XUrBuo4yi0aKQlkBPi', 'AKTIF', '2026-02-20 12:58:49', '2026-05-12 08:29:19'),
(2, 'Pamuji Slamet', 'pakslamet', '1970-10-09', 'Laki-laki', 'kasir', '$2b$10$G6gpBTPhCZciIvz5IesVQO7qf7E2wnFQhqGKXXvtK9hxQ8EzPMe8G', 'AKTIF', '2026-02-20 13:00:29', '2026-05-05 10:35:01'),
(3, 'Muhammad Ridho Fajar', 'ridhof', '2002-10-09', 'Laki-laki', 'mekanik', '$2b$10$stLQIZt6immqw3I7FWNEhurFJqHH9KzsHUVy3IHd4mWDuNxHV0oaK', 'AKTIF', '2026-02-20 13:01:53', '2026-05-05 10:36:52'),
(4, 'Risda Rahmawati Harsono', 'risdarh', '2004-01-30', 'Perempuan', 'admin', '$2b$10$Zj95ktLlGPNB4HQyOAU/reXegEg72aof0xDkI3RHuE79tnezByS5W', 'AKTIF', '2026-03-15 16:18:09', '2026-04-01 21:21:58'),
(5, 'Deisy Retno Mayasari', 'deisy.maya', '1991-12-01', 'PEREMPUAN', 'admin', '$2b$10$aeMstaGtpJ5PS4K.AhkCYe1m2OX23GtcH7AOeoOL5f4oX86uqzOzy', 'AKTIF', '2026-03-27 21:58:41', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detailtransaksiservis`
--
ALTER TABLE `detailtransaksiservis`
  ADD PRIMARY KEY (`IDDETAILTRANSAKSISERVIS`),
  ADD KEY `FK_MERUJUK` (`IDLAYANANSERVIS`),
  ADD KEY `FK_TERDIRI_DARI` (`IDSERVIS`);

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
  ADD PRIMARY KEY (`IDSERVISSPAREPART`),
  ADD KEY `FK_MENGACU` (`IDSPAREPART`),
  ADD KEY `FK_MENGGUNAKAN` (`IDSERVIS`);

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
  ADD PRIMARY KEY (`IDBELISPAREPART`),
  ADD KEY `FK_BERSUMBER` (`IDSPAREPART`),
  ADD KEY `FK_MEMILIKI` (`IDTRANSAKSI`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`IDUSER`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `detailtransaksiservis`
--
ALTER TABLE `detailtransaksiservis`
  MODIFY `IDDETAILTRANSAKSISERVIS` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

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
  MODIFY `IDPENGELUARAN` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `progressservis`
--
ALTER TABLE `progressservis`
  MODIFY `IDPROGRESSERVIS` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `servis`
--
ALTER TABLE `servis`
  MODIFY `IDSERVIS` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `servissparepart`
--
ALTER TABLE `servissparepart`
  MODIFY `IDSERVISSPAREPART` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
  MODIFY `IDTRANSAKSI` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `transaksipembeliansparepart`
--
ALTER TABLE `transaksipembeliansparepart`
  MODIFY `IDBELISPAREPART` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `IDUSER` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detailtransaksiservis`
--
ALTER TABLE `detailtransaksiservis`
  ADD CONSTRAINT `FK_MERUJUK` FOREIGN KEY (`IDLAYANANSERVIS`) REFERENCES `layananservis` (`IDLAYANANSERVIS`),
  ADD CONSTRAINT `FK_TERDIRI_DARI` FOREIGN KEY (`IDSERVIS`) REFERENCES `servis` (`IDSERVIS`);

--
-- Constraints for table `pengeluaran`
--
ALTER TABLE `pengeluaran`
  ADD CONSTRAINT `FK_PENGELUARAN_SPAREPART` FOREIGN KEY (`IDSPAREPART`) REFERENCES `sparepart` (`IDSPAREPART`) ON DELETE CASCADE ON UPDATE CASCADE,
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
  ADD CONSTRAINT `FK_MENGGUNAKAN` FOREIGN KEY (`IDSERVIS`) REFERENCES `servis` (`IDSERVIS`);

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
  ADD CONSTRAINT `FK_MEMILIKI` FOREIGN KEY (`IDTRANSAKSI`) REFERENCES `transaksi` (`IDTRANSAKSI`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
