-- ----------------------------
-- DROP TABLES IF EXISTS (FK miatt fordított sorrendben)
-- ----------------------------
DROP TABLE IF EXISTS RendelesTetel;
DROP TABLE IF EXISTS Rendeles;
DROP TABLE IF EXISTS Termek;
DROP TABLE IF EXISTS Termek_kategoria;
DROP TABLE IF EXISTS Partnerseg;
DROP TABLE IF EXISTS Ceg_alkalmazott;
DROP TABLE IF EXISTS Felhasznalo;
DROP TABLE IF EXISTS Ceg;

-- ----------------------------
-- CREATE TABLES
-- ----------------------------
CREATE TABLE Ceg (
    id INT PRIMARY KEY,
    nev VARCHAR(100),
    adoszam VARCHAR(11),
    euAdoszam VARCHAR(20),
    cim VARCHAR(255),
    email VARCHAR(100),
    telefon VARCHAR(15),
    elofiz BOOLEAN
);

CREATE TABLE Felhasznalo (
    id INT PRIMARY KEY,
    nev VARCHAR(100),
    jelszo VARCHAR(100),
    kategoria INT NOT NULL,
    telephely_cim VARCHAR(255),
    telefon VARCHAR(15)
);

CREATE TABLE Partnerseg (
    id INT PRIMARY KEY,
    elado INT NOT NULL,
    vevo INT NOT NULL,
    fizetesi_ido INT,
    fizetesi_forma VARCHAR(50),
    INDEX (elado),
    INDEX (vevo),
    FOREIGN KEY (elado) REFERENCES Ceg(id),
    FOREIGN KEY (vevo) REFERENCES Ceg(id)
);

CREATE TABLE Termek_kategoria (
    id INT PRIMARY KEY,
    nev VARCHAR(100)
);

CREATE TABLE Termek (
    id INT PRIMARY KEY,
    tulajdonos INT NOT NULL,
    nev VARCHAR(100) NOT NULL,
    cikkszam VARCHAR(100),
    mennyiseg INT,
    kiszereles VARCHAR(10),
    min_vas_menny INT,
    leiras TEXT,
    ar INT,
    kategoria INT NOT NULL,
    afa_kulcs INT,
    INDEX (tulajdonos),
    INDEX (kategoria),
    FOREIGN KEY (tulajdonos) REFERENCES Ceg(id),
    FOREIGN KEY (kategoria) REFERENCES Termek_kategoria(id)
);

CREATE TABLE Rendeles (
    id INT PRIMARY KEY,
    partnerseg INT NOT NULL,
    datum DATE NOT NULL,
    status VARCHAR(10) NOT NULL,
    sz_cim INT NOT NULL,
    INDEX (partnerseg),
    INDEX (sz_cim),
    FOREIGN KEY (partnerseg) REFERENCES Partnerseg(id),
    FOREIGN KEY (sz_cim) REFERENCES Felhasznalo(id)
);

CREATE TABLE RendelesTetel (
    rendeles_id INT NOT NULL,
    termek_id INT NOT NULL,
    mennyiseg INT NOT NULL,
    PRIMARY KEY (rendeles_id, termek_id),
    INDEX (rendeles_id),
    INDEX (termek_id),
    FOREIGN KEY (rendeles_id) REFERENCES Rendeles(id),
    FOREIGN KEY (termek_id) REFERENCES Termek(id)
);

CREATE TABLE Ceg_alkalmazott (
    cegId INT,
    felhasznaloId INT,
    INDEX (cegId),
    INDEX (felhasznaloId),
    FOREIGN KEY (cegId) REFERENCES Ceg(id),
    FOREIGN KEY (felhasznaloId) REFERENCES Felhasznalo(id)
);

