DROP TABLE IF EXISTS RendelesTetel;
DROP TABLE IF EXISTS Rendeles;
DROP TABLE IF EXISTS Termek;
DROP TABLE IF EXISTS Termek_kategoria;
DROP TABLE IF EXISTS Partnerseg;
DROP TABLE IF EXISTS Ceg_alkalmazott;
DROP TABLE IF EXISTS Felhasznalo;
DROP TABLE IF EXISTS Ceg;

CREATE TABLE `Ceg` (
  `id` integer PRIMARY KEY,
  `nev` varchar(100),
  `adoszam` varchar(11),
  `euAdoszam` varchar(20),
  `cim` varchar(255),
  `email` varchar(100),
  `telefon` varchar(15),
  `elofiz` bool
);

CREATE TABLE `Felhasznalo` (
  `id` integer PRIMARY KEY,
  `nev` varchar(100),
  `jelszo` varchar(100),
  `kategoria` integer NOT NULL,
  `telephely_cim` varchar(255),
  `telefon` varchar(15)
);

CREATE TABLE `Partnerseg` (
  `id` integer PRIMARY KEY,
  `elado` integer NOT NULL,
  `vevo` integer NOT NULL,
  `fizetesi_ido` integer,
  `fizetesi_forma` Varchar(50)
);

CREATE TABLE `Termek` (
  `id` integer PRIMARY KEY,
  `tulajdonos` integer NOT NULL,
  `nev` varchar(100) NOT NULL,
  `cikkszam` varchar(100),
  `mennyiseg` integer,
  `kiszereles` varchar(10),
  `min_vas_menny` integer,
  `leiras` text,
  `ar` integer,
  `kategoria` integer NOT NULL,
  `afa_kulcs` integer
);

CREATE TABLE `Termek_kategoria` (
  `id` integer PRIMARY KEY,
  `nev` varchar(100)
);

CREATE TABLE `Rendeles` (
  `id` integer PRIMARY KEY,
  `partnerseg` integer NOT NULL,
  `datum` date NOT NULL,
  `status` varchar(10) NOT NULL,
  `sz_cim` integer NOT NULL
);

CREATE TABLE `RendelesTetel` (
  `rendeles_id` integer NOT NULL,
  `termek_id` integer NOT NULL,
  `mennyiseg` integer NOT NULL
);

CREATE TABLE `Ceg_alkalmazott` (
  `cegId` integer,
  `felhasznaloId` integer
);

