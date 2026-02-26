
--
-- Tábla szerkezet ehhez a táblához `ceg`
--

CREATE TABLE `ceg` (
  `id` int(11) NOT NULL,
  `nev` varchar(100) NOT NULL,
  `adoszam` varchar(11) NOT NULL,
  `euAdoszam` varchar(20) DEFAULT NULL,
  `cim` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `telefon` varchar(15) DEFAULT NULL,
  `elofiz` tinyint(1) DEFAULT NULL,
  `szamla_minta` varchar(15) DEFAULT NULL,
  `rendeles_minta` varchar(15) DEFAULT NULL,
  `szamlaszam` varchar(26) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `ceg`
--

INSERT INTO `ceg` (`id`, `nev`, `adoszam`, `euAdoszam`, `cim`, `email`, `telefon`, `elofiz`, `szamla_minta`, `rendeles_minta`, `szamlaszam`) VALUES
(1, 'Nagyker Profi Kft.', '11111111-2-', 'HU11111111', '1011 Bp, Fő utca 10.', 'office@nagyker.hu', '+3610000001', 1, 'NP-0000', 'R-NP-0000', '11700000-11111111-00000000'),
(2, 'Kisker Kicsi Bt.', '22222222-1-', NULL, '2000 Szentendre, Duna korzó 5.', 'bolt@kicsibt.hu', '+3626000002', 0, '', '', '10400000-22222222-00000000'),
(3, 'Logisztikai Óriás Zrt.', '33333333-2-', 'HU33333333', '6000 Kecskemét, Ipar út 1.', 'log@oriaszrt.hu', '+3676000003', 1, 'LOG-0000', 'R-LOG-0000', '12000000-33333333-44556677'),
(4, 'Webshop Világ Kft.', '44444444-2-', 'HU44444444', '9022 Győr, Városház tér 1.', 'hello@webshopvilag.hu', '+3696000004', 1, 'WV-0000', 'R-WV-0000', '10100000-44444444-55667788'),
(5, 'Helyi Pékség Kft.', '55555555-1-', NULL, '6720 Szeged, Klauzál tér 3.', 'info@pekszeg.hu', '+3662000005', 0, '', NULL, '11600000-55555555-66778899');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `ceg_alkalmazott`
--

CREATE TABLE `ceg_alkalmazott` (
  `cegId` int(11) NOT NULL,
  `felhasznaloId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `ceg_alkalmazott`
--

INSERT INTO `ceg_alkalmazott` (`cegId`, `felhasznaloId`) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 4),
(3, 5),
(4, 6),
(5, 7);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `felhasznalo`
--

CREATE TABLE `felhasznalo` (
  `id` int(11) NOT NULL,
  `nev` varchar(100) NOT NULL,
  `jelszo` varchar(100) NOT NULL,
  `telephely_cim` varchar(255) NOT NULL,
  `telefon` varchar(15) DEFAULT NULL,
  `rendeles_osszkesz` tinyint(1) DEFAULT NULL,
  `rendeles_lead` tinyint(1) DEFAULT NULL,
  `szamla_keszit` tinyint(1) DEFAULT NULL,
  `raktar_kezel` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `felhasznalo`
--

INSERT INTO `felhasznalo` (`id`, `nev`, `jelszo`, `telephely_cim`, `telefon`, `rendeles_osszkesz`, `rendeles_lead`, `szamla_keszit`, `raktar_kezel`) VALUES
(1, 'Adminisztrátor Anna', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Budapest', '+36301111111', 1, 1, 1, 0),
(2, 'Raktáros Róbert', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Budapest', '+36302222222', 0, 0, 0, 1),
(3, 'Beszerző Béla', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Budapest', '+36303333333', 0, 1, 0, 0),
(4, 'Kicsi Károly', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Szentendre', '+36304444444', 1, 1, 1, 1),
(5, 'Logisztika Lajos', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Kecskemét', '+36305555555', 1, 1, 1, 1),
(6, 'Webes Wanda', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Győr', '+36306666666', 1, 1, 1, 1),
(7, 'Pék Pál', '$2b$10$wvjT11To6ojDNtv0L5iV0.TZ9NgS60BzwNcf1KEojOZYI/UvkSomm', 'Szeged', '+36307777777', 1, 1, 1, 1);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `partnerseg`
--

CREATE TABLE `partnerseg` (
  `id` int(11) NOT NULL,
  `elado` int(11) NOT NULL,
  `vevo` int(11) NOT NULL,
  `fizetesi_ido` int(11) NOT NULL,
  `fizetesi_forma` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `partnerseg`
--

INSERT INTO `partnerseg` (`id`, `elado`, `vevo`, `fizetesi_ido`, `fizetesi_forma`) VALUES
(1, 1, 2, 8, 'Készpénz'),
(2, 1, 4, 15, 'Átutalás');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `rendeles`
--

CREATE TABLE `rendeles` (
  `id` int(11) NOT NULL,
  `partnerseg` int(11) NOT NULL,
  `datum` date NOT NULL,
  `status` varchar(10) NOT NULL,
  `sz_cim` int(11) NOT NULL,
  `rendeles_szam` varchar(15) NOT NULL,
  `szamla_kesz` tinyint(1) DEFAULT NULL,
  `sztorno` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `rendeles`
--

INSERT INTO `rendeles` (`id`, `partnerseg`, `datum`, `status`, `sz_cim`, `rendeles_szam`, `szamla_kesz`, `sztorno`) VALUES
(1, 1, '2026-02-26', 'Kész', 4, 'R-NP-0001', 1, 0);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `rendelestetel`
--

CREATE TABLE `rendelestetel` (
  `rendeles_id` int(11) NOT NULL,
  `termek_id` int(11) NOT NULL,
  `mennyiseg` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `rendelestetel`
--

INSERT INTO `rendelestetel` (`rendeles_id`, `termek_id`, `mennyiseg`) VALUES
(1, 1, 3),
(1, 2, 10);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `szamla`
--

CREATE TABLE `szamla` (
  `szamla_sz` varchar(26) NOT NULL,
  `rendeles_id` int(11) NOT NULL,
  `szamla_tipus` varchar(10) NOT NULL,
  `kiallitas_datum` date NOT NULL,
  `fizetesi_ido` date NOT NULL,
  `kiallito` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `szamla`
--

INSERT INTO `szamla` (`szamla_sz`, `rendeles_id`, `szamla_tipus`, `kiallitas_datum`, `fizetesi_ido`, `kiallito`) VALUES
('NP-0001', 1, 'Eredeti', '2026-02-26', '2026-03-05', 1);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `termek`
--

CREATE TABLE `termek` (
  `id` int(11) NOT NULL,
  `tulajdonos` int(11) NOT NULL,
  `nev` varchar(100) NOT NULL,
  `cikkszam` varchar(100) DEFAULT NULL,
  `mennyiseg` int(11) DEFAULT NULL,
  `kiszereles` varchar(10) DEFAULT NULL,
  `min_vas_menny` int(11) DEFAULT NULL,
  `leiras` text DEFAULT NULL,
  `ar` int(11) NOT NULL,
  `kategoria` int(11) NOT NULL,
  `afa_kulcs` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `termek`
--

INSERT INTO `termek` (`id`, `tulajdonos`, `nev`, `cikkszam`, `mennyiseg`, `kiszereles`, `min_vas_menny`, `leiras`, `ar`, `kategoria`, `afa_kulcs`) VALUES
(1, 1, 'Laptop Business', 'NB-001', 15, 'db', 1, 'I7, 16GB RAM', 320000, 1, 27),
(2, 1, 'Vezeték nélküli egér', 'M-02', 80, 'db', 2, 'Optikai', 6500, 1, 27);

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `termek_kategoria`
--

CREATE TABLE `termek_kategoria` (
  `id` int(11) NOT NULL,
  `nev` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_hungarian_ci;

--
-- A tábla adatainak kiíratása `termek_kategoria`
--

INSERT INTO `termek_kategoria` (`id`, `nev`) VALUES
(1, 'Elektronika'),
(2, 'Pékáru');

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `ceg`
--
ALTER TABLE `ceg`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `ceg_alkalmazott`
--
ALTER TABLE `ceg_alkalmazott`
  ADD KEY `Ceg_alkalmazott_index_8` (`cegId`),
  ADD KEY `Ceg_alkalmazott_index_9` (`felhasznaloId`);

--
-- A tábla indexei `felhasznalo`
--
ALTER TABLE `felhasznalo`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `partnerseg`
--
ALTER TABLE `partnerseg`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Partnerseg_index_0` (`elado`),
  ADD KEY `Partnerseg_index_1` (`vevo`);

--
-- A tábla indexei `rendeles`
--
ALTER TABLE `rendeles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Rendeles_index_4` (`partnerseg`),
  ADD KEY `Rendeles_index_5` (`sz_cim`);

--
-- A tábla indexei `rendelestetel`
--
ALTER TABLE `rendelestetel`
  ADD PRIMARY KEY (`rendeles_id`,`termek_id`),
  ADD KEY `RendelesTetel_index_6` (`rendeles_id`),
  ADD KEY `RendelesTetel_index_7` (`termek_id`);

--
-- A tábla indexei `szamla`
--
ALTER TABLE `szamla`
  ADD KEY `rendeles_id` (`rendeles_id`),
  ADD KEY `kiallito` (`kiallito`);

--
-- A tábla indexei `termek`
--
ALTER TABLE `termek`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Termek_index_2` (`tulajdonos`),
  ADD KEY `Termek_index_3` (`kategoria`);

--
-- A tábla indexei `termek_kategoria`
--
ALTER TABLE `termek_kategoria`
  ADD PRIMARY KEY (`id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `ceg`
--
ALTER TABLE `ceg`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT a táblához `felhasznalo`
--
ALTER TABLE `felhasznalo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT a táblához `partnerseg`
--
ALTER TABLE `partnerseg`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT a táblához `rendeles`
--
ALTER TABLE `rendeles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `termek`
--
ALTER TABLE `termek`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT a táblához `termek_kategoria`
--
ALTER TABLE `termek_kategoria`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `ceg_alkalmazott`
--
ALTER TABLE `ceg_alkalmazott`
  ADD CONSTRAINT `ceg_alkalmazott_ibfk_1` FOREIGN KEY (`cegId`) REFERENCES `ceg` (`id`),
  ADD CONSTRAINT `ceg_alkalmazott_ibfk_2` FOREIGN KEY (`felhasznaloId`) REFERENCES `felhasznalo` (`id`);

--
-- Megkötések a táblához `partnerseg`
--
ALTER TABLE `partnerseg`
  ADD CONSTRAINT `partnerseg_ibfk_1` FOREIGN KEY (`elado`) REFERENCES `ceg` (`id`),
  ADD CONSTRAINT `partnerseg_ibfk_2` FOREIGN KEY (`vevo`) REFERENCES `ceg` (`id`);

--
-- Megkötések a táblához `rendeles`
--
ALTER TABLE `rendeles`
  ADD CONSTRAINT `rendeles_ibfk_1` FOREIGN KEY (`partnerseg`) REFERENCES `partnerseg` (`id`),
  ADD CONSTRAINT `rendeles_ibfk_2` FOREIGN KEY (`sz_cim`) REFERENCES `felhasznalo` (`id`);

--
-- Megkötések a táblához `rendelestetel`
--
ALTER TABLE `rendelestetel`
  ADD CONSTRAINT `rendelestetel_ibfk_1` FOREIGN KEY (`rendeles_id`) REFERENCES `rendeles` (`id`),
  ADD CONSTRAINT `rendelestetel_ibfk_2` FOREIGN KEY (`termek_id`) REFERENCES `termek` (`id`);

--
-- Megkötések a táblához `szamla`
--
ALTER TABLE `szamla`
  ADD CONSTRAINT `szamla_ibfk_1` FOREIGN KEY (`rendeles_id`) REFERENCES `rendeles` (`id`),
  ADD CONSTRAINT `szamla_ibfk_2` FOREIGN KEY (`kiallito`) REFERENCES `ceg` (`id`);

--
-- Megkötések a táblához `termek`
--
ALTER TABLE `termek`
  ADD CONSTRAINT `termek_ibfk_1` FOREIGN KEY (`tulajdonos`) REFERENCES `ceg` (`id`),
  ADD CONSTRAINT `termek_ibfk_2` FOREIGN KEY (`kategoria`) REFERENCES `termek_kategoria` (`id`);
COMMIT;
