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

ALTER TABLE `Rendeles` ADD FOREIGN KEY (`id`) REFERENCES `Szamla` (`rendeles_id`);
ALTER TABLE `Szamla` ADD FOREIGN KEY (`rendeles_id`) REFERENCES `Rendeles` (`id`);

ALTER TABLE `Szamla` ADD FOREIGN KEY (`kiallito`) REFERENCES `Ceg` (`id`);
