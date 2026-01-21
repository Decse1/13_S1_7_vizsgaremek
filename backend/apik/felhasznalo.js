const db = require('../connect');
const bcrypt = require("bcrypt");

async function felhasznalo_all(){
  const [rows] = await db.query(
    `SELECT nev FROM felhasznalo`
  );
  return rows;
}

async function felhasznalo_ad(profil) {
  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(profil.jelszo, 10);
  
  const [rows] = await db.query(
    `INSERT INTO Felhasznalo (nev, jelszo, kategoria, telephely_cim, telefon) VALUES (?, ?, ?, ?, ?)`,
    [profil.nev, hashedPassword, profil.kategoria, profil.telephely_cim, profil.telefon]
  );
  //console.log(rows);
  return rows;
}

async function alkalmazott_ad(profil, tmp){
  await db.query(`INSERT INTO Ceg_alkalmazott (cegId, felhasznaloId) VALUES ("${profil.cegId}", "${tmp.insertId}")`)
}

async function felhasznalo_update(profil) {
  const [rows] = await db.query(`UPDATE Felhasznalo (nev = "${profil.nev}", jelszo = "${profil.jelszo}", kategoria = "${profil.kategoria}", telephely_cim = "${profil.telephely_cim}", telefon = "${profil.telefon}") WHERE id = "${profil.id}";`);
}

module.exports = (app) => {
  app.post('/api/Felhasznalo_ad', async (req, res) => {
    try {
      const profil = req.body;

      // Kötelező mezők listája
      const requiredFields = [
        'nev',
        'jelszo',
        'kategoria',
        'telephely_cim',
        'telefon',
        'cegId'
      ];

      // Ellenőrizzük a hiányzó vagy üres mezőket
      for (const field of requiredFields) {
        if (!profil[field] || profil[field].toString().trim() === '') {
          return res.status(422).json({
            ok: false,
            uzenet: `Hiányzó mező: ${field}`
          });
        }
      }

      // Ellenőrizzük, hogy a felhasználónév már létezik-e
      const felhasznaloAll = await felhasznalo_all(); // Feltételezve, hogy ez tömböt ad vissza
      const exists = felhasznaloAll.some(f => f.nev === profil.nev);

      if (exists) {
        return res.status(409).json({
          ok: false,
          uzenet: "A felhasználó név már létezik"
        });
      }

      // Ha minden rendben van, hozzáadjuk a felhasználót
      const tmp = await felhasznalo_ad(profil);
      await alkalmazott_ad(profil, tmp);

      return res.status(200).json({
        ok: true,
        uzenet: "Sikeres adatfelvétel!"
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        uzenet: "Szerverhiba! Adatbázis hiba."
      });
    }
  });


  app.post('/api/Felhasznalo_update', async (req, res) => {
    try {
      const profil = req.body;

      // Kötelező mezők listája
      const requiredFields = [
        'nev',
        'jelszo',
        'kategoria',
        'telephely_cim',
        'telefon',
        'cegId',
        'id'
      ];

      // Ellenőrizzük a hiányzó vagy üres mezőket
      for (const field of requiredFields) {
        if (!profil[field] || profil[field].toString().trim() === '') {
          return res.status(422).json({
            ok: false,
            uzenet: `Hiányzó mező: ${field}`
          });
        }
      }

      // Ha minden mező rendben van
      await felhasznalo_update(profil);

      return res.status(200).json({
        ok: true,
        uzenet: "Sikeres adatfelvétel!"
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        uzenet: "Szerverhiba! Adatbázis hiba."
      });
    }
  });

  app.post('/api/Felhasznalo_delete', async (req, res) => {
    try{
      const [row] = await db.query(`DELETE Felhasznalo WHERE id = "${req.body.id}"`)
      return res.status(200).json({ok:true, uzenet: "Sikeres törlés"});
    } catch (err) {
      res.status(500).json({ error: "Adatbázis hiba!" });
      console.log(err);
    }
  });
  
  app.post('/api/Alkalmazottak', async (req,res) => {
    try{
      const [row] = await db.query(`SELECT f.id, f.nev, f.kategoria, f.telephely_cim, f.telefon FROM Ceg_alkalmazott ca INNER JOIN Felhasznalo f ON f.id = ca.felhasznaloId INNER JOIN Ceg c ON c.id = ca.cegId WHERE c.id = "${req.body.id}";`)
      return res.status(200).json({ok:true, alkalmazottak:row})
    } catch (err){
      res.status(500).json({ error: "Adatbázis hiba!"})
    }
  });
};