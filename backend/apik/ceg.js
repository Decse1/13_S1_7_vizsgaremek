const express = require('express');
const cors = require('cors');
const db = require('../connect');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

async function ceg_ad(ceg) {
  let fizet = 0; 
  if(ceg.elofiz){
    fizet = 1;
  }
  const [rows] = await db.query(`INSERT INTO Ceg (nev, adoszam, euAdoszam, cim, email, telefon, elofiz) VALUES ('${ceg.nev}', '${ceg.adoszam}', '${ceg.euAdoszam}', '${ceg.cim}', '${ceg.email}', '${ceg.telefon}', '${fizet}');`);
  return rows;
}

async function ceg_update(ceg) {
  const [rows] = await db.query(`UPDATE Ceg nev = "${ceg.nev}", adoszam = "${ceg.adoszam}", euAdoszam = "${ceg.euAdoszam}", cim = "${ceg.cim}", email = "${ceg.email}", telefon = "${ceg.telefon}", elofiz = "${ceg.elofiz}") WHERE id = "${ceg.id}",;`);
}



module.exports = (app) => {
  app.post('/api/Ceg_ad', async (req, res) => {
    try {
      const ceg = req.body;
      let tmp;
      if(Object.keys(ceg).length == 7){
        if (ceg.nev != ""){
          if(ceg.adoszam != ""){
            if(ceg.cim != ""){
              if(ceg.email != "" || ceg.telefon != ""){
                tmp = await ceg_ad(ceg);
                return res.status(200).json({ ok:true, uzenet:"Sikeres adatfelvétel!", cegId: `${tmp.inserId}`});
              }
              else{
                return res.status(200).json({ ok:false, uzenet: "Kérem adjon meg legalább egy elérhetőséget (email vagy telefon)!" });
              }
            }
            else{
              return res.status(200).json({ ok:false, uzenet: "Kérem adja meg a cég címét!" });
            }
          }
          else{
            return res.status(200).json({ ok:false, uzenet: "Kérem adja meg a cég adószámát!" });
          }
        }
        else{
          return res.status(200).json({ ok:false, uzenet: "Kérem adja meg a cég nevét!" });
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
  app.post('/api/Ceg_update', async (req, res) =>{
    try {
      const ceg = req.body;
      let tmp;
      if(Object.keys(ceg).length == 7){
        if (ceg.nev != ""){
          if(ceg.adoszam != ""){
            if(ceg.cim != ""){
              if(ceg.email != "" || ceg.telefon != ""){
                if(ceg.id != ""){
                  ceg_update(ceg);
                  return res.status(200).json({ ok:true, uzenet:"Sikeres adatfelvétel!", cegId: `${tmp.inserId}`});
                }
                else{
                  return res.status(200).json({ ok:false, uzenet:"Hiányzó cég azonosító"});
                }
               }
              else{
                return res.status(200).json({ ok:false, uzenet: "Kérem adjon meg legalább egy elérhetőséget (email vagy telefon)!" });
              }
            }
            else{
              return res.status(200).json({ ok:false, uzenet: "Kérem adja meg a cég címét!" });
            }
          }
          else{
            return res.status(200).json({ ok:false, uzenet: "Kérem adja meg a cég adószámát!" });
          }
        }
        else{
          return res.status(200).json({ ok:false, uzenet: "Kérem adja meg a cég nevét!" });
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