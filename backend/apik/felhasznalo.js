const express = require('express');
const cors = require('cors');
const db = require('../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

async function felhasznalo_ad(profil) {
  const [rows] = await db.query(`INSERT INTO Felhasznalo (nev, jelszo, kategoria, telephely_cim, telefon) VALUES ("${profil.nev}","${profil.jelszo}","${profil.kategoria}","${profil.telephely_cim}","${profil.telefon}");`);
  console.log(rows);
  return rows;
}
async function alkalmazott_ad(profil, tmp){
  await db.query(`INSERT INTO Ceg_alkalmazott (cegId, felhasznaloId) VALUES ("${profil.cegId}", "${tmp.insertId}")`)
}
module.exports = (app) => {
  app.post('/api/Felhasznalo_ad', async (req, res) => {
    try {
      const profil = req.body;
      let tmp;
      if(Object.keys(profil).length == 6){
        if (profil.nev != ""){
          if(profil.jelszo != ""){
            if(profil.kategoria != ""){
              if(profil.telephely_cim != ""){
                if(profil.telefon != ""){
                  if(profil.cegId != ""){
                    tmp = await felhasznalo_ad(profil);
                    console.log(tmp);
                    alkalmazott_ad(profil, tmp);
                    return res.status(200).json({ ok:true, uzenet:"Sikeres adatfelvétel!" });
                  }
                  else{
                    return res.status(200).json({ ok:false, uzenet:"Kérem adjon meg egy céget"});
                  }
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