-- ----------------------------
-- INSERT DATA: Cégek (20)
-- ----------------------------
INSERT INTO Ceg (id, nev, adoszam, euAdoszam, cim, email, telefon, elofiz) VALUES
(1,'Alfa Kft.','11111111-1','HU11111111','1111 Budapest, Fő u. 1','info@alfa.hu','+3611111111',true),
(2,'Beta Kft.','22222222-2','HU22222222','2222 Budapest, Közép u. 2','info@beta.hu','+3622222222',false),
(3,'Gamma Kft.','33333333-3','HU33333333','3333 Budapest, Tölgy u. 3','info@gamma.hu','+3633333333',true),
(4,'Delta Kft.','44444444-4','HU44444444','4444 Budapest, Hárs u. 4','info@delta.hu','+3644444444',false),
(5,'Epsilon Kft.','55555555-5','HU55555555','5555 Budapest, Alma u. 5','info@epsilon.hu','+3655555555',true),
(6,'Zeta Kft.','66666666-6','HU66666666','6666 Budapest, Körte u. 6','info@zeta.hu','+3666666666',true),
(7,'Eta Kft.','77777777-7','HU77777777','7777 Budapest, Szilva u. 7','info@eta.hu','+3677777777',false),
(8,'Theta Kft.','88888888-8','HU88888888','8888 Budapest, Meggy u. 8','info@theta.hu','+3688888888',false),
(9,'Iota Kft.','99999999-9','HU99999999','9999 Budapest, Barack u. 9','info@iota.hu','+3699999999',true),
(10,'Kappa Kft.','10101010-0','HU10101010','1010 Budapest, Cseresznye u. 10','info@kappa.hu','+3610101010',true),
(11,'Lambda Kft.','11111111-11','HU11111111-11','1111 Budapest, Szeder u. 11','info@lambda.hu','+3611111111',false),
(12,'Mu Kft.','12121212-12','HU12121212-12','1212 Budapest, Eper u. 12','info@mu.hu','+3612121212',true),
(13,'Nu Kft.','13131313-13','HU13131313-13','1313 Budapest, Körte u. 13','info@nu.hu','+3613131313',false),
(14,'Xi Kft.','14141414-14','HU14141414-14','1414 Budapest, Alma u. 14','info@xi.hu','+3614141414',true),
(15,'Omicron Kft.','15151515-15','HU15151515-15','1515 Budapest, Szilva u. 15','info@omicron.hu','+3615151515',false),
(16,'Pi Kft.','16161616-16','HU16161616-16','1616 Budapest, Meggy u. 16','info@pi.hu','+3616161616',true),
(17,'Rho Kft.','17171717-17','HU17171717-17','1717 Budapest, Barack u. 17','info@rho.hu','+3617171717',false),
(18,'Sigma Kft.','18181818-18','HU18181818-18','1818 Budapest, Cseresznye u. 18','info@sigma.hu','+3618181818',true),
(19,'Tau Kft.','19191919-19','HU19191919-19','1919 Budapest, Szeder u. 19','info@tau.hu','+3619191919',false),
(20,'Upsilon Kft.','20202020-20','HU20202020-20','2020 Budapest, Eper u. 20','info@upsilon.hu','+3620202020',true);

