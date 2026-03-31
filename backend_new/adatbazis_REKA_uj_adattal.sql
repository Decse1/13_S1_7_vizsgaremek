CREATE TABLE `Ceg` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `nev` VARCHAR(100) NOT NULL,
  `adoszam` VARCHAR(11) NOT NULL,
  `euAdoszam` VARCHAR(20),
  `cim` VARCHAR(255) NOT NULL,
  `email` VARCHAR(100),
  `telefon` VARCHAR(15),
  `elofiz` BOOLEAN,
  `szamla_minta` VARCHAR(15),
  `rendeles_minta` VARCHAR(15),
  `szamlaszam` VARCHAR(26)
);

CREATE TABLE `Felhasznalo` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `nev` VARCHAR(100) NOT NULL,
  `jelszo` VARCHAR(100) NOT NULL,
  `telephely_cim` VARCHAR(255) NOT NULL,
  `telefon` VARCHAR(15),
  `rendeles_osszkesz` BOOLEAN,
  `rendeles_lead` BOOLEAN,
  `szamla_keszit` BOOLEAN,
  `raktar_kezel` BOOLEAN
);

CREATE TABLE `Partnerseg` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `elado` INT NOT NULL,
  `vevo` INT NOT NULL,
  `fizetesi_ido` INT NOT NULL,
  `fizetesi_forma` VARCHAR(50) NOT NULL
);

CREATE TABLE `Termek_kategoria` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `nev` VARCHAR(100) NOT NULL
);

CREATE TABLE `Termek` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `tulajdonos` INT NOT NULL,
  `nev` VARCHAR(100) NOT NULL,
  `cikkszam` VARCHAR(100),
  `mennyiseg` INT,
  `kiszereles` VARCHAR(10),
  `min_vas_menny` INT,
  `leiras` TEXT,
  `ar` INT NOT NULL,
  `kategoria` INT NOT NULL,
  `afa_kulcs` INT NOT NULL
);

CREATE TABLE `Rendeles` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `partnerseg` INT NOT NULL,
  `datum` DATE NOT NULL,
  `status` VARCHAR(10) NOT NULL,
  `sz_cim` INT NOT NULL,
  `rendeles_szam` VARCHAR(15) NOT NULL,
  `szamla_kesz` BOOLEAN,
  `sztorno` BOOLEAN
);

CREATE TABLE `RendelesTetel` (
  `rendeles_id` INT NOT NULL,
  `termek_id` INT NOT NULL,
  `mennyiseg` INT NOT NULL,
  `nev` VARCHAR(100) NOT NULL,
  `ar` INT NOT NULL,
  `afa_kulcs` INT NOT NULL,
  PRIMARY KEY (`rendeles_id`, `termek_id`)
);

CREATE TABLE `Ceg_alkalmazott` (
  `cegId` INT NOT NULL,
  `felhasznaloId` INT NOT NULL
);

CREATE TABLE `Szamla` (
  `szamla_sz` VARCHAR(26) NOT NULL,
  `rendeles_id` INT NOT NULL,
  `szamla_tipus` VARCHAR(10) NOT NULL,
  `kiallitas_datum` DATE NOT NULL,
  `fizetesi_ido` DATE NOT NULL,
  `kiallito` INT NOT NULL
);

CREATE INDEX `Partnerseg_index_0` ON `Partnerseg` (`elado`);

CREATE INDEX `Partnerseg_index_1` ON `Partnerseg` (`vevo`);

CREATE INDEX `Termek_index_2` ON `Termek` (`tulajdonos`);

CREATE INDEX `Termek_index_3` ON `Termek` (`kategoria`);

CREATE INDEX `Rendeles_index_4` ON `Rendeles` (`partnerseg`);

CREATE INDEX `Rendeles_index_5` ON `Rendeles` (`sz_cim`);

CREATE INDEX `RendelesTetel_index_6` ON `RendelesTetel` (`rendeles_id`);

CREATE INDEX `RendelesTetel_index_7` ON `RendelesTetel` (`termek_id`);

CREATE INDEX `Ceg_alkalmazott_index_8` ON `Ceg_alkalmazott` (`cegId`);

CREATE INDEX `Ceg_alkalmazott_index_9` ON `Ceg_alkalmazott` (`felhasznaloId`);

