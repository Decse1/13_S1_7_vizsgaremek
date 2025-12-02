const express = require('express');
const cors = require('cors');
const db = require('../../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

//Lekérdezés változók
let own = 1
//Érkezetett adatok:
app.post('/api/Ceg_ad', (req, res) => {
  //console.log(req.body)
});
/*module.exports = (app) => {
  //Raktárkészlet
  async function rak_kesz(own) {
    const [rows] = await db.query(`SELECT * FROM Termek WHERE Termek.tulajdonos = ${own}`);
    //console.log(rows);
    return rows;
  }

  app.get('/api/Raktar', async (req, res) => {
    try {
      const users = await rak_kesz(own);
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Adatbázis hiba!" });
      console.log(err);
    }
  });
};*/