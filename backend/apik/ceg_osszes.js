const express = require('express');
const cors = require('cors');
const db = require('../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

module.exports = (app) => {
    app.get('/api/Ceg_osszes', async (req, res) => {
        try {
            const [rows] = await db.query(`SELECT id, nev FROM Ceg`);
            return res.status(200).json({ ok: true, cegek: rows });
        } catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });
}