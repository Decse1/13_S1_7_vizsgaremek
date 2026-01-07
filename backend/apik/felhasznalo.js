const express = require('express');
const cors = require('cors');
const db = require('../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const bcrypt = require("bcrypt");

async function felhasznalo_all(){
  const [rows] = await db.query(
    `SELECT nev FROM felhasznalo`
  );
  return rows;
}

async function felhasznalo_ad(profil) {
  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(profil.jelszo, 10);
  
  const [rows] = await db.query(
    `INSERT INTO Felhasznalo (nev, jelszo, kategoria, telephely_cim, telefon) VALUES (?, ?, ?, ?, ?)`,
    [profil.nev, hashedPassword, profil.kategoria, profil.telephely_cim, profil.telefon]
  );
  //console.log(rows);
  return rows;
}

async function alkalmazott_ad(profil, tmp){
  await db.query(`INSERT INTO Ceg_alkalmazott (cegId, felhasznaloId) VALUES ("${profil.cegId}", "${tmp.insertId}")`)
}

async function felhasznalo_update(profil) {
  const [rows] = await db.query(`UPDATE Felhasznalo (nev = "${profil.nev}", jelszo = "${profil.jelszo}", kategoria = "${profil.kategoria}", telephely_cim = "${profil.telephely_cim}", telefon = "${profil.telefon}") WHERE id = "${profil.id}";`);
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
                    let felhasznaloAll  = [felhasznalo_all()]
                    let i = 0;
                    while (i < felhasznaloAll.length && profil.nev != felhasznaloAll[i]){
                      i++
                    }
                    if( i > felhasznaloAll.length){
                      tmp = await felhasznalo_ad(profil);
                      //onsole.log(tmp);
                      alkalmazott_ad(profil, tmp);
                      return res.status(200).json({ ok:true, uzenet:"Sikeres adatfelvétel!" });
                    }
                    else{
                      return res.status(200).json({ ok:false, uzenet:"A felhasználó név már létezik"})
                    }       
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


  app.post('/api/Felhasznalo_update', async (req, res) => {
    try {
      const profil = req.body;
      if(Object.keys(profil).length == 6){
        if (profil.nev != ""){
          if(profil.jelszo != ""){
            if(profil.kategoria != ""){
              if(profil.telephely_cim != ""){
                if(profil.telefon != ""){
                  if(profil.cegId != ""){
                    if(profil.id != ""){
                      felhasznalo_update(profil);
                      return res.status(200).json({ ok:true, uzenet:"Sikeres adatfelvétel!" });
                    }
                    else{
                      return res.status(200).json({ ok:false, uzenet:"Hiányzó azonosító"})
                    }
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

  app.post('/api/Felhasznalo_delete', async (req, res) => {
    try{
      const [row] = await db.query(`DELETE Felhasznalo WHERE id = "${req.body.id}"`)
      return res.status(200).json({ok:true, uzenet: "Sikeres törlés"});
    } catch (err) {
      res.status(500).json({ error: "Adatbázis hiba!" });
      console.log(err);
    }
  });
};