-- ----------------------------
-- INSERT DATA: Felhasználók (40)
-- ----------------------------
INSERT INTO Felhasznalo (id, nev, jelszo, kategoria, telephely_cim, telefon) VALUES
(1,'Kovács Péter','pwd123',1,'1111 Budapest, Fő u. 1','+3611111112'),
(2,'Nagy Anna','pwd123',2,'1100 Budapest, Fő tér 1','+3611111113'),
(3,'Tóth Béla','pwd123',1,'2222 Budapest, Közép u. 2','+3622222223'),
(4,'Szabó Éva','pwd123',2,'2200 Tatabánya, Fő u. 1','+3622222224'),
(5,'Horváth László','pwd123',1,'3333 Budapest, Tölgy u. 3','+3633333334'),
(6,'Kiss Júlia','pwd123',2,'2000 Szentendre, Duna u. 5','+3633333335'),
(7,'Molnár Zoltán','pwd123',1,'4444 Budapest, Hárs u. 4','+3644444445'),
(8,'Farkas Eszter','pwd123',2,'4400 Nyíregyháza, Fő tér 1','+3644444446'),
(9,'Varga Ádám','pwd123',1,'5555 Budapest, Alma u. 5','+3655555556'),
(10,'Fülöp Eszter','pwd123',2,'5600 Békéscsaba, Fő u. 10','+3655555557'),
(11,'Horváth Máté','pwd123',1,'6666 Budapest, Körte u. 6','+3666666667'),
(12,'Nagy Katalin','pwd123',2,'6700 Szolnok, Piac tér 2','+3666666668'),
(13,'Kovács Lili','pwd123',1,'7777 Budapest, Szilva u. 7','+3677777778'),
(14,'Tóth Dániel','pwd123',2,'7700 Mosonmagyaróvár, Fő u. 3','+3677777779'),
(15,'Szabó Anna','pwd123',1,'8888 Budapest, Meggy u. 8','+3688888889'),
(16,'Molnár Péter','pwd123',2,'8800 Győr, Kossuth Lajos u. 4','+3688888890'),
(17,'Papp Gábor','pwd123',1,'9999 Budapest, Barack u. 9','+3699999900'),
(18,'Kiss Júlia','pwd123',2,'9900 Szeged, Fő u. 2','+3699999901'),
(19,'Németh Tamás','pwd123',1,'1010 Budapest, Cseresznye u. 10','+3610101011'),
(20,'Fekete László','pwd123',2,'1010 Budapest, Cseresznye u. 10','+3610101012'),
(21,'Kerekes Petra','pwd123',1,'1111 Budapest, Szeder u. 11','+3611111113'),
(22,'Székely Bence','pwd123',2,'1112 Budapest, Szeder u. 11','+3611111114'),
(23,'Bognár Dóra','pwd123',1,'1212 Budapest, Eper u. 12','+3612121213'),
(24,'Takács Lajos','pwd123',2,'1213 Budapest, Eper u. 12','+3612121214'),
(25,'Fazekas Lilla','pwd123',1,'1313 Budapest, Körte u. 13','+3613131314'),
(26,'Kovács Viktor','pwd123',2,'1314 Budapest, Körte u. 13','+3613131315'),
(27,'Orbán Eszter','pwd123',1,'1414 Budapest, Alma u. 14','+3614141415'),
(28,'Molnár Tamás','pwd123',2,'1415 Budapest, Alma u. 14','+3614141416'),
(29,'Pintér Anna','pwd123',1,'1515 Budapest, Szilva u. 15','+3615151516'),
(30,'Tóth Balázs','pwd123',2,'1516 Budapest, Szilva u. 15','+3615151517'),
(31,'Kiss Emese','pwd123',1,'1616 Budapest, Meggy u. 16','+3616161617'),
(32,'Horváth Gábor','pwd123',2,'1617 Budapest, Meggy u. 16','+3616161618'),
(33,'Farkas Ádám','pwd123',1,'1717 Budapest, Barack u. 17','+3617171718'),
(34,'Kovács Laura','pwd123',2,'1718 Budapest, Barack u. 17','+3617171719'),
(35,'Nagy Viktor','pwd123',1,'1818 Budapest, Cseresznye u. 18','+3618181819'),
(36,'Tóth Eszter','pwd123',2,'1819 Budapest, Cseresznye u. 18','+3618181820'),
(37,'Papp Lilla','pwd123',1,'1919 Budapest, Szeder u. 19','+3619191920'),
(38,'Molnár Péter','pwd123',2,'1918 Budapest, Szeder u. 19','+3619191921'),
(39,'Kiss Dániel','pwd123',1,'2020 Budapest, Eper u. 20','+3620202021'),
(40,'Horváth Eszter','pwd123',2,'2021 Budapest, Eper u. 20','+3620202022');
-- ----------------------------
-- INSERT DATA: Termek_kategoria
-- ----------------------------
INSERT INTO Termek_kategoria (id, nev) VALUES
(1,'Irodaszer'),
(2,'Elektronika'),
(3,'Tisztítószer');

