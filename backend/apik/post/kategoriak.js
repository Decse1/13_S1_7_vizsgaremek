const express = require('express');
const cors = require('cors');
const db = require('../../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

async function szuro_pCeg(pCeg) {
    const [rows] = await db.query(`SELECT termek_kategoria.id AS katId, termek_kategoria.nev AS katNev FROM Termek_kategoria INNER JOIN Termek ON Termek_kategoria.id = Termek.kategoria WHERE Termek.tulajdonos = "${pCeg}" GROUP BY termek_kategoria.id;`);
    return rows;
}

module.exports = (app) => {
    app.post('/api/Kategoriak', async (req, res) => {
        try {
            const pCeg = req.body.id;
            const szurok = await szuro_pCeg(pCeg);
            if (szurok.length === 0) {
                return res.status(200).json({ ok: false, uzenet: "Nincsenek szűrők!" });
            }
            else{
                return res.status(200).json({ ok: true, uzenet: "", szurok });
            }
        }
        catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });
}