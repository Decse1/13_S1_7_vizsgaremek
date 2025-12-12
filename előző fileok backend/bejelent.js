const express = require('express');
const cors = require('cors');
const db = require('../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));


const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "szupertitkoskulcs123"; // Élesben környezeti változó legyen

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

        // Felhasználó lekérdezése az adatbázisból
        const felhasznalok = await Felhasznalo(username);

        if (felhasznalok.length === 0) {
            return res.status(200).json({ ok: false, uzenet: "Hibás felhasználónév!" });
        }

        const felhasznalo = felhasznalok[0];

        // Jelszó ellenőrzése bcrypt-tel
        const validPassword = await bcrypt.compare(password, felhasznalo.jelszo); 
        if (!validPassword) {
            return res.status(200).json({ ok: false, uzenet: "Hibás jelszó!" });
        }

        // Cég adat lekérése
        const cegek = await Ceg_adat(felhasznalo.id);
        const ceg = cegek[0];

        // JWT generálás
        const token = jwt.sign(
            { id: felhasznalo.id, username: felhasznalo.username },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.json({
            ok: true,
            uzenet: "Sikeres bejelentkezés!",
            felhasznalo,
            ceg,
            token // visszaküldjük a JWT-t
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