ALTER TABLE `Partnerseg` ADD FOREIGN KEY (`elado`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Partnerseg` ADD FOREIGN KEY (`vevo`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Termek` ADD FOREIGN KEY (`tulajdonos`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Termek` ADD FOREIGN KEY (`kategoria`) REFERENCES `Termek_kategoria` (`id`);

ALTER TABLE `Rendeles` ADD FOREIGN KEY (`partnerseg`) REFERENCES `Partnerseg` (`id`);

ALTER TABLE `Rendeles` ADD FOREIGN KEY (`sz_cim`) REFERENCES `Felhasznalo` (`id`);

ALTER TABLE `RendelesTetel` ADD FOREIGN KEY (`rendeles_id`) REFERENCES `Rendeles` (`id`);

ALTER TABLE `RendelesTetel` ADD FOREIGN KEY (`termek_id`) REFERENCES `Termek` (`id`);

ALTER TABLE `Ceg_alkalmazott` ADD FOREIGN KEY (`cegId`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Ceg_alkalmazott` ADD FOREIGN KEY (`felhasznaloId`) REFERENCES `Felhasznalo` (`id`);

ALTER TABLE `Szamla` ADD FOREIGN KEY (`rendeles_id`) REFERENCES `Rendeles` (`id`);

ALTER TABLE `Szamla` ADD FOREIGN KEY (`kiallito`) REFERENCES `Ceg` (`id`);

INSERT INTO `ceg` (`id`, `nev`, `adoszam`, `euAdoszam`, `cim`, `email`, `telefon`, `elofiz`, `szamla_minta`, `rendeles_minta`, `szamlaszam`) VALUES
(1, 'Nagyker Profi Kft.', '11111111211', 'HU11111111', '1011 Bp, Fő utca 10.', 'office@nagyker.hu', '+3610000001', 1, 'NP-0000', 'R-NP-0000', '11700000-11111111-00000000'),
(2, 'Kisker Kicsi Bt.', '22222222-1-', NULL, '2000 Szentendre, Duna korzó 5.', 'bolt@kicsibt.hu', '+3626000002', 0, '', '', '10400000-22222222-00000000'),
(3, 'Logisztikai Óriás Zrt.', '33333333-2-', 'HU33333333', '6000 Kecskemét, Ipar út 1.', 'log@oriaszrt.hu', '+3676000003', 1, 'LOG-0000', 'R-LOG-0000', '12000000-33333333-44556677'),
(4, 'Webshop Világ Kft.', '44444444-2-', 'HU44444444', '9022 Győr, Városház tér 1.', 'hello@webshopvilag.hu', '+3696000004', 1, 'WV-0000', 'R-WV-0000', '10100000-44444444-55667788'),
(5, 'Helyi Pékség Kft.', '55555555-1-', NULL, '6720 Szeged, Klauzál tér 3.', 'info@pekszeg.hu', '+3662000005', 0, '', NULL, '11600000-55555555-66778899'),
(12, 'INTEGRÁL Zrt.', '13984614203', '', '6100 Kiskunfélegyháza, Szalay Gyula park 1. Fsz. 1. ajtó', 'integral.zrt@integralzrt.eu', '+3676463144', 1, '-', 'INT0000', '12345678-12345678-12345678');

INSERT INTO `felhasznalo` (`id`, `nev`, `jelszo`, `telephely_cim`, `telefon`, `rendeles_osszkesz`, `rendeles_lead`, `szamla_keszit`, `raktar_kezel`) VALUES
(1, 'Adminisztrátor Anna', '$2b$10$ogS6/l1D3ek81g5/1imZFuq7bYq26RR.7Hi786xOwi8K1AgAVK0Ke', 'Budapest', '+36301111111', 1, 1, 1, 0),
(2, 'Raktáros Róbert', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Budapest', '+36302222222', 0, 0, 0, 1),
(3, 'Beszerző Béla', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Budapest', '+36303333333', 0, 1, 0, 0),
(4, 'Kicsi Károly', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Szentendre', '+36304444444', 1, 1, 1, 1),
(5, 'Logisztika Lajos', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Kecskemét', '+36305555555', 1, 1, 1, 1),
(6, 'Webes Wanda', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Győr', '+36306666666', 1, 1, 1, 1),
(7, 'Pék Pál', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Szeged', '+36307777777', 1, 1, 1, 1),
(15, 'Int Imre', '$2b$10$ogS6/l1D3ek81g5/1imZFuq7bYq26RR.7Hi786xOwi8K1AgAVK0Ke', '6100 Kiskunfélegyháza, Szalay Gyula park 1. Fsz. 1. ajtó', '+3676463144', 1, 1, 1, 1);

INSERT INTO `ceg_alkalmazott` (`cegId`, `felhasznaloId`) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 4),
(3, 5),
(4, 6),
(5, 7),
(12, 15);

INSERT INTO `partnerseg` (`id`, `elado`, `vevo`, `fizetesi_ido`, `fizetesi_forma`) VALUES
(1, 1, 2, 8, 'Készpénz'),
(2, 1, 4, 15, 'Átutalás'),
(11, 12, 1, 30, 'Átutalás');

INSERT INTO `termek_kategoria` (`id`, `nev`) VALUES
(1, 'Elektronika'),
(2, 'Pékáru'),
(7, 'Játék');

INSERT INTO `termek` (`id`, `tulajdonos`, `nev`, `cikkszam`, `mennyiseg`, `kiszereles`, `min_vas_menny`, `leiras`, `ar`, `kategoria`, `afa_kulcs`) VALUES
(1, 1, 'Laptop Business', 'NB-001', 15, 'db', 1, 'I7, 16GB RAM', 320000, 1, 27),
(2, 1, 'Vezeték nélküli egér', 'M-02', 80, 'db', 2, 'Optikai', 6500, 1, 27),
(13, 12, 'Lego', 'l', 10, 'db', 1, 'l', 100, 7, 27);