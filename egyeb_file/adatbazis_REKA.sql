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

ALTER TABLE `Felhasznalo` ADD FOREIGN KEY (`id`) REFERENCES `Ceg` (`alkalmazott`);

ALTER TABLE `Termek` ADD FOREIGN KEY (`tulajdonos`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Partnerseg` ADD FOREIGN KEY (`elado`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Partnerseg` ADD FOREIGN KEY (`vevo`) REFERENCES `Ceg` (`id`);

ALTER TABLE `Termek` ADD FOREIGN KEY (`kategoria`) REFERENCES `Termek_kategoria` (`id`);

ALTER TABLE `Termek` ADD FOREIGN KEY (`id`) REFERENCES `RendelesTetel` (`termek_id`);

ALTER TABLE `RendelesTetel` ADD FOREIGN KEY (`rendeles_id`) REFERENCES `Rendeles` (`id`);

ALTER TABLE `Rendeles` ADD FOREIGN KEY (`partnerseg`) REFERENCES `Partnerseg` (`id`);

ALTER TABLE `Rendeles` ADD FOREIGN KEY (`sz_cim`) REFERENCES `Felhasznalo` (`id`);
