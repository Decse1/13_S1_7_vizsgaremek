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
  const [rows] = await db.query("SELECT r.id AS szamla_id, r.datum AS szamla_datum, r.status AS szamla_status, elado.nev AS elado_ceg_nev, elado.cim AS elado_ceg_cim, elado.telefon AS elado_ceg_telefon, elado.email AS elado_ceg_email, vevo.nev AS vevo_ceg_nev, vevo.cim AS vevo_ceg_cim, vevo.telefon AS vevo_ceg_telefon, vevo.email AS vevo_ceg_email, f.nev AS szamlazo_felhasznalo, f.telephely_cim AS szamlazo_cim, f.telefon AS szamlazo_telefon, vevo.cim AS szallitas_cim, GROUP_CONCAT( CONCAT(t.nev, ' (', rt.mennyiseg, ' ', t.kiszereles, ') - ','Egységár nettó: ', t.ar, ' Ft, ','Nettó: ', t.ar*rt.mennyiseg, ' Ft, ','ÁFA: ', ROUND(t.ar*rt.mennyiseg*t.afa_kulcs/100,0), ' Ft, ','Bruttó: ', ROUND(t.ar*rt.mennyiseg*(1+t.afa_kulcs/100),0), ' Ft') SEPARATOR ' | ') AS termek_lista FROM Rendeles r INNER JOIN Partnerseg p ON r.partnerseg = p.id INNER JOIN Ceg elado ON p.elado = elado.id INNER JOIN Ceg vevo ON p.vevo = vevo.id INNER JOIN Felhasznalo f ON r.sz_cim = f.id INNER JOIN RendelesTetel rt ON r.id = rt.rendeles_id INNER JOIN Termek t ON rt.termek_id = t.id GROUP BY r.id ORDER BY r.id;");
  console.log(rows);
  return rows;
}

// API ENDPOINT
app.get('/api/Ceg', async (req, res) => {
  try {
    const users = await peldalekerd();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Adatbázis hiba!" });
    console.log(err);
  }
});

app.listen(3000, () =>
  console.log("Szerver fut: http://localhost:3000")
);