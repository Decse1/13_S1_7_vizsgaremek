const express = require('express');
const cors = require('cors');
const db = require('../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

module.exports = (app) => {
    app.post('/api/Rendeles_ad', async (req, res) => {
        try {
            const partnerseg = req.body.partnerseg;
            const datum = new Date().toISOString().split('T')[0];
            const statusz = "Új";
            const sz_cim = req.body.sz_cim;
            const rendelesId = await db.query(`INSERT INTO Rendeles (partnerseg, datum, statusz, szamlazasi_cim) VALUES ("${partnerseg}", "${datum}", "${statusz}", "${sz_cim}");`);
            const [termekek] = req.body.termekek;
            for (let i = 0; i < termekek.length; i++) {
                await db.query(`INSERT INTO Rendeles_termek (rendeles_id, termek_id, mennyiseg) VALUES ("${rendelesId.insertId}", "${termekek[i].termekId}", "${termekek[i].mennyiseg}");`);
            }
            return res.status(200).json({ ok:true, uzenet:"Rendelés sikeresen feldolgozva!" });
        } catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });
    app.post('/api/Beerkezett_rendeles', async (req, res) => {
        try {
            const cegId = req.body.cegId;
            const [rendelok] = await db.query(`SELECT C.id AS vevo_id, C.nev AS vevo_neve FROM Rendeles R JOIN Partnerseg P ON R.partnerseg = P.id JOIN Ceg C ON P.vevo = C.id JOIN RendelesTetel RT ON R.id = RT.rendeles_id JOIN Termek T ON RT.termek_id = T.id WHERE R.status = 'Új' AND P.elado = ${cegId} GROUP BY P.vevo;`);
            const rendelesek = [];
            for (let i = 0; i < rendelok.length; i++) {
                const vevoId = rendelok[i].vevo_id;
                const [rendeletTermek] = await db.query(`SELECT T.nev AS termek_neve, RT.mennyiseg AS rendelt_mennyiseg FROM Rendeles R JOIN Partnerseg P ON R.partnerseg = P.id JOIN Ceg C ON P.vevo = C.id JOIN RendelesTetel RT ON R.id = RT.rendeles_id JOIN Termek T ON RT.termek_id = T.id WHERE R.status = 'Új' AND P.elado = ${cegId} AND P.vevo = ${vevoId};`);
                rendelesek.push({
                    vevo: rendelok[i],
                    termekek: rendeletTermek,
                });
            }
            return res.status(200).json({ ok:true, rendelesek });
        } catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });    
}