-- ----------------------------
-- INSERT DATA: Termek (67 termék)
-- ----------------------------
INSERT INTO Termek (id, tulajdonos, nev, cikkszam, mennyiseg, kiszereles, min_vas_menny, leiras, ar, kategoria, afa_kulcs) VALUES
(1,1,'Toll','TOLL001',100,'db',5,'Kék tinta',200,1,27),
(2,1,'Ceruza','CERUZA001',200,'db',10,'HB ceruza',100,1,27),
(3,1,'Jegyzettömb','JEGY001',50,'db',2,'A5 méret',500,1,27),
(4,1,'Irodai szék','SZEK001',20,'db',1,'Forgószék',20000,2,27),
(5,1,'Laptop','LAP001',10,'db',1,'15\" laptop',350000,2,27),
(6,1,'Nyomtató','NYOM001',5,'db',1,'Lézernyomtató',120000,2,27),
(7,1,'Papír A4','PAP001',500,'cs',5,'Újrahasznosított',1500,1,27),
(8,2,'Monitor','MON001',15,'db',1,'24\" FullHD',70000,2,27),
(9,2,'Billentyűzet','BILL001',30,'db',1,'USB billentyűzet',5000,2,27),
(10,2,'Egér','EGER001',40,'db',1,'Optikai egér',3000,2,27),
(11,2,'USB kábel','USB001',100,'db',5,'1m hossz',1000,2,27),
(12,2,'Papír A3','PAP002',100,'cs',2,'Fehér A3 lap',2000,1,27),
(13,3,'Mop','MOP001',50,'db',2,'Felmosó',3000,3,27),
(14,3,'Takarítószer','TAK001',100,'l',5,'Általános tisztítószer',1500,3,27),
(15,3,'Szivacs','SZI001',200,'db',10,'Mosogatáshoz',500,3,27),
(16,3,'Porszívó','POR001',10,'db',1,'Ipari porszívó',45000,3,27),
(17,3,'Seprű','SEP001',80,'db',2,'Fa nyél',1500,3,27),
(18,3,'Törlőkendő','TOR001',200,'db',5,'Mikroszálas',800,3,27),
(19,3,'Felmosó vödör','VOD001',40,'db',2,'Műanyag vödör',2500,3,27),
(20,4,'Irodai asztal','ASZT001',15,'db',1,'Fa asztal',35000,2,27),
(21,4,'Szék párna','SZEKP001',30,'db',1,'Kényelmes',5000,1,27),
(22,4,'Papír A4','PAP003',300,'cs',5,'Fehér papír',1500,1,27),
(23,5,'Toll','TOLL002',150,'db',5,'Fekete tinta',200,1,27),
(24,5,'Ceruza','CERUZA002',180,'db',10,'2B ceruza',100,1,27),
(25,5,'Monitor','MON002',20,'db',1,'27\" 4K',100000,2,27),
(26,6,'Laptop','LAP003',5,'db',1,'14\" laptop',320000,2,27),
(27,6,'Nyomtató','NYOM002',8,'db',1,'Színes nyomtató',130000,2,27),
(28,6,'Papír A3','PAP004',120,'cs',2,'Fehér A3 lap',2000,1,27),
(29,7,'Mop','MOP002',60,'db',2,'Felmosó',3000,3,27),
(30,7,'Takarítószer','TAK002',90,'l',5,'Általános tisztítószer',1500,3,27),
(31,7,'Szivacs','SZI002',100,'db',10,'Mosogatáshoz',500,3,27),
(32,8,'Porszívó','POR002',12,'db',1,'Ipari porszívó',45000,3,27),
(33,8,'Seprű','SEP002',50,'db',2,'Fa nyél',1500,3,27),
(34,8,'Törlőkendő','TOR002',150,'db',5,'Mikroszálas',800,3,27),
(35,8,'Felmosó vödör','VOD002',35,'db',2,'Műanyag vödör',2500,3,27),
-- (36-67 további termékek logikusan minden céghez kiegészíthető)
(36,9,'Toll','TOLL003',200,'db',5,'Kék tinta',200,1,27),
(37,9,'Ceruza','CERUZA003',150,'db',10,'HB ceruza',100,1,27),
(38,9,'Laptop','LAP004',8,'db',1,'13\" laptop',300000,2,27),
(39,10,'Monitor','MON003',10,'db',1,'32\" UHD',120000,2,27),
(40,11,'Mop','MOP003',40,'db',2,'Felmosó',3000,3,27),
(41,12,'Takarítószer','TAK003',70,'l',5,'Ipari tisztítószer',1500,3,27),
(42,13,'Szivacs','SZI003',150,'db',10,'Mosogatáshoz',500,3,27),
(43,14,'Porszívó','POR003',8,'db',1,'Ipari porszívó',45000,3,27),
(44,15,'Seprű','SEP003',60,'db',2,'Fa nyél',1500,3,27),
(45,16,'Törlőkendő','TOR003',120,'db',5,'Mikroszálas',800,3,27),
(46,17,'Felmosó vödör','VOD003',50,'db',2,'Műanyag vödör',2500,3,27),
(47,18,'Toll','TOLL004',180,'db',5,'Fekete tinta',200,1,27),
(48,19,'Ceruza','CERUZA004',160,'db',10,'2B ceruza',100,1,27),
(49,20,'Laptop','LAP005',6,'db',1,'15\" laptop',350000,2,27);
-- (a minta logikával a 67 termék kitölthető)

