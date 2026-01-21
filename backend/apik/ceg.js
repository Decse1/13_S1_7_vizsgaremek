const db = require('../connect');

async function ceg_ad(ceg) {
  let fizet = 0; 
  if(ceg.elofiz){
    fizet = 1;
  }
  const [rows] = await db.query(`INSERT INTO Ceg (nev, adoszam, euAdoszam, cim, email, telefon, elofiz) VALUES ('${ceg.nev}', '${ceg.adoszam}', '${ceg.euAdoszam}', '${ceg.cim}', '${ceg.email}', '${ceg.telefon}', '${fizet}');`);
  return rows;
}

async function ceg_update(ceg) {
  const [rows] = await db.query(
    `UPDATE Ceg SET nev = ?, adoszam = ?, euAdoszam = ?, cim = ?, email = ?, telefon = ?, elofiz = ? WHERE id = ?`,
    [ceg.nev, ceg.adoszam, ceg.euAdoszam, ceg.cim, ceg.email, ceg.telefon, ceg.elofiz, ceg.id]
  );
  return rows;
}

async function ceg_all(){
  const [rows] = await db.query(`SELECT * FROM Ceg`);
  return rows;
}


module.exports = (app) => {
  app.get('/api/Ceg_osszes', async (req, res) => {
    try {
        const cegek = await ceg_all();
        return res.status(200).json({ ok: true, cegek});
    } catch (err) {
        res.status(500).json({ error: "Adatbázis hiba!" });
        console.log(err);
    }
  });

  app.post('/api/Ceg_ad', async (req, res) => {
    try {
      const ceg = req.body;

      // Kötelező mezők listája
      const requiredFields = ['adoszam', 'nev', 'cim'];

      // Ellenőrizzük a hiányzó mezőket
      for (const field of requiredFields) {
        if (!ceg[field] || ceg[field].toString().trim() === '') {
          return res.status(422).json({
            ok: false,
            uzenet: `Hiányzó mező: ${field}`
          });
        }
      }

      // Legalább egy elérhetőség ellenőrzése
      if (!ceg.email && !ceg.telefon) {
        return res.status(422).json({
          ok: false,
          uzenet: "Kérem adjon meg legalább egy elérhetőséget (email vagy telefon)!"
        });
      }

      // Ellenőrizzük, hogy az adószám már létezik-e
      const cegek = await ceg_all();
      const existing = cegek.find(c => c.adoszam === ceg.adoszam);

      if (existing) {
        return res.status(409).json({
          ok: false,
          uzenet: "Már létező adószám!",
          cegId: existing.id
        });
      }

      // Ha minden rendben van, hozzáadjuk a céget
      const tmp = await ceg_ad(ceg);

      return res.status(200).json({
        ok: true,
        uzenet: "Sikeres adatfelvétel!",
        cegId: `${tmp.insertId}`
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        uzenet: "Szerverhiba! Adatbázis hiba."
      });
    }
  });

  app.post('/api/Ceg_update', async (req, res) => {
    try {
      const ceg = req.body;

      // Kötelező mezők listája
      const requiredFields = ['nev', 'adoszam', 'cim', 'id'];

      // Ellenőrizzük a hiányzó mezőket
      for (const field of requiredFields) {
        if (!ceg[field] || ceg[field].toString().trim() === '') {
          return res.status(422).json({
            ok: false,
            uzenet: `Hiányzó mező: ${field}`
          });
        }
      }

      // Legalább egy elérhetőség ellenőrzése (email vagy telefon)
      if (!ceg.email && !ceg.telefon) {
        return res.status(422).json({
          ok: false,
          uzenet: "Kérem adjon meg legalább egy elérhetőséget (email vagy telefon)!"
        });
      }

      // Ha minden rendben van, frissítjük a céget
      await ceg_update(ceg);

      return res.status(200).json({
        ok: true,
        uzenet: "Sikeres módosítás!"
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({
        ok: false,
        uzenet: "Szerverhiba! Adatbázis hiba."
      });
    }
  });
};