ALTER TABLE `Termek` ADD FOREIGN KEY (`tulajdonos`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Partnerseg` ADD FOREIGN KEY (`elado`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Partnerseg` ADD FOREIGN KEY (`vevo`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Termek` ADD FOREIGN KEY (`kategoria`) REFERENCES `Termek_kategoria` (`id`);

ALTER TABLE `Termek` ADD FOREIGN KEY (`id`) REFERENCES `RendelesTetel` (`termek_id`);

ALTER TABLE `RendelesTetel` ADD FOREIGN KEY (`rendeles_id`) REFERENCES `Rendeles` (`id`);

ALTER TABLE `Rendeles` ADD FOREIGN KEY (`partnerseg`) REFERENCES `Partnerseg` (`id`);

ALTER TABLE `Rendeles` ADD FOREIGN KEY (`sz_cim`) REFERENCES `Felhasznalo` (`id`);

ALTER TABLE `Ceg_alkalmazott` ADD FOREIGN KEY (`felhasznaloId`) REFERENCES `Felhasznalo` (`id`);

ALTER TABLE `Ceg` ADD FOREIGN KEY (`id`) REFERENCES `Ceg_alkalmazott` (`cegId`);

-- ----------------------------
-- Table: Ceg
-- ----------------------------
INSERT INTO Ceg (id, nev, adoszam, euAdoszam, cim, email, telefon, elofiz) VALUES
(1, 'Alfa Kft.', '11111111-1', 'HU11111111', '1111 Budapest, Fő u. 1', 'info@alfa.hu', '+3611111111', true),
(2, 'Beta Kft.', '22222222-2', 'HU22222222', '2222 Budapest, Közép u. 2', 'info@beta.hu', '+3622222222', false),
(3, 'Gamma Kft.', '33333333-3', 'HU33333333', '3333 Budapest, Tölgy u. 3', 'info@gamma.hu', '+3633333333', true),
(4, 'Delta Kft.', '44444444-4', 'HU44444444', '4444 Budapest, Hárs u. 4', 'info@delta.hu', '+3644444444', false);

-- ----------------------------
-- Table: Felhasznalo
-- ----------------------------
INSERT INTO Felhasznalo (id, nev, jelszo, kategoria, telephely_cim, telefon) VALUES
(1, 'Kovács Péter', 'pwd123', 1, '1111 Budapest, Fő u. 1', '+3611111112'),
(2, 'Nagy Anna', 'pwd123', 2, '1111 Budapest, Fő u. 1', '+3611111113'),
(3, 'Tóth Béla', 'pwd123', 1, '2222 Budapest, Közép u. 2', '+3622222223'),
(4, 'Szabó Éva', 'pwd123', 2, '2222 Budapest, Közép u. 2', '+3622222224'),
(5, 'Horváth László', 'pwd123', 1, '3333 Budapest, Tölgy u. 3', '+3633333334'),
(6, 'Kiss Júlia', 'pwd123', 2, '3333 Budapest, Tölgy u. 3', '+3633333335'),
(7, 'Molnár Zoltán', 'pwd123', 1, '4444 Budapest, Hárs u. 4', '+3644444445'),
(8, 'Farkas Eszter', 'pwd123', 2, '4444 Budapest, Hárs u. 4', '+3644444446');

-- ----------------------------
-- Table: Partnerseg
-- ----------------------------
INSERT INTO Partnerseg (id, elado, vevo, fizetesi_ido, fizetesi_forma) VALUES
(1, 1, 2, 30, 'Átutalás'),
(2, 3, 4, 15, 'Készpénz');

-- ----------------------------
-- Table: Termek_kategoria
-- ----------------------------
INSERT INTO Termek_kategoria (id, nev) VALUES
(1, 'Irodaszer'),
(2, 'Elektronika'),
(3, 'Tisztítószer');

-- ----------------------------
-- Table: Termek
-- ----------------------------
INSERT INTO Termek (id, tulajdonos, nev, cikkszam, mennyiseg, kiszereles, min_vas_menny, leiras, ar, kategoria, afa_kulcs) VALUES
(1, 1, 'Toll', 'TOLL001', 100, 'db', 5, 'Kék tinta', 200, 1, 27),
(2, 1, 'Ceruza', 'CERUZA001', 200, 'db', 10, 'HB ceruza', 100, 1, 27),
(3, 1, 'Jegyzettömb', 'JEGY001', 50, 'db', 2, 'A5 méret', 500, 1, 27),
(4, 1, 'Irodai szék', 'SZEK001', 20, 'db', 1, 'Forgószék', 20000, 2, 27),
(5, 1, 'Laptop', 'LAP001', 10, 'db', 1, '15" laptop', 350000, 2, 27),
(6, 1, 'Nyomtató', 'NYOM001', 5, 'db', 1, 'Lézernyomtató', 120000, 2, 27),
(7, 1, 'Papír A4', 'PAP001', 500, 'cs', 5, 'Újrahasznosított', 1500, 1, 27),
(8, 2, 'Monitor', 'MON001', 15, 'db', 1, '24" FullHD', 70000, 2, 27),
(9, 2, 'Billentyűzet', 'BILL001', 30, 'db', 1, 'USB billentyűzet', 5000, 2, 27),
(10, 2, 'Egér', 'EGÉR001', 40, 'db', 1, 'Optikai egér', 3000, 2, 27),
(11, 2, 'USB kábel', 'USB001', 100, 'db', 5, '1m hossz', 1000, 2, 27),
(12, 2, 'Papír A3', 'PAP002', 100, 'cs', 2, 'Fehér A3 lap', 2000, 1, 27),
(13, 3, 'Mop', 'MOP001', 50, 'db', 2, 'Felmosó', 3000, 3, 27),
(14, 3, 'Takarítószer', 'TAK001', 100, 'l', 5, 'Általános tisztítószer', 1500, 3, 27),
(15, 3, 'Szivacs', 'SZI001', 200, 'db', 10, 'Mosogatáshoz', 500, 3, 27),
(16, 3, 'Porszívó', 'POR001', 10, 'db', 1, 'Ipari porszívó', 45000, 3, 27),
(17, 3, 'Seprű', 'SEP001', 80, 'db', 2, 'Fa nyél', 1500, 3, 27),
(18, 3, 'Törlőkendő', 'TOR001', 200, 'db', 5, 'Mikroszálas', 800, 3, 27),
(19, 3, 'Felmosó vödör', 'VOD001', 40, 'db', 2, 'Műanyag vödör', 2500, 3, 27);

-- ----------------------------
-- Table: Ceg_alkalmazott
-- ----------------------------
INSERT INTO Ceg_alkalmazott (cegId, felhasznaloId) VALUES
(1, 1),
(1, 2),
(2, 3),
(2, 4),
(3, 5),
(3, 6),
(4, 7),
(4, 8);

-- ----------------------------
-- Table: Rendeles
-- ----------------------------
INSERT INTO Rendeles (id, partnerseg, datum, status, sz_cim) VALUES
(1, 1, '2025-11-01', 'Új', 1),
(2, 1, '2025-11-05', 'Teljesítve', 2),
(3, 2, '2025-11-03', 'Új', 5);

-- ----------------------------
-- Table: RendelesTetel
-- ----------------------------
INSERT INTO RendelesTetel (rendeles_id, termek_id, mennyiseg) VALUES
(1, 1, 10),
(1, 4, 2),
(1, 5, 1),
(2, 2, 20),
(2, 7, 3),
(3, 13, 5),
(3, 14, 10),
(3, 16, 1);
