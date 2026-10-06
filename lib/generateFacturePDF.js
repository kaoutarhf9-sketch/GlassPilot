import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Calcule le numéro de TVA intracommunautaire à partir du SIREN
 */
function getTvaIntracommunautaire(siren) {
  if (!siren) return 'FR12942435025';
  const cleanSiren = siren.toString().replace(/\s+/g, '').substring(0, 9);
  if (cleanSiren.length === 9 && !isNaN(cleanSiren)) {
    const sirenNum = parseInt(cleanSiren, 10);
    const cle = (12 + 3 * (sirenNum % 97)) % 97;
    const cleStr = cle < 10 ? `0${cle}` : `${cle}`;
    return `FR${cleStr}${cleanSiren}`;
  }
  return 'FR12942435025';
}

/**
 * Formate un nombre en euros : 184,00 €
 */
function formatEuro(num) {
  const n = Number(num) || 0;
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/**
 * Formate une date au format français JJ/MM/AAAA
 */
function formatDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('fr-FR');
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('fr-FR');
}

function getJsPDFClass() {
  if (typeof jsPDF === 'function') return jsPDF;
  if (jsPDF && typeof jsPDF.jsPDF === 'function') return jsPDF.jsPDF;
  if (jsPDF && typeof jsPDF.default === 'function') return jsPDF.default;
  return jsPDF;
}

/**
 * Génère le document PDF Devis ou Facture selon le modèle exact fourni
 */
