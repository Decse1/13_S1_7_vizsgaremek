const express = require('express');
const cors = require('cors');
const db = require('../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

//Lekérdezés változók
let f_nev = "Kovács Péter"
let jelszo = "pwd123"
let bejelentkezett = false


//Érkezetett adatok:
/*app.post('/api/Ceg_adat', (req, res) => {
    console.log(req.body)
});*/

//Bejelentkezés
async function Felhasznalo() {
  const [rows] = await db.query(`SELECT * FROM Felhasznalo WHERE felhasznalo.nev = "${f_nev}"`);
  //console.log(rows);
  return rows;
}
async function Ceg_adat(f_id) {
  const [rows] = await db.query(`SELECT * FROM Ceg WHERE Ceg.id = (SELECT cegId FROM Ceg_alkalmazott WHERE felhasznaloId = ${f_id})`);
  //console.log(rows);
  return rows;
}
module.exports = (app) => {
    app.get('/api/Bejelent', async (req, res) => {
        try {
            const felhasznalok = await Felhasznalo(f_nev);

            if (felhasznalok.length === 0) {
                return res.status(400).json({ ok: false, uzenet: "Hibás felhasználónév!" });
            }
            else{
                const felhasznalo = felhasznalok[0];
                if (felhasznalo.jelszo !== jelszo) {
                    return res.status(400).json({ ok: false, uzenet: "Hibás jelszó!" });
                }
                else{
                    const cegek = await Ceg_adat(felhasznalo.id);
                    const ceg = cegek[0];
                    return res.json({
                        ok: true,
                        uzenet: "Sikeres bejelentkezés!",
                        felhasznalo, 
                        ceg
                    });
                }
            }

        } catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });
};
/*app.listen(3000, () =>
  console.log("Szerver fut: http://localhost:3000")
);*/