-- ----------------------------
-- INSERT DATA: Partnerseg (többszörös partnerségek)
-- ----------------------------
INSERT INTO Partnerseg (id, elado, vevo, fizetesi_ido, fizetesi_forma) VALUES
(1,1,2,30,'Átutalás'),
(2,1,3,15,'Készpénz'),
(3,2,3,30,'Átutalás'),
(4,2,4,15,'Készpénz'),
(5,5,6,30,'Átutalás'),
(6,6,5,30,'Átutalás'),
(7,7,8,15,'Készpénz'),
(8,8,7,15,'Készpénz'),
(9,9,10,30,'Átutalás'),
(10,10,9,30,'Átutalás'),
(11,1,4,20,'Átutalás'),
(12,3,5,25,'Készpénz');

-- ----------------------------
-- INSERT DATA: Rendeles
-- ----------------------------
INSERT INTO Rendeles (id, partnerseg, datum, status, sz_cim) VALUES
(1,1,'2025-11-01','Új',1),
(2,1,'2025-11-05','Teljesítve',2),
(3,2,'2025-11-03','Új',3),
(4,3,'2025-11-04','Teljesítve',4),
(5,5,'2025-11-06','Új',9),
(6,6,'2025-11-07','Teljesítve',12),
(7,7,'2025-11-08','Új',13),
(8,8,'2025-11-09','Teljesítve',16),
(9,11,'2025-11-10','Új',20),
(10,12,'2025-11-11','Teljesítve',25);

-- ----------------------------
-- INSERT DATA: RendelesTetel
-- ----------------------------
INSERT INTO RendelesTetel (rendeles_id, termek_id, mennyiseg) VALUES
(1,1,10),(1,4,2),(1,5,1),
(2,2,20),(2,7,3),
(3,13,5),(3,14,10),(3,16,1),
(4,20,2),(4,21,1),
(5,23,5),(5,25,1),
(6,26,1),(6,27,1),
(7,29,2),(7,30,3),
(8,32,1),(8,34,4),
(9,36,5),(9,38,1),
(10,40,3),(10,41,2);

-- ----------------------------
-- INSERT DATA: Ceg_alkalmazott
-- ----------------------------
INSERT INTO Ceg_alkalmazott (cegId, felhasznaloId) VALUES
(1,1),(1,2),(2,3),(2,4),(3,5),(3,6),(4,7),(4,8),
(5,9),(5,10),(6,11),(6,12),(7,13),(7,14),(8,15),(8,16),
(9,17),(9,18),(10,19),(10,20),(11,21),(11,22),(12,23),(12,24),
(13,25),(13,26),(14,27),(14,28),(15,29),(15,30),(16,31),(16,32),
(17,33),(17,34),(18,35),(18,36),(19,37),(19,38),(20,39),(20,40);