export function generateFacturePDF({
  dossier,
  garage = {},
  devisData = null,
  factureData = null,
  isDevis = false
}) {
  const DocClass = getJsPDFClass();
  const doc = new DocClass({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Parse notes pour devis / facture si non passés
  let devis = devisData;
  let facture = factureData;
  if (!devis && dossier?.notes) {
    try {
      const parsed = typeof dossier.notes === 'string' ? JSON.parse(dossier.notes) : dossier.notes;
      devis = parsed.devis || null;
      facture = parsed.facture || null;
    } catch (e) {}
  }

  // Données garage (reprend les coordonnées exactes du garage ou fallback modèle)
  const garageNom = (garage.nom_garage || 'MS AUTOS').trim().toUpperCase();
  const garageAdresse = garage.adresse || '58 rue de Monceau';
  const garageCpVille = (garage.code_postal || garage.ville) 
    ? `${garage.code_postal || ''} ${garage.ville || ''}`.trim() 
    : '75008 PARIS';
  const garageEmail = garage.email_contact || 'msparebrise95@gmail.com';
  const garageTel = garage.telephone || '+33 7 58 01 31 82';
  const rawSiret = (garage.siret || '94243502500013').toString().replace(/\s+/g, '');
  const siren = rawSiret.substring(0, 9);
  const tvaNumber = garage.tva || getTvaIntracommunautaire(siren);
  const iban = garage.iban || 'FR7616958000012075042811932';
  const bic = garage.bic || 'QNTOFRP1XXX';

  // Données Client
  const client = dossier?.clients || {};
  const clientNom = `${client.nom || ''} ${client.prenom || ''}`.trim().toUpperCase() || 'AMMARI AZIZA';
  const clientAdresse = (client.adresse || '7 RUE EMILE ZOLA').toUpperCase();
  const clientCpVille = (client.code_postal || client.ville)
    ? `${client.code_postal || ''} ${client.ville || ''}`.trim().toUpperCase()
    : '93150 LE BLANC MESNIL';
  const clientTel = client.telephone || '+33 6 36 42 60 68';

  // Données Véhicule & Sinistre
  const immatriculation = dossier?.immatriculation || 'CY-393-TL';
  const modele = dossier?.modele_vehicule || 'PEUGEOT 307';
  
  // Assurance
  let assuranceNom = dossier?.assurance_nom || 'Direct assurance';
  if ((!assuranceNom || assuranceNom === '—') && dossier?.notes) {
    try {
      const parsedNotes = typeof dossier.notes === 'string' ? JSON.parse(dossier.notes) : dossier.notes;
      assuranceNom = parsedNotes.assurance_nom || parsedNotes.assurance_nom_ocr || assuranceNom;
    } catch (e) {}
  }

  // Numéro de contrat et numéro de sinistre (priorité au devis / facture / dossier)
  let numContrat = devis?.num_contrat || facture?.num_contrat || dossier?.num_contrat || dossier?.num_police || '';
  let numSinistre = devis?.num_sinistre || facture?.num_sinistre || dossier?.num_sinistre || dossier?.numero_sinistre || '';

  if ((!numContrat || !numSinistre) && dossier?.notes) {
    try {
      const p = typeof dossier.notes === 'string' ? JSON.parse(dossier.notes) : dossier.notes;
      if (!numContrat) numContrat = p.num_contrat || p.numero_contrat || p.num_police || '';
      if (!numSinistre) numSinistre = p.num_sinistre || p.numero_sinistre || '';
      if (!numContrat && p.devis?.num_contrat) numContrat = p.devis.num_contrat;
      if (!numSinistre && p.devis?.num_sinistre) numSinistre = p.devis.num_sinistre;
      if (!numContrat && p.facture?.num_contrat) numContrat = p.facture.num_contrat;
      if (!numSinistre && p.facture?.num_sinistre) numSinistre = p.facture.num_sinistre;
    } catch(e) {}
  }

  const displaySinistre = (numSinistre && numSinistre.trim()) ? numSinistre.trim() : '—';
  const displayContrat = (numContrat && numContrat.trim()) ? numContrat.trim() : '—';

  // Numéro de document & dates
  const typeDoc = isDevis ? 'Devis' : 'Facture';
  const numeroDoc = isDevis
    ? (devis?.numero || `DEV-2026-${dossier?.numero?.replace(/[^0-9]/g, '') || '1864'}`)
    : (facture?.numero || `FAC-2026-${dossier?.numero?.replace(/[^0-9]/g, '') || '1864'}`);

  const dateEmission = formatDate(isDevis ? devis?.date_emission : (facture?.date_emission || devis?.date_emission || dossier?.created_at));
  
  let dateLimite = formatDate(isDevis ? devis?.date_validite : (facture?.date_echeance || devis?.date_validite));
  if (!dateLimite || dateLimite === '—') {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    dateLimite = d.toLocaleDateString('fr-FR');
  }

  // Lignes d'articles
  const lignes = (devis?.lignes && devis.lignes.length > 0)
    ? devis.lignes
    : (facture?.lignes && facture.lignes.length > 0)
      ? facture.lignes
      : [
          {
            designation: "MAIN D'OEUVRE POSE/DEPOSE PARE-BRISE",
            prix_ht: 92.00,
            quantite: 2,
            remise: 0
          }
        ];

  // ========================================================
  // 1. EN-TÊTE GAUCHE : COORDONNÉES DU GARAGE
  // ========================================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(garageNom, 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(garageAdresse, 15, 24.5);
  doc.text(garageCpVille, 15, 29);
  doc.text(garageEmail, 15, 33.5);
  doc.text(garageTel, 15, 38);
  doc.text(`SIREN: ${siren || rawSiret}`, 15, 42.5);
  doc.text(`TVA: ${tvaNumber}`, 15, 47);

  // ========================================================
  // 2. EN-TÊTE DROITE : BADGE FACTURE / DATES / NUMÉRO
  // ========================================================
  const rightMargin = 195;

  // Badge pilule Facture (fond bleu clair #eef2ff, texte bleu marine)
  doc.setFillColor(238, 242, 255); // #eef2ff
  doc.roundedRect(rightMargin - 28, 14, 28, 6.5, 2, 2, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // #1e3a8a
  doc.text(typeDoc, rightMargin - 14, 18.3, { align: 'center' });

  // N° de facture
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`N° de ${typeDoc.toLowerCase()}:`, rightMargin, 26, { align: 'right' });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(numeroDoc, rightMargin, 30, { align: 'right' });

  // Date d'émission
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Date d'émission:", rightMargin, 35, { align: 'right' });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dateEmission, rightMargin, 39, { align: 'right' });

  // Date limite de paiement
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(isDevis ? "Date de validité:" : "Date limite de paiement:", rightMargin, 44, { align: 'right' });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dateLimite, rightMargin, 48, { align: 'right' });

  // ========================================================
  // 3. BLOC CLIENT (GAUCHE) & VÉHICULE (DROITE)
  // ========================================================
  const infoY = 64;

  // --- CLIENT (GAUCHE) ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Client", 15, infoY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(clientNom, 15, infoY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(clientAdresse, 15, infoY + 10);
  if (clientCpVille) {
    doc.text(clientCpVille, 15, infoY + 14.5);
  }
  if (clientTel) {
    doc.text(clientTel, 15, infoY + (clientCpVille ? 19 : 14.5));
  }

  // --- VÉHICULE & ASSURANCE (DROITE) ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Véhicule", rightMargin, infoY, { align: 'right' });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text(`Immatriculation: ${immatriculation}`, rightMargin, infoY + 5.5, { align: 'right' });
  doc.text(`Modèle: ${modele}`, rightMargin, infoY + 10, { align: 'right' });
  doc.text(`Assurance: ${assuranceNom}`, rightMargin, infoY + 14.5, { align: 'right' });
  doc.text(`Kilométrage: —`, rightMargin, infoY + 19, { align: 'right' });

  // Numéro de sinistre et contrat avec espacement net conforme au modèle
  const sinistreY = infoY + 26;
  doc.text(`Numéro de sinistre: ${displaySinistre}`, rightMargin, sinistreY, { align: 'right' });
  doc.text(`Numéro de contrat: ${displayContrat}`, rightMargin, sinistreY + 4.5, { align: 'right' });

  // ========================================================
  // 4. TABLEAU DES ARTICLES (EXACT SELON LE MODÈLE)
  // ========================================================
  const tableStartY = sinistreY + 11;

  let computedHT = 0;
  const tableRows = lignes.map(l => {
    const desc = (l.designation || l.desc || 'Prestation vitrage').toUpperCase();
    const pu = Number(l.prix_ht || l.prix || 0);
    const qte = Number(l.quantite || l.qte || 1);
    const rem = Number(l.remise || 0);
    const remiseStr = rem > 0 ? `${rem}%` : '-';
    const totalLine = pu * qte * (1 - rem / 100);
    computedHT += totalLine;

    return [
      desc,
      formatEuro(pu),
      qte.toString(),
      remiseStr,
      formatEuro(totalLine)
    ];
  });

  const finalHT = devis?.total_ht !== undefined ? Number(devis.total_ht) : computedHT;
  const tvaRate = Number(devis?.taux_tva || 20);
  const finalTVA = devis?.montant_tva !== undefined ? Number(devis.montant_tva) : finalHT * (tvaRate / 100);
  const finalTTC = devis?.total_ttc !== undefined ? Number(devis.total_ttc) : finalHT + finalTVA;

  const runAutoTable = typeof autoTable === 'function' ? autoTable : (autoTable?.default || (doc.autoTable ? (d, o) => d.autoTable(o) : null));
  if (runAutoTable) {
    runAutoTable(doc, {
      startY: tableStartY,
      margin: { left: 15, right: 15 },
      head: [["Détails", "P.U", "Quantité", "Remise", "Total HT"]],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [238, 242, 255], // #eef2ff bleu très doux
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 }
    },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      textColor: [15, 23, 42],
      lineWidth: 0
    },
    columnStyles: {
      0: { cellWidth: 98, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 24, halign: 'right' },
      2: { cellWidth: 20, halign: 'right' },
      3: { cellWidth: 16, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' }
    }
  });
}

  let curY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : tableStartY + 30;

  // ========================================================
  // 5. BLOC TOTAUX (TOTAL HT, TVA, ET BANDE TOTAL TTC)
  // ========================================================
  const totauxLabelX = rightMargin - 42;

  // Total HT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Total HT", totauxLabelX, curY);
  doc.setFont("helvetica", "normal");
  doc.text(formatEuro(finalHT), rightMargin, curY, { align: 'right' });
  curY += 7.5;

  // TVA 20.00%
  doc.setFont("helvetica", "bold");
  doc.text(`TVA ${tvaRate.toFixed(2)}%`, totauxLabelX, curY);
  doc.setFont("helvetica", "normal");
  doc.text(formatEuro(finalTVA), rightMargin, curY, { align: 'right' });
  curY += 6;

  // BANDE PLEINE LARGEUR BLEU CLAIR : Total TTC
  const bandHeight = 7.5;
  doc.setFillColor(238, 242, 255); // #eef2ff
  doc.rect(15, curY, 180, bandHeight, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Total TTC", totauxLabelX, curY + 5.2);
  doc.text(formatEuro(finalTTC), rightMargin, curY + 5.2, { align: 'right' });

  curY += bandHeight + 11;

  // ========================================================
  // 6. INFORMATIONS DE PAIEMENT & MENTIONS LÉGALES
  // ========================================================
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Informations de paiement", 15, curY);
  curY += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`IBAN: ${iban}`, 15, curY);
  curY += 4;
  doc.text(`BIC: ${bic}`, 15, curY);
  curY += 7;

  // Conditions de paiement :
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Conditions de paiement :", 15, curY);
  curY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text("Délai de paiement : 30 jours à compter de la réception de la facture.", 15, curY);
  curY += 3.5;
  doc.text("Escompte : aucun pour paiement anticipé.", 15, curY);
  curY += 3.5;
  doc.text("Pénalités de retard : taux d'intérêt légal en vigueur multiplié par trois.", 15, curY);
  curY += 3.5;
  doc.text("Indemnité forfaitaire pour frais de recouvrement : 40 €.", 15, curY);
  curY += 6.5;

  // Cession de créance :
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Cession de créance :", 15, curY);
  curY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text("Règlement à effectuer au profit du cessionnaire désigné.", 15, curY);
  curY += 3.5;
  doc.text("Facture établie dans le cadre d'une cession de créance.", 15, curY);
  curY += 6.5;

  // Documents joints :
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Documents joints :", 15, curY);
  curY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text("- Déclaration de bris de glace", 15, curY);
  curY += 3.5;
  doc.text("- Ordre de réparation", 15, curY);
  curY += 3.5;
  doc.text("- Cession de créance signée", 15, curY);

  // ========================================================
  // 7. BAS DE PAGE (FOOTER CENTRÉ)
  // ========================================================
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${garageNom} – SIRET : ${rawSiret || siren}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  return doc;
}
