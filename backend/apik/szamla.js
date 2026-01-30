const PDFDocument = require('pdfkit');
const db = require('../connect');
const path = require('path');
const fs = require('fs');
const formatMoney = (num) => {
    return Number(num).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Ft";
};

module.exports = (app) => {
    app.post('/api/Szamla_create', async (req, res) => {
        try {
            const rendelesId = req.body.id;
            if (!rendelesId) return res.status(400).send('Hiba: Hiányzó ID');

            // --- 1. ADATBÁZIS LEKÉRDEZÉS ---
            const sql = `
                SELECT 
                    r.rendeles_szam, r.datum as kiallitas_datum, 
                    p.fizetesi_forma, p.fizetesi_ido,
                    elado.nev as elado_nev, elado.adoszam as elado_adoszam, 
                    elado.cim as elado_cim, elado.szamlaszam as elado_bankszamla,
                    vevo.nev as vevo_nev, vevo.adoszam as vevo_adoszam, 
                    vevo.cim as vevo_cim, vevo.szamlaszam as vevo_bankszamla,
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

            const headerData = rows[0];
            const kiallitasDate = new Date(headerData.kiallitas_datum);
            const fizHatDate = new Date(kiallitasDate);
            fizHatDate.setDate(fizHatDate.getDate() + headerData.fizetesi_ido);

            // --- 2. ADAT ELŐKÉSZÍTÉS ---
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

                return { ...row, netto: nettoErtek, afa: afaErtek, brutto: bruttoErtek };
            });

            // --- 3. PDF CONFIG ---
            const doc = new PDFDocument({ 
                margin: { top: 280, bottom: 60, left: 40, right: 40 }, 
                size: 'A4',
                bufferPages: true // FONTOS: Ez kell a stabil működéshez
            });
            
            const filename = `Szamla_${headerData.rendeles_szam}.pdf`;

            // Fontok
            const fontPathNormal = path.join(__dirname, '../fonts/centurygothic.ttf');
            const fontPathBold = path.join(__dirname, '../fonts/centurygothic_bold.ttf');

            try {
                if (fs.existsSync(fontPathNormal) && fs.existsSync(fontPathBold)) {
                    doc.registerFont('CustomFont', fontPathNormal);
                    doc.registerFont('CustomFontBold', fontPathBold);
                } else {
                    doc.registerFont('CustomFont', 'Helvetica');
                    doc.registerFont('CustomFontBold', 'Helvetica-Bold');
                }
            } catch (e) {
                doc.registerFont('CustomFont', 'Helvetica');
                doc.registerFont('CustomFontBold', 'Helvetica-Bold');
            }

            const logoPath = path.join(__dirname, '../images/reka_logo_new.png');
            const hasLogo = fs.existsSync(logoPath);

            // --- RAJZOLÓ FÜGGVÉNYEK ---

            const drawHeader = () => {
                const startY = 30; 
                doc.fontSize(24).font('CustomFontBold').text(`SZÁMLA`, 40, startY, { align: 'left' });
                doc.fontSize(12).font('CustomFont').text(`Sorszám: ${headerData.rendeles_szam}`, { align: 'left' });
                
                let currentY = startY + 45;
                doc.lineWidth(1).moveTo(40, currentY).lineTo(550, currentY).stroke();
                currentY += 10;

                doc.fontSize(10).font('CustomFontBold').text('ELADÓ ADATAI:', 40, currentY);
                doc.font('CustomFont').text(headerData.elado_nev);
                doc.text(headerData.elado_cim);
                doc.text(`Adószám: ${headerData.elado_adoszam}`);
                doc.text(`Bank: ${headerData.elado_bankszamla}`);

                doc.font('CustomFontBold').text('VEVŐ ADATAI:', 300, currentY);
                doc.font('CustomFont').text(headerData.vevo_nev);
                doc.text(headerData.vevo_cim);
                doc.text(`Adószám: ${headerData.vevo_adoszam || '-'}`);
                doc.text(`Bank: ${headerData.vevo_bankszamla || '-'}`);

                currentY += 70;
                doc.rect(40, currentY, 510, 35).stroke();
                const lY = currentY + 5;
                const vY = currentY + 20;

                doc.fontSize(9).font('CustomFontBold');
                doc.text('Kiállítás', 50, lY);
                doc.text('Teljesítés', 160, lY);
                doc.text('Fiz. hat.', 270, lY);
                doc.text('Fiz. mód', 400, lY);

                doc.font('CustomFont');
                doc.text(kiallitasDate.toISOString().split('T')[0], 50, vY);
                doc.text(kiallitasDate.toISOString().split('T')[0], 160, vY);
                doc.text(fizHatDate.toISOString().split('T')[0], 270, vY);
                doc.text(headerData.fizetesi_forma, 400, vY);

                const tableHeadY = 260; 
                const xPoz = { nev: 40, kisz: 160, menny: 200, egyseg: 240, netto: 290, afak: 350, afae: 390, brutto: 480 };

                doc.fontSize(8).font('CustomFontBold');
                doc.text('Megnevezés', xPoz.nev, tableHeadY);
                doc.text('Kisz.', xPoz.kisz, tableHeadY);
                doc.text('Menny.', xPoz.menny, tableHeadY);
                doc.text('Egységár', xPoz.egyseg, tableHeadY, { width: 40, align: 'right' });
                doc.text('Nettó', xPoz.netto, tableHeadY, { width: 50, align: 'right' });
                doc.text('Áfa%', xPoz.afak, tableHeadY, { width: 30, align: 'right' });
                doc.text('Áfa', xPoz.afae, tableHeadY, { width: 50, align: 'right' });
                doc.text('Bruttó', xPoz.brutto, tableHeadY, { width: 70, align: 'right' });

                doc.moveTo(40, tableHeadY + 12).lineTo(550, tableHeadY + 12).stroke();
            };

            // --- LÁBLÉC JAVÍTVA ---
            const drawFooter = () => {
                // JAVÍTÁS 1: Elmentjük az eredeti margót, és lenullázzuk az alját
                // Így engedi a rendszer, hogy a lap aljára írjunk anélkül, hogy új oldalt nyitna.
                const oldBottomMargin = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;

                const footerHeight = 40; // Mennyivel az aljától kezdődjön
                const footerY = doc.page.height - footerHeight; 
                
                const textPart1 = "A számla a ";
                const textPart2 = " rendszerrel lett kiállítva";
                
                doc.fontSize(10).font('CustomFont');
                
                const w1 = doc.widthOfString(textPart1);
                const w2 = doc.widthOfString(textPart2);
                const imgW = 96; // ~3,4 cm
                const imgH = 28; // ~1 cm
                const totalW = w1 + imgW + w2;
                
                const startX = doc.page.width - 40 - totalW; // Jobbra igazítás (40 a jobb margó)

                // JAVÍTÁS 2: Függőleges igazítás (Vertical Alignment)
                // A szöveget kicsit lejjebb toljuk (imgH - fontSize)/2 + korrekció, hogy a kép közepénél legyen
                const textYOffset = (imgH - 10) / 2 + 2; 

                // Kirajzolás
                // lineBreak: false -> meggátolja a sortörést/széttöredezést
                doc.text(textPart1, startX, footerY + textYOffset, { lineBreak: false });
                
                if (hasLogo) {
                    // A képet a footerY-ra rajzoljuk (ez a legfelső pontja a sornak)
                    doc.image(logoPath, startX + w1, footerY, { width: imgW, height: imgH });
                }
                
                doc.text(textPart2, startX + w1 + imgW, footerY + textYOffset, { lineBreak: false });

                // Margó visszaállítása (biztonság kedvéért)
                doc.page.margins.bottom = oldBottomMargin;
            };

            // --- PDF GENERÁLÁS ---

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            doc.pipe(res);

            // 1. TARTALOM (Tételek)
            doc.font('CustomFont').fontSize(8);
            const xPoz = { nev: 40, kisz: 160, menny: 200, egyseg: 240, netto: 290, afak: 350, afae: 390, brutto: 480 };

            tetelek.forEach(item => {
                const currentY = doc.y;
                doc.text(item.termek_nev, xPoz.nev, currentY, { width: 110 });
                doc.text(item.kiszereles, xPoz.kisz, currentY);
                doc.text(item.mennyiseg, xPoz.menny, currentY);
                doc.text(formatMoney(item.egyseg_ar), xPoz.egyseg, currentY, { width: 40, align: 'right' });
                doc.text(formatMoney(item.netto), xPoz.netto, currentY, { width: 50, align: 'right' });
                doc.text(item.afa_kulcs + '%', xPoz.afak, currentY, { width: 30, align: 'right' });
                doc.text(formatMoney(item.afa), xPoz.afae, currentY, { width: 50, align: 'right' });
                doc.text(formatMoney(item.brutto), xPoz.brutto, currentY, { width: 70, align: 'right' });
                
                doc.moveDown();
                doc.save().strokeColor('#cccccc').lineWidth(0.5)
                .moveTo(40, doc.y).lineTo(550, doc.y).stroke().restore();
                doc.moveDown(0.5);
            });

            // Összesítő
            if (doc.y > 650) {
                doc.addPage();
            } else {
                doc.moveDown(2);
            }

            const summaryLabelX = 300;
            const summaryValueX = 450;

            doc.lineWidth(2).moveTo(summaryLabelX, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            doc.fontSize(10).font('CustomFontBold').text('Összesen Nettó:', summaryLabelX, doc.y, { align: 'right', width: 140 });
            doc.font('CustomFont').text(formatMoney(vegosszegNetto), summaryValueX, doc.y - doc.currentLineHeight(), { align: 'right', width: 100 });
            doc.moveDown();

            for (const [kulcs, ertek] of Object.entries(afaBontas)) {
                doc.font('CustomFontBold').text(`Áfa összeg (${kulcs}%):`, summaryLabelX, doc.y, { align: 'right', width: 140 });
                doc.font('CustomFont').text(formatMoney(ertek), summaryValueX, doc.y - doc.currentLineHeight(), { align: 'right', width: 100 });
                doc.moveDown();
            }

            doc.lineWidth(2).moveTo(summaryLabelX, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.5);

            doc.fontSize(12).font('CustomFontBold');
            doc.text('Fizetendő Bruttó:', summaryLabelX, doc.y, { align: 'right', width: 140 });
            doc.text(formatMoney(vegosszegBrutto), summaryValueX, doc.y - doc.currentLineHeight(), { align: 'right', width: 100 });

            // --- 2. FEJLÉC ÉS LÁBLÉC RÁHÚZÁS ---
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                drawHeader();
                drawFooter(); // Most már nem fog új oldalt nyitni
            }

            doc.end();

        } catch (error) {
            console.error("Szerver hiba:", error);
            if (!res.headersSent) {
                res.status(500).send('Hiba történt a PDF generálásakor.');
            }
        }
    });
};