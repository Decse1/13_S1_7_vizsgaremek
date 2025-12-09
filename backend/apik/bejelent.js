const express = require('express');
const cors = require('cors');
const db = require('../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

//Lekérdezés változók
let f_nev = ""
let jelszo = ""
let bejelentkezett = false


//Érkezetett adatok:


//Bejelentkezés
async function Felhasznalo(username) {
  const [rows] = await db.query(`SELECT * FROM Felhasznalo WHERE felhasznalo.nev = "${username}"`);
  //console.log(rows);
  return rows;
}
async function Ceg_adat(f_id) {
  const [rows] = await db.query(`SELECT * FROM Ceg WHERE Ceg.id = (SELECT cegId FROM Ceg_alkalmazott WHERE felhasznaloId = ${f_id})`);
  //console.log(rows);
  return rows;
}
module.exports = (app) => {
    app.post('/api/Bejelent', async (req, res) => {
        try {
            const { username, password } = req.body;

            const felhasznalok = await Felhasznalo(username);

            if (felhasznalok.length === 0) {
                return res.status(200).json({ ok: false, uzenet: "Hibás felhasználónév!" });
            }

            const felhasznalo = felhasznalok[0];

            if (felhasznalo.jelszo !== password) {
                return res.status(200).json({ ok: false, uzenet: "Hibás jelszó!" });
            }

            const cegek = await Ceg_adat(felhasznalo.id);
            const ceg = cegek[0];

            return res.json({
                ok: true,
                uzenet: "Sikeres bejelentkezés!",
                felhasznalo: {
                    id: felhasznalo.id,
                    nev: felhasznalo.nev,
                    email: felhasznalo.email,
                    telefon: felhasznalo.telefon,
                    telephely_cim: felhasznalo.telephely_cim
                },
                ceg
            });

        } catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });
};
/*app.listen(3000, () =>
  console.log("Szerver fut: http://localhost:3000")
);*/
