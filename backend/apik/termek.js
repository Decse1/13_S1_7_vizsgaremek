const db = require('../connect');

async function szuro_pCeg(pCeg) {
    const [rows] = await db.query(`SELECT termek_kategoria.id AS katId, termek_kategoria.nev AS katNev FROM Termek_kategoria INNER JOIN Termek ON Termek_kategoria.id = Termek.kategoria WHERE Termek.tulajdonos = "${pCeg}" GROUP BY termek_kategoria.id;`);
    return rows;
}
async function szurt_termek(szuro, pCeg){
    const [rows] = await db.query(`SELECT * FROM Termek WHERE kategoria = "${szuro}" AND tulajdonos = "${pCeg}";`);
}
async function osszes_termek(pCeg){
    const [rows] = await db.query(`SELECT * FROM Termek WHERE tulajdonos = "${pCeg}";`);
    return rows;
}
async function termek_ad(termek) {
    const [rows] = await db.query(`INSERT INTO Termek (tulajdonos, nev, cikkszam, mennyiseg, kiszereles, min_vas_menny, leiras, ar, kategoria, afa_kulcs) VALUES ( ${termek.tulajdonos}, '${termek.nev}', '${termek.cikkszam}', ${termek.mennyiseg}, '${termek.kiszereles}', ${termek.min_vas_menny}, '${termek.leiras}', ${termek.ar}, ${termek.kategoria}, ${termek.afa_kulcs})`);
}
async function termek_update(termek) {
    const [rows] = await db.query(`UPDATE Termek SET tulajdonos = ${termek.tulajdonos}, nev = '${termek.nev}', cikkszam = '${termek.cikkszam}', mennyiseg = ${termek.mennyiseg}, kiszereles = '${termek.kiszereles}', min_vas_menny = ${termek.min_vas_menny}, leiras = '${termek.leiras}', ar = ${termek.ar}, kategoria = ${termek.kategoria}, afa_kulcs = ${termek.afa_kulcs} WHERE id = ${termek.id};`)
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
    app.post('/api/Szurt_termek', async (req, res) => {
        try {
            const szuro = req.body.szuro;
            const termekek = await szurt_termek(szuro, pCeg);
            return res.status(200).json({ ok: true, uzenet: "", termekek });
        }
        catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });
    app.post('/api/Osszes_termek', async (req, res) => {
        try {
            const pCeg = req.body.id;
            const [termekek] = osszes_termek(pCeg);
            return res.status(200).json({ ok: true, uzenet: "", termekek });
        }
        catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });
    app.post('/api/Termek_ad', async (req, res) => {
        try {
            const termek = req.body;
            if(Object.keys(termek).length == 10){
                if(termek.mennyiseg != ""){
                    if(termek.kiszereles != ""){
                        if(termek.min_vas_menny != ""){
                            if(termek.ar != ""){
                                if(termek.kategoria != ""){
                                    if(termek.afa_kulcs != ""){
                                        if(termek.tulajdonos != ""){
                                            if(termek.nev != ""){
                                                termek_ad(termek)
                                                res.status(200).json({ok:true, uzenet:"Sikeres termék hozzáadás"})
                                            }
                                            else{
                                                res.status(200).json({ok:false, uzenet:"Nincs megadva a termék neve"})
                                            }
                                        }
                                        else{
                                            res.status(200).json({ok:false, uzenet:"Nincs megadva a tulajdonos"})
                                        }
                                    }
                                    else{
                                        res.status(200).json({ok:false, uzenet:"Nincs megadva az ÁFA kulcs"})
                                    }
                                }
                                else{
                                    res.status(200).json({ok:false, uzenet:"Nincs megadva a termék kategoriája"})
                                }
                            }
                            else{
                                res.status(200).json({ok:false, uzenet:"Nincs megadva a termék ára!"})
                            }
                        }
                        else{
                            res.status(200).json({ok:false, uzenet:"Nincs megadva minimum vásárlási mennyiség!"})
                        }
                    }
                    else{
                        res.status(200).json({ok:false, uzenet:"Nincs megadva kiszerelés!"})
                    }
                }
                else{
                    res.status(200).json({ok:false, uzenet:"Nincs megadva mennyiség!"})
                }
            }
            else{
                res.status(200).json({ok:false, uzenet:"Hiányzó adat"})
            }

        }
        catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });
    app.post('/api/Termek_update', async (req, res) => {
        try {
            const termek = req.body;
            if(Object.keys(termek).length == 11){
                if(termek.mennyiseg != ""){
                    if(termek.kiszereles != ""){
                        if(termek.min_vas_menny != ""){
                            if(termek.ar != ""){
                                if(termek.kategoria != ""){
                                    if(termek.afa_kulcs != ""){
                                        if(termek.tulajdonos != ""){
                                            if(termek.nev != ""){
                                                termek_update(termek)
                                                res.status(200).json({ok:true, uzenet:"Sikeres termék hozzáadás"})
                                            }
                                            else{
                                                res.status(200).json({ok:false, uzenet:"Nincs megadva a termék neve"})
                                            }
                                        }
                                        else{
                                            res.status(200).json({ok:false, uzenet:"Nincs megadva a tulajdonos"})
                                        }
                                    }
                                    else{
                                        res.status(200).json({ok:false, uzenet:"Nincs megadva az ÁFA kulcs"})
                                    }
                                }
                                else{
                                    res.status(200).json({ok:false, uzenet:"Nincs megadva a termék kategoriája"})
                                }
                            }
                            else{
                                res.status(200).json({ok:false, uzenet:"Nincs megadva a termék ára!"})
                            }
                        }
                        else{
                            res.status(200).json({ok:false, uzenet:"Nincs megadva minimum vásárlási mennyiség!"})
                        }
                    }
                    else{
                        res.status(200).json({ok:false, uzenet:"Nincs megadva kiszerelés!"})
                    }
                }
                else{
                    res.status(200).json({ok:false, uzenet:"Nincs megadva mennyiség!"})
                }
            }
            else{
                res.status(200).json({ok:false, uzenet:"Hiányzó adat"})
            }

        }
        catch (err) {
            res.status(500).json({ error: "Adatbázis hiba!" });
            console.log(err);
        }
    });
}