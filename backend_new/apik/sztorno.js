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
            // Dupla LEFT JOIN a Szamla táblára: egy az eredetinek, egy a sztornónak
            const sql = `
                SELECT 
                    r.id as rendeles_id, r.rendeles_szam, r.datum as rendeles_datum, 
                    r.szamla_kesz, r.sztorno,
                    p.fizetesi_forma, p.fizetesi_ido as fizetesi_napok,
                    elado.id as elado_id, elado.nev as elado_nev, elado.adoszam as elado_adoszam, 
                    elado.cim as elado_cim, elado.szamlaszam as elado_bankszamla, elado.szamla_minta,
                    vevo.nev as vevo_nev, vevo.adoszam as vevo_adoszam, 
                    vevo.cim as vevo_cim, vevo.szamlaszam as vevo_bankszamla,
                    t.nev as termek_nev, t.kiszereles, t.afa_kulcs,
                    rt.mennyiseg, t.ar as egyseg_ar,
                    sz_norm.szamla_sz as eredeti_szamlaszam,
                    sz_storno.szamla_sz as storno_szamlaszam,
                    sz_storno.kiallitas_datum as storno_kiallitas_datum
                FROM Rendeles r
                JOIN Partnerseg p ON r.partnerseg = p.id
                JOIN Ceg elado ON p.elado = elado.id
                JOIN Ceg vevo ON p.vevo = vevo.id
                JOIN RendelesTetel rt ON r.id = rt.rendeles_id
                JOIN Termek t ON rt.termek_id = t.id
                LEFT JOIN Szamla sz_norm ON r.id = sz_norm.rendeles_id AND sz_norm.szamla_tipus = 'NORMAL'
                LEFT JOIN Szamla sz_storno ON r.id = sz_storno.rendeles_id AND sz_storno.szamla_tipus = 'STORNO'
                WHERE r.id = ?
            `;

            const [rows] = await db.query(sql, [rendelesId]);
            if (rows.length === 0) return res.status(404).send('Nincs ilyen rendelés.');
            
            let headerData = rows[0];

            // Sztornó csak akkor készíthető, ha már van eredeti számla
            if (!headerData.szamla_kesz || !headerData.eredeti_szamlaszam) {
                return res.status(400).send('Hiba: Csak lezárt, kiállított számla sztornózható.');
            }

            let szamlaSorszam;
            let kiallitasDatum;

            // --- SZTORNÓ SZÁMLA ÁLLAPOT ELLENŐRZÉSE ÉS GENERÁLÁSA ---
            if (headerData.storno_szamlaszam) {
                // Ha már sztornózták korábban, letöltjük a meglévőt
                szamlaSorszam = headerData.storno_szamlaszam;
                kiallitasDatum = new Date(headerData.storno_kiallitas_datum);
            } else {
                // Ha még nincs, kiállítjuk az új sztornó számlát
                kiallitasDatum = new Date();
                const szamlaMinta = headerData.szamla_minta || 'SZ-0000';
                
                const mintaMatch = szamlaMinta.match(/^(.*?)(\d+)$/);
                let prefix = 'SZ-';
                let numLength = 4;
                let nextNum = 1;

                if (mintaMatch) {
                    prefix = mintaMatch[1]; 
                    numLength = mintaMatch[2].length; 
                }

                // Utolsó kiadott számlaszám keresése (kiallito alapján)
                const [lastSzamlaRows] = await db.query(`
                    SELECT szamla_sz 
                    FROM Szamla 
                    WHERE kiallito = ? AND szamla_sz LIKE ?
                    ORDER BY szamla_sz DESC 
                    LIMIT 1
                `, [headerData.elado_id, `${prefix}%`]);

                if (lastSzamlaRows.length > 0) {
                    const utolsoSzamla = lastSzamlaRows[0].szamla_sz;
                    const utolsoSzamString = utolsoSzamla.substring(prefix.length);
                    const utolsoSzamInt = parseInt(utolsoSzamString, 10);
                    
                    if (!isNaN(utolsoSzamInt)) {
                        nextNum = utolsoSzamInt + 1;
                    }
                }

                szamlaSorszam = prefix + String(nextNum).padStart(numLength, '0');
                
                const formattedKiallitas = kiallitasDatum.toISOString().split('T')[0];
                const szamlaTipus = 'STORNO'; 

                // Sztornó számla mentése
                await db.query(
                    'INSERT INTO Szamla (szamla_sz, rendeles_id, szamla_tipus, kiallitas_datum, fizetesi_ido, kiallito) VALUES (?, ?, ?, ?, ?, ?)',
                    [szamlaSorszam, rendelesId, szamlaTipus, formattedKiallitas, formattedKiallitas, headerData.elado_id] // Fizetési idő = Kiállítás ideje sztornó esetén
                );

                // Rendelés állapot frissítése
                await db.query(
                    'UPDATE Rendeles SET sztorno = true WHERE id = ?',
                    [rendelesId]
                );
            }

            const kiallitasDateStr = kiallitasDatum.toISOString().split('T')[0];

            // --- 2. ADAT ELŐKÉSZÍTÉS (NEGATÍV ÉRTÉKEK) ---
            let vegosszegNetto = 0;
            let vegosszegAfa = 0;
            let vegosszegBrutto = 0;
            let afaBontas = {};

            const tetelek = rows.map(row => {
                const mennyiseg = row.mennyiseg * -1; // Negatív mennyiség
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
            
            // A fájlnév a sztornó számla új sorszáma alapján készül
            const filename = `Sztorno_Szamla_${szamlaSorszam}.pdf`;

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
                // Fontos: Az új sztornó sorszám és a hivatkozott eredeti sorszám feltüntetése
                doc.fillColor('black').fontSize(11).font('CustomFont').text(`Sorszám: ${szamlaSorszam}`);
                doc.text(`Eredeti számla sorszáma: ${headerData.eredeti_szamlaszam}`);
                doc.text(`Sztornó bizonylat kelte: ${kiallitasDateStr}`);
                
                let currentY = startY + 70;
                doc.lineWidth(1).moveTo(40, currentY).lineTo(550, currentY).stroke();
                
                currentY += 15;
                doc.fontSize(10).font('CustomFontBold').text('ELADÓ:', 40, currentY);
                doc.font('CustomFont').text(headerData.elado_nev).text(headerData.elado_cim).text(`Adószám: ${headerData.elado_adoszam}`);

                doc.font('CustomFontBold').text('VEVŐ:', 300, currentY);
                doc.font('CustomFont').text(headerData.vevo_nev).text(headerData.vevo_cim).text(`Adószám: ${headerData.vevo_adoszam || '-'}`);

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

            tetelek.forEach(item => {
                const currentY = doc.y;
                doc.font('CustomFont').fontSize(9);
                doc.text(item.termek_nev, 40, currentY, { width: 150 });
                doc.text(item.mennyiseg, 200, currentY);
                doc.text(formatMoney(item.egyseg_ar), 240, currentY, { align: 'right', width: 40 });
                doc.font('CustomFontBold').text(formatMoney(item.netto), 450, currentY, { align: 'right', width: 100 });
                doc.moveDown();
            });

            doc.moveDown(2);
            doc.fontSize(14).font('CustomFontBold').fillColor('red');
            doc.text(`VÉGÖSSZEG: ${formatMoney(vegosszegBrutto)}`, { align: 'right' });

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