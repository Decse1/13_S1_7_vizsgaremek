const express = require('express');
const cors = require('cors');
const db = require('../../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

async function felhasznalo_ad(profil) {
  const [rows] = await db.query(`INSERT INTO Felhasznalo (id, nev, jelszo, kategoria, telephely_cim, telefon)
VALUES (41, 'Teszt János', 'jelszo123', 2, '6500 Baja, Fő tér 12.', '+36701234567');`);
  //console.log(rows);
  return rows;
}
module.exports = (app) => {
  app.post('/api/Felhasznalo_ad', async (req, res) => {
    try {
      let profil = req.body;
      if(Object.keys(profil).length == 5){
        if (profil.nev != ""){
          if(profil.jelszo != ""){
            if(profil.kategoria != ""){
              if(profil.telephely_cim != ""){
                if(profil.telefon != ""){
                  felhasznalo_ad(profil);
                  return res.status(200).json({ ok:true, uzenet:"Sikeres adatfelvétel!" });
                }
                else{
                  return res.status(200).json({ ok:false, uzenet: "Kérem adjon meg egy telefonszámot!" });
                }
              }
              else{
                return res.status(200).json({ ok:false, uzenet: "Kérem adja meg a telephely címét!" });
              }
            }
            else{
              return res.status(200).json({ ok:false, uzenet: "Kérem adja meg a profil kategóriát!" });
            }
          }
          else{
            return res.status(200).json({ ok:false, uzenet: "Kérem adja meg a jelszót!" });
          }
        }
        else{
          return res.status(200).json({ ok:false, uzenet: "Kérem adja meg a nevet!" });
        }
      }
      else{
        return res.status(200).json({ ok:false, uzenet: "Hiányzó adatok!" });
      }
    } catch (err) {
      res.status(500).json({ error: "Adatbázis hiba!" });
      console.log(err);
    }
  });
};