const db = require('../connect');

let own = 1

async function rak_kesz(own) {
  const [rows] = await db.query(`SELECT * FROM Termek WHERE Termek.tulajdonos = ${own}`);
  //console.log(rows);
  return rows;
}
module.exports = (app) => {
  app.post('/api/Raktar', async (req, res) => {
    try {
      const p_ceg = req.body.id;

      // Ellenőrzés: id megadva?
      if (!p_ceg) {
        return res.status(422).json({
          ok: false,
          uzenet: "Hiányzó cég azonosító"
        });
      }

      const termekek = await rak_kesz(p_ceg);

      if (!termekek || termekek.length === 0) {
        return res.status(404).json({
          ok: false,
          uzenet: "Nincsenek termékek a raktárban"
        });
      }

      // Sikeres lekérés
      return res.status(200).json({
        ok: true,
        uzenet: "",
        termekek
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
