const express = require('express');
const cors = require('cors');
const db = require('../connect');
const bcrypt = require('bcrypt'); // 1. Importálás

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Segédfüggvények
async function Felhasznalo(username) {
    const [rows] = await db.query(`SELECT * FROM Felhasznalo WHERE nev = ?`, [username]); // Használjunk lekérdezési paramétereket SQL injection ellen!
    return rows;
}

async function Ceg_adat(f_id) {
    const [rows] = await db.query(
        `SELECT * FROM Ceg WHERE Ceg.id = (SELECT cegId FROM Ceg_alkalmazott WHERE felhasznaloId = ?)`, 
        [f_id]
    );
    return rows;
}

module.exports = (app) => {
    app.post('/api/Bejelent', async (req, res) => {
        try {
            const { username, password } = req.body;

            const felhasznalok = await Felhasznalo(username);

            if (felhasznalok.length === 0) {
                return res.status(200).json({ ok: false, uzenet: "Hibás felhasználónév vagy jelszó!" });
            }

            const felhasznalo = felhasznalok[0];

            if (!await bcrypt.compare(password, felhasznalo.jelszo)) {
                return res.status(200).json({ ok: false, uzenet: "Hibás felhasználónév vagy jelszó!" });
            }

            const cegek = await Ceg_adat(felhasznalo.id);
            const ceg = cegek[0];

            return res.json({
                ok: true,
                uzenet: "Sikeres bejelentkezés!",
                felhasznalo: 
                { 
                    id: felhasznalo.id,
                    nev: felhasznalo.nev,
                    kategoria: felhasznalo.kategoria,
                    telephely_cim: felhasznalo.telephely_cim,
                    telefon: felhasznalo.telefon
                },
                ceg
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Szerver hiba!" });
        }
    });
};
/*app.listen(3000, () =>
  console.log("Szerver fut: http://localhost:3000")
);*/




//const hashedPassword = await bcrypt.hash(password, 10); // A 10-es szám a "salt rounds"
// Ezt a hashedPassword-et mentsd el az adatbázis 'jelszo' mezőjébe.