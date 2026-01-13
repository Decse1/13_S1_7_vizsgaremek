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
      const termekek = await rak_kesz(p_ceg);
      if (termekek.length === 0){
        return res.status(200).json({ ok: false, uzenet: "Nincsenek termékek!" });
      }
      else{
        return res.status(200).json({ ok: true, uzenet: "", termekek });
      }
    } catch (err) {
      res.status(500).json({ error: "Adatbázis hiba!" });
      console.log(err);
    }
  });
};
