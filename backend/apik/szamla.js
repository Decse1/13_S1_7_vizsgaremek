const PDFDocument = require('pdfkit');
const db = require('../connect');
const path = require('path');
const formatMoney = (num) => {
    return Number(num).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Ft";
};

module.exports = (app) => {
    app.post('/api/Szamla_create', async (req, res) => {
        try {
            const rendelesId = req.body.id;
            if (!rendelesId) return res.status(400).send('Hiba: Hiányzó ID');

            // --- 1. ADATBÁZIS LEKÉRDEZÉS ---
            // MÓDOSÍTÁS: Bekerült a 'vevo.szamlaszam as vevo_bankszamla'
            const sql = `
                SELECT 
                    r.rendeles_szam, r.datum as kiallitas_datum, 
                    p.fizetesi_forma, p.fizetesi_ido,
                    
                    elado.nev as elado_nev, 
                    elado.adoszam as elado_adoszam, 
                    elado.cim as elado_cim, 
                    elado.szamlaszam as elado_bankszamla,

                    vevo.nev as vevo_nev, 
                    vevo.adoszam as vevo_adoszam, 
                    vevo.cim as vevo_cim, 
                    vevo.szamlaszam as vevo_bankszamla,

                    t.nev as termek_nev, t.kiszereles, t.afa_kulcs,
                    rt.mennyiseg, t.ar as egyseg_ar
                FROM Rendeles r
                JOIN Partnerseg p ON r.partnerseg = p.id
                JOIN Ceg elado ON p.elado = elado.id
                JOIN Ceg vevo ON p.vevo = vevo.id
                JOIN RendelesTetel rt ON r.id = rt.rendeles_id
                JOIN Termek t ON rt.termek_id = t.id
                WHERE r.id = ?
            `;

            const [rows] = await db.query(sql, [rendelesId]);
            if (rows.length === 0) return res.status(404).send('Nincs ilyen rendelés.');

            const header = rows[0];
            const kiallitasDate = new Date(new Date().toLocaleDateString('hu-HU'));
            const teljesitesDate = new Date(header.kiallitas_datum);
            const fizHatDate = new Date(kiallitasDate);
            fizHatDate.setDate(fizHatDate.getDate() + header.fizetesi_ido);

            // --- 2. SZÁMÍTÁSOK ---
            let vegosszegNetto = 0;
            let vegosszegAfa = 0;
            let vegosszegBrutto = 0;
            let afaBontas = {};

            const tetelek = rows.map(row => {
                const nettoErtek = row.egyseg_ar * row.mennyiseg;
                const afaErtek = Math.round(nettoErtek * (row.afa_kulcs / 100));
                const bruttoErtek = nettoErtek + afaErtek;

                vegosszegNetto += nettoErtek;
                vegosszegAfa += afaErtek;
                vegosszegBrutto += bruttoErtek;

                if (!afaBontas[row.afa_kulcs]) afaBontas[row.afa_kulcs] = 0;
                afaBontas[row.afa_kulcs] += afaErtek;

                return {
                    nev: row.termek_nev, kiszereles: row.kiszereles, mennyiseg: row.mennyiseg,
                    egysegAr: row.egyseg_ar, netto: nettoErtek, afaKulcs: row.afa_kulcs,
                    afa: afaErtek, brutto: bruttoErtek
                };
            });

            // --- 3. PDF GENERÁLÁS ---
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const filename = `Szamla_${header.rendeles_szam}.pdf`;

            // Betűtípusok betöltése (fontos az útvonal ellenőrzése!)
            // Feltételezzük: backend/fonts/Roboto-Regular.ttf
            const fontNormalPath = path.join(__dirname, '../fonts/centurygothic.ttf');
            const fontBoldPath = path.join(__dirname, '../fonts/centurygothic_bold.ttf');

            try {
                // Regisztráljuk a fontokat 'MainFont' és 'MainFontBold' néven
                doc.registerFont('MainFont', fontNormalPath);
                doc.registerFont('MainFontBold', fontBoldPath);
            } catch (err) {
                console.warn("Hiba: Nem találhatók a betűtípus fájlok a 'fonts' mappában! Visszaállás Helvetica-ra (ékezet hiba lesz).");
                doc.registerFont('MainFont', 'Helvetica');
                doc.registerFont('MainFontBold', 'Helvetica-Bold');
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            doc.pipe(res);

            // -- FEJLÉC --
            // Mindenhol 'MainFont' vagy 'MainFontBold' használata 'Helvetica' helyett
            doc.fontSize(24).font('MainFontBold').text(`SZÁMLA`, { align: 'left' });
            doc.fontSize(12).font('MainFont').text(`Sorszám: ${header.rendeles_szam}`, { align: 'left' });
            doc.moveDown();
            
            const lineY = doc.y;
            doc.lineWidth(1).moveTo(40, lineY).lineTo(550, lineY).stroke();
            doc.moveDown();

            // -- ELADÓ és VEVŐ --
            const startY = doc.y;
            
            doc.fontSize(10).font('MainFontBold').text('ELADÓ ADATAI:', 40, startY);
            doc.font('MainFont').text(header.elado_nev);
            doc.text(header.elado_cim);
            doc.text(`Adószám: ${header.elado_adoszam}`);
            doc.text(`Bank: ${header.elado_bankszamla}`);

            doc.font('MainFontBold').text('VEVŐ ADATAI:', 300, startY);
            doc.font('MainFont').text(header.vevo_nev);
            doc.text(header.vevo_cim);
            doc.text(`Adószám: ${header.vevo_adoszam || '-'}`);
            doc.text(`Bank: ${header.vevo_bankszamla}`);

            doc.moveDown(3);

            // -- DÁTUMOK --
            const metaY = doc.y;
            doc.rect(40, metaY - 5, 510, 35).stroke();
            
            const labelsY = metaY;
            const valuesY = metaY + 15;

            doc.fontSize(9).font('MainFontBold');
            doc.text('Kiállítás dátuma', 50, labelsY);
            doc.text('Teljesítés dátuma', 160, labelsY);
            doc.text('Fizetési határidő', 270, labelsY);
            doc.text('Fizetési mód', 400, labelsY);

            doc.font('MainFont');
            doc.text(kiallitasDate.toISOString().split('T')[0], 50, valuesY);
            doc.text(teljesitesDate.toISOString().split('T')[0], 160, valuesY);
            doc.text(fizHatDate.toISOString().split('T')[0], 270, valuesY);
            doc.text(header.fizetesi_forma, 400, valuesY);

            doc.moveDown(4);

            // -- TÁBLÁZAT FEJLÉC --
            const tableTop = doc.y;
            const xNev = 40;
            const xKisz = 160;
            const xMenny = 200;
            const xEgyseg = 240;
            const xNetto = 290;
            const xAfaK = 350;
            const xAfaE = 390;
            const xBrutto = 480;

            doc.fontSize(8).font('MainFontBold');
            doc.text('Megnevezés', xNev, tableTop);
            doc.text('Kisz.', xKisz, tableTop);
            doc.text('Menny.', xMenny, tableTop);
            doc.text('Egységár', xEgyseg, tableTop, { width: 40, align: 'right' });
            doc.text('Nettó', xNetto, tableTop, { width: 50, align: 'right' });
            doc.text('Áfa%', xAfaK, tableTop, { width: 30, align: 'right' });
            doc.text('Áfa érték', xAfaE, tableTop, { width: 50, align: 'right' });
            doc.text('Bruttó', xBrutto, tableTop, { width: 70, align: 'right' });

            doc.moveTo(40, tableTop + 12).lineTo(550, tableTop + 12).stroke();

            // -- TÉTELEK --
            let itemY = tableTop + 20;
            doc.font('MainFont');

            tetelek.forEach(item => {
                doc.text(item.nev, xNev, itemY, { width: 110 });
                doc.text(item.kiszereles, xKisz, itemY);
                doc.text(item.mennyiseg, xMenny, itemY);
                doc.text(formatMoney(item.egysegAr), xEgyseg, itemY, { width: 40, align: 'right' });
                doc.text(formatMoney(item.netto), xNetto, itemY, { width: 50, align: 'right' });
                doc.text(item.afaKulcs + '%', xAfaK, itemY, { width: 30, align: 'right' });
                doc.text(formatMoney(item.afa), xAfaE, itemY, { width: 50, align: 'right' });
                doc.text(formatMoney(item.brutto), xBrutto, itemY, { width: 70, align: 'right' });

                itemY += 15;
                if (itemY > 750) {
                    doc.addPage();
                    itemY = 50;
                }
            });

            doc.moveTo(40, itemY).lineTo(550, itemY).stroke();
            
            // -- ÖSSZESÍTŐK --
            itemY += 20;
            const summaryXLabel = 300;
            const summaryXValue = 450;

            doc.fontSize(10);
            doc.font('MainFontBold').text('Összesen Nettó:', summaryXLabel, itemY, { align: 'right', width: 140 });
            doc.font('MainFont').text(formatMoney(vegosszegNetto), summaryXValue, itemY, { align: 'right', width: 100 });
            itemY += 15;

            for (const [kulcs, ertek] of Object.entries(afaBontas)) {
                doc.font('MainFontBold').text(`Áfa összeg (${kulcs}%):`, summaryXLabel, itemY, { align: 'right', width: 140 });
                doc.font('MainFont').text(formatMoney(ertek), summaryXValue, itemY, { align: 'right', width: 100 });
                itemY += 15;
            }

            doc.lineWidth(2).moveTo(summaryXLabel, itemY).lineTo(550, itemY).stroke();
            itemY += 5;

            doc.fontSize(12).font('MainFontBold');
            doc.text('Fizetendő Bruttó:', summaryXLabel, itemY, { align: 'right', width: 140 });
            doc.text(formatMoney(vegosszegBrutto), summaryXValue, itemY, { align: 'right', width: 100 });

            doc.end();

        } catch (error) {
            console.error("Hiba:", error);
            res.status(500).send('Szerver hiba történt a PDF generálásakor.');
        }
    });
};