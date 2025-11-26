-- ==========================
-- TÁBLÁK TÖRLÉSE (ha léteznek)
-- ==========================
DROP TABLE IF EXISTS RendelesTetel;
DROP TABLE IF EXISTS Rendeles;
DROP TABLE IF EXISTS Termek;
DROP TABLE IF EXISTS Partnerseg;
DROP TABLE IF EXISTS Felhasznalo;
DROP TABLE IF EXISTS Ceg;
DROP TABLE IF EXISTS Termek_kategoria;


-- ==========================
-- TÁBLÁK LÉTREHOZÁSA (ha léteznek)
-- ==========================
CREATE TABLE `Ceg` (
  `id` integer PRIMARY KEY,
  `nev` varchar(100),
  `adoszam` varchar(11),
  `euAdoszam` varchar(20),
  `cim` varchar(255),
  `email` varchar(100),
  `telefon` varchar(15),
  `alkalmazott` text NOT NULL,
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


-- ==========================
-- TÁBLÁK ÖSSZEKAPCSOLÁSA
-- ==========================
ALTER TABLE `Felhasznalo` ADD FOREIGN KEY (`id`) REFERENCES `Ceg` (`alkalmazott`);

ALTER TABLE `Termek` ADD FOREIGN KEY (`tulajdonos`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Partnerseg` ADD FOREIGN KEY (`elado`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Partnerseg` ADD FOREIGN KEY (`vevo`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Termek` ADD FOREIGN KEY (`kategoria`) REFERENCES `Termek_kategoria` (`id`);

ALTER TABLE `Termek` ADD FOREIGN KEY (`id`) REFERENCES `RendelesTetel` (`termek_id`);

ALTER TABLE `RendelesTetel` ADD FOREIGN KEY (`rendeles_id`) REFERENCES `Rendeles` (`id`);

ALTER TABLE `Rendeles` ADD FOREIGN KEY (`partnerseg`) REFERENCES `Partnerseg` (`id`);

ALTER TABLE `Rendeles` ADD FOREIGN KEY (`sz_cim`) REFERENCES `Felhasznalo` (`id`);


-- ==========================
-- TERMEK KATEGÓRIÁK
-- ==========================
INSERT INTO Termek_kategoria (id, nev) VALUES
(1, 'Irodaszerek'),
(2, 'Élelmiszer'),
(3, 'Elektronika'),
(4, 'Tisztítószer');


-- ==========================
-- CÉGEK
-- ==========================
INSERT INTO Ceg (id, nev, adoszam, euAdoszam, cim, email, telefon, alkalmazott, elofiz) VALUES
(1, 'Alfa Kft', '12345678-1-12', 'HU12345678', 'Budapest, Fő utca 1.', 'info@alfakft.hu', '0611111111', '1', true),
(2, 'Beta Zrt', '22345678-1-22', 'HU22345678', 'Debrecen, Kossuth tér 3.', 'kapcsolat@betazrt.hu', '0620111111', '2', true),
(3, 'Gamma Bt', '32345678-1-33', 'HU32345678', 'Szeged, Piac utca 5.', 'iroda@gammabt.hu', '0630111111', '3', false),
(4, 'Delta Kft', '42345678-1-44', 'HU42345678', 'Pécs, Nagy Lajos király útja 10.', 'info@deltakft.hu', '0640111111', '4', true);


-- ==========================
-- FELHASZNÁLÓK
-- ==========================
INSERT INTO Felhasznalo (id, nev, jelszo, kategoria, telephely_cim, telefon) VALUES
(1, 'Nagy Péter', 'pw1', 1, 'Budapest, Fő utca 1.', '0612345678'),
(2, 'Tóth László', 'pw3', 2, 'Debrecen, Kossuth tér 3.', '0620123456'),
(3, 'Szabó Márton', 'pw5', 1, 'Szeged, Piac utca 5.', '0630123456'),
(4, 'Varga Péter', 'pw7', 2, 'Pécs, Nagy Lajos út 10.', '0640123456'),



-- ==========================
-- PARTNERSÉGEK
-- ==========================
INSERT INTO Partnerseg (id, elado, vevo, fizetesi_ido, fizetesi_forma) VALUES
(1, 1, 2, 30, 'Átutalás'),
(2, 3, 4, 14, 'Készpénz');


-- ==========================
-- TERMÉKEK – ALFA KFT (1)
-- ==========================
INSERT INTO Termek (id, tulajdonos, nev, cikkszam, mennyiseg, kiszereles, min_vas_menny, leiras, ar, kategoria, afa_kulcs) VALUES
(1, 1, 'Golyóstoll kék', 'ALF-001', 500, 'db', 10, 'Kék golyóstoll', 120, 1, 27),
(2, 1, 'Jegyzetfüzet A5', 'ALF-002', 300, 'db', 5, 'Füzet 80 lapos', 450, 1, 27),
(3, 1, 'Fehér nyomtatópapír', 'ALF-003', 1000, 'cs', 1, 'A4 80g', 1600, 1, 27),
(4, 1, 'Irodai szék', 'ALF-004', 50, 'db', 1, 'Ergonomikus szék', 29000, 3, 27),
(5, 1, 'Monitor 24"', 'ALF-005', 40, 'db', 1, 'Full HD monitor', 52000, 3, 27),
(6, 1, 'Tűzőgép', 'ALF-006', 200, 'db', 5, 'Fém tűzőgép', 1500, 1, 27),
(7, 1, 'Zselés toll készlet', 'ALF-007', 100, 'cs', 1, 'Színes toll készlet', 900, 1, 27);


-- ==========================
-- TERMÉKEK – BETA ZRT (2)
-- ==========================
INSERT INTO Termek VALUES
(8, 2, 'Szalámi', 'BET-001', 200, 'kg', 1, 'Paprikás szalámi', 3200, 2, 27),
(9, 2, 'Kenyér', 'BET-002', 150, 'db', 1, 'Fehér kenyér', 450, 2, 18),
(10, 2, 'Kávé', 'BET-003', 300, 'cs', 1, 'Őrölt kávé 500g', 1800, 2, 27),
(11, 2, 'Tea citromos', 'BET-004', 250, 'cs', 1, 'Filteres tea', 700, 2, 27),
(12, 2, 'Keksz', 'BET-005', 400, 'cs', 1, 'Vajas keksz', 550, 2, 27),
(13, 2, 'Cukor kristály', 'BET-006', 500, 'kg', 1, '1 kg kristálycukor', 390, 2, 5),
(14, 2, 'Liszt BL55', 'BET-007', 300, 'kg', 1, 'Finomliszt 1 kg', 350, 2, 5);


-- ==========================
-- TERMÉKEK – GAMMA BT (3)
-- ==========================
INSERT INTO Termek VALUES
(15, 3, 'Laptop 15"', 'GAM-001', 20, 'db', 1, 'Irodai laptop', 210000, 3, 27),
(16, 3, 'USB kábel', 'GAM-002', 300, 'db', 5, 'USB-A – USB-C kábel', 1500, 3, 27),
(17, 3, 'Egér vezetékes', 'GAM-003', 150, 'db', 1, 'Optikai egér', 3000, 3, 27),
(18, 3, 'Billentyűzet', 'GAM-004', 100, 'db', 1, 'USB billentyűzet', 4500, 3, 27),
(19, 3, 'Pendrive 32GB', 'GAM-005', 200, 'db', 1, '32GB pendrive', 3500, 3, 27),
(20, 3, 'Monitor 27"', 'GAM-006', 30, 'db', 1, 'QHD monitor', 89000, 3, 27),
(21, 3, 'Fejhallgató', 'GAM-007', 80, 'db', 1, 'Zajszűrős headset', 12000, 3, 27);


-- ==========================
-- RENDELÉSEK
-- ==========================
INSERT INTO Rendeles (id, partnerseg, datum, status, sz_cim) VALUES
(1, 1, '2025-02-01', 'Új', 3),
(2, 2, '2025-02-03', 'Folyamatban', 5);


-- ==========================
-- RENDELÉS TÉTELEK
-- ==========================
INSERT INTO RendelesTetel (rendeles_id, termek_id, mennyiseg) VALUES
(1, 1, 20),
(1, 3, 5),
(1, 6, 10),

(2, 15, 2),
(2, 17, 5);
