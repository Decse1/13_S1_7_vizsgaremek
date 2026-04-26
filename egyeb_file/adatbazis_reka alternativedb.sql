-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Apr 26, 2026 at 09:34 PM
-- Server version: 8.0.45
-- PHP Version: 8.2.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `adatbazis_reka`
--

-- --------------------------------------------------------

--
-- Table structure for table `ceg`
--

CREATE TABLE `ceg` (
  `id` int NOT NULL,
  `nev` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `adoszam` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `euAdoszam` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `cim` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `telefon` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `elofiz` tinyint(1) DEFAULT NULL,
  `szamla_minta` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rendeles_minta` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `szamlaszam` varchar(26) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ceg`
--

INSERT INTO `ceg` (`id`, `nev`, `adoszam`, `euAdoszam`, `cim`, `email`, `telefon`, `elofiz`, `szamla_minta`, `rendeles_minta`, `szamlaszam`) VALUES
(1, 'Atlasz Kft.', '13753216217', 'HU13753216', '1000 Budapest, Tészta utca 34.', 'kapcsolat@atlasz.hu', '+361737385', 1, 'ATLSZ-000000', 'ATS-0000', '11700002-37137178-10568322'),
(2, 'Tartarosz Kft.', '17322356621', '', '4025 Debrecen, Piac utca 55.', 'tartarosz@tartarosz.com', '+3652672367', 1, 'TARTSZ-00000', 'TSZ-000000', '11700002-53216217-87528321'),
(3, 'Kupak Kft.', '16432762433', '', '11051 Budapest, Sas utca 12. 3. em. 4. ajtó', 'kupak@kupak.hu', '+361421566', 1, 'KUPAK-000000', 'KPK-000', '11700002-52152156-74327312'),
(4, 'Nemzeti Irodaszer Kft.', '12321466426', '', '1000 Budapest, Asztalos utca 32.', 'contact@nisz.hu', '+3616321783', 1, 'NSZ-00000', 'NISZ-0000', '11700002-12324353-67358736'),
(5, 'Molnár Kertészet Kft.', '18437134717', 'HU18437134', '6000 Kecskemét, Virág utca 5.', 'molnarkert5@gmail.com', '+36762172882', 0, '-', 'MKRT-000', '11700002-53216782-33165177');

-- --------------------------------------------------------

--
-- Table structure for table `ceg_alkalmazott`
--

CREATE TABLE `ceg_alkalmazott` (
  `cegId` int NOT NULL,
  `felhasznaloId` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ceg_alkalmazott`
--

INSERT INTO `ceg_alkalmazott` (`cegId`, `felhasznaloId`) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 4),
(3, 5),
(4, 6),
(5, 7),
(4, 8),
(4, 9);

-- --------------------------------------------------------

--
-- Table structure for table `felhasznalo`
--

CREATE TABLE `felhasznalo` (
  `id` int NOT NULL,
  `nev` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `jelszo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `telephely_cim` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `telefon` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rendeles_osszkesz` tinyint(1) DEFAULT NULL,
  `rendeles_lead` tinyint(1) DEFAULT NULL,
  `szamla_keszit` tinyint(1) DEFAULT NULL,
  `raktar_kezel` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `felhasznalo`
--

INSERT INTO `felhasznalo` (`id`, `nev`, `jelszo`, `telephely_cim`, `telefon`, `rendeles_osszkesz`, `rendeles_lead`, `szamla_keszit`, `raktar_kezel`) VALUES
(1, 'Kovács Mihály', '$2b$10$kxVXGTdIVfdvSCttvbvsTOeEQ8VxtK.LvKPq0bglnVd1KLXzD8QDy', '1000 Budapest, Tészta utca 34.', '+36306125662', 1, 1, 1, 1),
(2, 'Rácz Barbara', '$2b$10$GSUIl1T337flTNvbNL8Nb.E6ogQ8qb63RaOiVN1WcMrjlrLbOhlcy', '1000 Budapest, Tészta utca 34.', '+36306217206', 1, 0, 0, 1),
(3, 'Preisz Péter', '$2b$10$p3RGpjdE2oQSy3ewqH.fyenVmM6UTpA2UIFcpPl/rEPZ.D4uppCSC', '1000 Budapest, Tészta utca 34.', '+36207532632', 0, 0, 1, 0),
(4, 'Juhász Levente', '$2b$10$R/MLHXMWHWWhkn1Eqv1fquGt7Aq8.rO/qH4r8mGENKi3F5E6kXorW', '4025 Debrecen, Piac utca 55.', '+36206246723', 1, 1, 1, 1),
(5, 'Kupaktanács', '$2b$10$aFT6c4gzns3.sbgCdnJEGekC8pf81b1HCnjf0ZB2yAkk.qfR3yPuS', '11051 Budapest, Sas utca 12. 3. em. 4. ajtó', '+36706605470', 1, 1, 1, 1),
(6, 'Kovács Péter', '$2b$10$WwlHNFGj72Y0H0XiKSktA.EsrORCaOWowCtNbJZTxpMwEezRBH.da', '1000 Budapest, Asztalos utca 32.', '+36701623167', 1, 1, 1, 1),
(7, 'Molnár Zoltán', '$2b$10$N1kCHBA87qvXrjP3LUHcLuFM95w72YWw1UVxhllQ7fCni9ZG0.zPa', '6000 Kecskemét, Virág utca 5.', '+36208142717', 1, 1, 1, 1),
(8, 'osszeallit', '$2b$10$hsQAM4c.pDqH48erqgu44.xwR61ONW2F9iOh5FXnVuti6pWPiUXMq', '1000 Budapest, Asztalos utca 32.', '+36212847261', 1, 0, 0, 0),
(9, 'lead', '$2b$10$/IjBwGqrSvVxG8hIp1Gue.1Itsj6lEBaJgqOPJdOEPfmi9Rl54blm', '1000 Budapest, Asztalos utca 32.', '+36303832083', 0, 1, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `partnerseg`
--

CREATE TABLE `partnerseg` (
  `id` int NOT NULL,
  `elado` int NOT NULL,
  `vevo` int NOT NULL,
  `fizetesi_ido` int NOT NULL,
  `fizetesi_forma` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `partnerseg`
--

INSERT INTO `partnerseg` (`id`, `elado`, `vevo`, `fizetesi_ido`, `fizetesi_forma`) VALUES
(1, 3, 1, 7, 'Átutalás'),
(2, 3, 2, 7, 'Átutalás'),
(3, 2, 1, 30, 'Bankkártya'),
(4, 1, 2, 30, 'Átutalás');

-- --------------------------------------------------------

--
-- Table structure for table `rendeles`
--

CREATE TABLE `rendeles` (
  `id` int NOT NULL,
  `partnerseg` int NOT NULL,
  `datum` date NOT NULL,
  `status` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `sz_cim` int NOT NULL,
  `rendeles_szam` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `szamla_kesz` tinyint(1) DEFAULT NULL,
  `sztorno` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rendeles`
--

INSERT INTO `rendeles` (`id`, `partnerseg`, `datum`, `status`, `sz_cim`, `rendeles_szam`, `szamla_kesz`, `sztorno`) VALUES
(1, 2, '2026-03-11', 'Teljesítve', 4, 'KPK-001', 1, 0),
(2, 3, '2026-03-11', 'Teljesítve', 1, 'TSZ-000001', 1, 1),
(3, 2, '2026-03-11', 'Teljesítve', 4, 'KPK-002', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `rendelestetel`
--

CREATE TABLE `rendelestetel` (
  `rendeles_id` int NOT NULL,
  `termek_id` int NOT NULL,
  `mennyiseg` int NOT NULL,
  `nev` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `ar` int NOT NULL,
  `afa_kulcs` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rendelestetel`
--

INSERT INTO `rendelestetel` (`rendeles_id`, `termek_id`, `mennyiseg`, `nev`, `ar`, `afa_kulcs`) VALUES
(1, 1, 20, 'Támogatási kupak', 50, 27),
(2, 2, 5, 'Szivacs', 400, 27),
(2, 3, 2, 'Premium szivacs', 800, 5),
(3, 1, 10, 'Támogatási kupak', 50, 27);

-- --------------------------------------------------------

--
-- Table structure for table `szamla`
--

CREATE TABLE `szamla` (
  `szamla_sz` varchar(26) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `rendeles_id` int NOT NULL,
  `szamla_tipus` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `kiallitas_datum` date NOT NULL,
  `fizetesi_ido` date NOT NULL,
  `kiallito` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `szamla`
--

INSERT INTO `szamla` (`szamla_sz`, `rendeles_id`, `szamla_tipus`, `kiallitas_datum`, `fizetesi_ido`, `kiallito`) VALUES
('KUPAK-000001', 1, 'NORMAL', '2026-03-11', '2026-03-18', 3),
('TARTSZ-00001', 2, 'NORMAL', '2026-03-11', '2026-04-10', 2),
('TARTSZ-00002', 2, 'STORNO', '2026-03-11', '2026-03-11', 2),
('KUPAK-000002', 3, 'NORMAL', '2026-03-11', '2026-03-18', 3),
('KUPAK-000003', 3, 'STORNO', '2026-03-11', '2026-03-11', 3);

-- --------------------------------------------------------

--
-- Table structure for table `termek`
--

CREATE TABLE `termek` (
  `id` int NOT NULL,
  `tulajdonos` int NOT NULL,
  `nev` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `cikkszam` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mennyiseg` int DEFAULT NULL,
  `kiszereles` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `min_vas_menny` int DEFAULT NULL,
  `leiras` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `ar` int NOT NULL,
  `kategoria` int NOT NULL,
  `afa_kulcs` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `termek`
--

INSERT INTO `termek` (`id`, `tulajdonos`, `nev`, `cikkszam`, `mennyiseg`, `kiszereles`, `min_vas_menny`, `leiras`, `ar`, `kategoria`, `afa_kulcs`) VALUES
(1, 3, 'Támogatási kupak', 'KPK-001', 570, 'db', 5, 'Támogass szervezeteket kupakok vásárlásával', 50, 1, 27),
(2, 2, 'Szivacs', 'SZVCS-001', 55, 'db', 1, 'Szivacs', 400, 1, 27),
(3, 2, 'Premium szivacs', 'SZVCS-2', 43, 'db', 1, 'Premiumabb', 800, 1, 5);

-- --------------------------------------------------------

--
-- Table structure for table `termek_kategoria`
--

CREATE TABLE `termek_kategoria` (
  `id` int NOT NULL,
  `nev` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `termek_kategoria`
--

INSERT INTO `termek_kategoria` (`id`, `nev`) VALUES
(1, 'Egyéb');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ceg`
--
ALTER TABLE `ceg`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ceg_alkalmazott`
--
ALTER TABLE `ceg_alkalmazott`
  ADD KEY `Ceg_alkalmazott_index_8` (`cegId`),
  ADD KEY `Ceg_alkalmazott_index_9` (`felhasznaloId`);

--
-- Indexes for table `felhasznalo`
--
ALTER TABLE `felhasznalo`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `partnerseg`
--
ALTER TABLE `partnerseg`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Partnerseg_index_0` (`elado`),
  ADD KEY `Partnerseg_index_1` (`vevo`);

--
-- Indexes for table `rendeles`
--
ALTER TABLE `rendeles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Rendeles_index_4` (`partnerseg`),
  ADD KEY `Rendeles_index_5` (`sz_cim`);

--
-- Indexes for table `rendelestetel`
--
ALTER TABLE `rendelestetel`
  ADD PRIMARY KEY (`rendeles_id`,`termek_id`),
  ADD KEY `RendelesTetel_index_6` (`rendeles_id`),
  ADD KEY `RendelesTetel_index_7` (`termek_id`);

--
-- Indexes for table `szamla`
--
ALTER TABLE `szamla`
  ADD KEY `rendeles_id` (`rendeles_id`),
  ADD KEY `kiallito` (`kiallito`);

--
-- Indexes for table `termek`
--
ALTER TABLE `termek`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Termek_index_2` (`tulajdonos`),
  ADD KEY `Termek_index_3` (`kategoria`);

--
-- Indexes for table `termek_kategoria`
--
ALTER TABLE `termek_kategoria`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ceg`
--
ALTER TABLE `ceg`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `felhasznalo`
--
ALTER TABLE `felhasznalo`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `partnerseg`
--
ALTER TABLE `partnerseg`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `rendeles`
--
ALTER TABLE `rendeles`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `termek`
--
ALTER TABLE `termek`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `termek_kategoria`
--
ALTER TABLE `termek_kategoria`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ceg_alkalmazott`
--
ALTER TABLE `ceg_alkalmazott`
  ADD CONSTRAINT `ceg_alkalmazott_ibfk_1` FOREIGN KEY (`cegId`) REFERENCES `ceg` (`id`),
  ADD CONSTRAINT `ceg_alkalmazott_ibfk_2` FOREIGN KEY (`felhasznaloId`) REFERENCES `felhasznalo` (`id`);

--
-- Constraints for table `partnerseg`
--
ALTER TABLE `partnerseg`
  ADD CONSTRAINT `partnerseg_ibfk_1` FOREIGN KEY (`elado`) REFERENCES `ceg` (`id`),
  ADD CONSTRAINT `partnerseg_ibfk_2` FOREIGN KEY (`vevo`) REFERENCES `ceg` (`id`);

--
-- Constraints for table `rendeles`
--
ALTER TABLE `rendeles`
  ADD CONSTRAINT `rendeles_ibfk_1` FOREIGN KEY (`partnerseg`) REFERENCES `partnerseg` (`id`),
  ADD CONSTRAINT `rendeles_ibfk_2` FOREIGN KEY (`sz_cim`) REFERENCES `felhasznalo` (`id`);

--
-- Constraints for table `rendelestetel`
--
ALTER TABLE `rendelestetel`
  ADD CONSTRAINT `rendelestetel_ibfk_1` FOREIGN KEY (`rendeles_id`) REFERENCES `rendeles` (`id`),
  ADD CONSTRAINT `rendelestetel_ibfk_2` FOREIGN KEY (`termek_id`) REFERENCES `termek` (`id`);

--
-- Constraints for table `szamla`
--
ALTER TABLE `szamla`
  ADD CONSTRAINT `szamla_ibfk_1` FOREIGN KEY (`rendeles_id`) REFERENCES `rendeles` (`id`),
  ADD CONSTRAINT `szamla_ibfk_2` FOREIGN KEY (`kiallito`) REFERENCES `ceg` (`id`);

--
-- Constraints for table `termek`
--
ALTER TABLE `termek`
  ADD CONSTRAINT `termek_ibfk_1` FOREIGN KEY (`tulajdonos`) REFERENCES `ceg` (`id`),
  ADD CONSTRAINT `termek_ibfk_2` FOREIGN KEY (`kategoria`) REFERENCES `termek_kategoria` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
