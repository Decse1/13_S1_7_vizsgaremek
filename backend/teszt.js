// server.js
const express = require('express');
const cors = require('cors');
const db = require('./connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// LEKÉRDEZÉS — már itt van, nem kell külön query.js
async function peldalekerd() {
  const [rows] = await db.query("SELECT * FROM Termek inner JOIN Ceg ON Termek.tulajdonos = Ceg.id GROUP BY Ceg.id");
  return rows;
}

// API ENDPOINT
app.get('/api/Ceg', async (req, res) => {
  try {
    const users = await peldalekerd();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Adatbázis hiba!" });
  }
});

app.listen(3000, () =>
  console.log("Szerver fut: http://localhost:3000")
);