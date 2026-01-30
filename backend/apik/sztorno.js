const PDFDocument = require('pdfkit');
const db = require('../connect');
const path = require('path');
const fs = require('fs');

const formatMoney = (num) => {
    return Number(num).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Ft";
};

module.exports = (app) => {
    app.post('/api/Szamla_storno', async (req, res) => {
        try {
            const rendelesId = req.body.id;
            if (!rendelesId) return res.status(400).send('Hiba: Hiányzó ID');

            // --- 1. ADATBÁZIS LEKÉRDEZÉS ---
            // Fontos: lekérjük a 'storno' állapotot is
            const sql = `
                SELECT 
                    r.rendeles_szam, r.datum as rendeles_datum, 
                    r.szamla_kesz, r.szamla_kesz_datum, r.sztorno,
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
            
            let headerData = rows[0];

            // Sztornó csak akkor készíthető, ha már van eredeti számla
            if (!headerData.szamla_kesz) {
                return res.status(400).send('Hiba: Csak lezárt számla sztornózható.');
            }

            const kiallitasDatum = new Date();
            const kiallitasDateStr = kiallitasDatum.toISOString().split('T')[0];

            // --- 2. ADAT ELŐKÉSZÍTÉS (NEGATÍV ÉRTÉKEK) ---
            let vegosszegNetto = 0;
            let vegosszegAfa = 0;
            let vegosszegBrutto = 0;
            let afaBontas = {};

            const tetelek = rows.map(row => {
                // Sztornó esetén a mennyiség negatív
                const mennyiseg = row.mennyiseg * -1;
                const nettoErtek = row.egyseg_ar * mennyiseg;
                const afaErtek = Math.round(nettoErtek * (row.afa_kulcs / 100));
                const bruttoErtek = nettoErtek + afaErtek;
                
                vegosszegNetto += nettoErtek;
                vegosszegAfa += afaErtek;
                vegosszegBrutto += bruttoErtek;

                if (!afaBontas[row.afa_kulcs]) afaBontas[row.afa_kulcs] = 0;
                afaBontas[row.afa_kulcs] += afaErtek;

                return { ...row, mennyiseg, netto: nettoErtek, afa: afaErtek, brutto: bruttoErtek };
            });

            // --- 3. PDF GENERÁLÁS ---
            const doc = new PDFDocument({ 
                margin: { top: 280, bottom: 60, left: 40, right: 40 }, 
                size: 'A4',
                bufferPages: true 
            });
            
            const filename = `Sztorno_Szamla_${headerData.rendeles_szam}.pdf`;

            // Font regisztráció (az eredeti kódod alapján)
            const fontPathNormal = path.join(__dirname, '../fonts/centurygothic.ttf');
            const fontPathBold = path.join(__dirname, '../fonts/centurygothic_bold.ttf');
            if (fs.existsSync(fontPathNormal)) {
                doc.registerFont('CustomFont', fontPathNormal);
                doc.registerFont('CustomFontBold', fontPathBold);
            } else {
                doc.registerFont('CustomFont', 'Helvetica');
                doc.registerFont('CustomFontBold', 'Helvetica-Bold');
            }

            const drawHeader = () => {
                const startY = 30; 
                doc.fillColor('red').fontSize(24).font('CustomFontBold').text(`SZTORNÓ SZÁMLA`, 40, startY);
                doc.fillColor('black').fontSize(11).font('CustomFont').text(`Eredeti számla sorszáma: ${headerData.rendeles_szam}`);
                doc.text(`Sztornó bizonylat kelte: ${kiallitasDateStr}`);
                
                let currentY = startY + 55;
                doc.lineWidth(1).moveTo(40, currentY).lineTo(550, currentY).stroke();
                
                // Eladó / Vevő adatok (ugyanaz mint az eredeti)
                currentY += 15;
                doc.fontSize(10).font('CustomFontBold').text('ELADÓ:', 40, currentY);
                doc.font('CustomFont').text(headerData.elado_nev).text(headerData.elado_cim).text(`Adószám: ${headerData.elado_adoszam}`);

                doc.font('CustomFontBold').text('VEVŐ:', 300, currentY);
                doc.font('CustomFont').text(headerData.vevo_nev).text(headerData.vevo_cim).text(`Adószám: ${headerData.vevo_adoszam || '-'}`);

                // Táblázat fejléce
                const tableHeadY = 260;
                doc.fontSize(8).font('CustomFontBold');
                doc.text('Megnevezés', 40, tableHeadY);
                doc.text('Menny.', 200, tableHeadY);
                doc.text('Egységár', 240, tableHeadY, { align: 'right', width: 40 });
                doc.text('Nettó összesen', 450, tableHeadY, { align: 'right', width: 100 });
                doc.moveTo(40, tableHeadY + 12).lineTo(550, tableHeadY + 12).stroke();
            };

            const drawFooter = () => {
                const footerY = doc.page.height - 50;
                doc.fontSize(8).font('CustomFont').text("A sztornó számla az eredeti bizonylattal együtt érvényes.", 40, footerY, { align: 'center' });
            };

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            doc.pipe(res);

            // Tételek kirajzolása negatív előjellel
            tetelek.forEach(item => {
                const currentY = doc.y;
                doc.font('CustomFont').fontSize(9);
                doc.text(item.termek_nev, 40, currentY, { width: 150 });
                doc.text(item.mennyiseg, 200, currentY);
                doc.text(formatMoney(item.egyseg_ar), 240, currentY, { align: 'right', width: 40 });
                doc.font('CustomFontBold').text(formatMoney(item.netto), 450, currentY, { align: 'right', width: 100 });
                doc.moveDown();
            });

            // Összesítő
            doc.moveDown(2);
            doc.fontSize(14).font('CustomFontBold').fillColor('red');
            doc.text(`VÉGÖSSZEG: ${formatMoney(vegosszegBrutto)}`, { align: 'right' });

            // Oldalankénti fejléc/lábléc
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                drawHeader();
                drawFooter();
            }

            doc.end();

        } catch (error) {
            console.error("Sztornó hiba:", error);
            res.status(500).send('Hiba történt a sztornó PDF generálásakor.');
        }
    });
};