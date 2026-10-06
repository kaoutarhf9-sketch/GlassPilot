import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Calcule le numéro de TVA intracommunautaire à partir du SIREN
 */
function getTvaIntracommunautaire(siren) {
  if (!siren) return 'FR29988266011';
  const cleanSiren = siren.toString().replace(/\s+/g, '').substring(0, 9);
  if (cleanSiren.length === 9 && !isNaN(cleanSiren)) {
    const sirenNum = parseInt(cleanSiren, 10);
    const cle = (12 + 3 * (sirenNum % 97)) % 97;
    const cleStr = cle < 10 ? `0${cle}` : `${cle}`;
    return `FR${cleStr}${cleanSiren}`;
  }
  return 'FR29988266011';
}

/**
 * Formate un nombre en euros : 368,17 €
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

/**
 * Génère le document PDF Devis ou Facture selon le modèle officiel
 */
export function generateFacturePDF({
  dossier,
  garage = {},
  devisData = null,
  factureData = null,
  isDevis = false
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Données garage
  const garageNom = (garage.nom_garage || 'MS GLASS').trim().toUpperCase();
  const garageAdresse = garage.adresse || '24 RUE ARAGO';
  const garageTel = garage.telephone || '07 82 24 86 49';
  const garageEmail = garage.email_contact || 'msparebrise95@gmail.com';
  const rawSiret = (garage.siret || '98826601100010').toString().replace(/\s+/g, '');
  const siren = rawSiret.substring(0, 9);
  const tvaNumber = getTvaIntracommunautaire(siren);
  const iban = garage.iban || 'FR76 1234 5678 9012 3456 7890 123';
  const bic = garage.bic || 'BNPAFRPPXXX';

  // Données Client
  const client = dossier?.clients || {};
  const clientNom = `${client.nom || ''} ${client.prenom || ''}`.trim().toUpperCase() || 'CLIENT PARTICULIER';
  const clientAdresse = client.adresse || 'ADRESSE NON RENSEIGNÉE';
  const clientCpVille = `${client.code_postal || ''} ${client.ville || ''}`.trim() || '';
  const clientTel = client.telephone || '';

  // Données Véhicule & Sinistre
  const immatriculation = dossier?.immatriculation || '—';
  const modele = dossier?.modele_vehicule || '—';
  
  // Assurance
  let assuranceNom = dossier?.assurance_nom || '—';
  if (!assuranceNom || assuranceNom === '—') {
    try {
      const parsedNotes = JSON.parse(dossier?.notes || '{}');
      assuranceNom = parsedNotes.assurance_nom || parsedNotes.assurance_nom_ocr || '—';
    } catch (e) {}
  }

  // Parse notes pour devis / facture si non passés
  let devis = devisData;
  let facture = factureData;
  if (!devis && dossier?.notes) {
    try {
      const parsed = JSON.parse(dossier.notes);
      devis = parsed.devis || null;
      facture = parsed.facture || null;
    } catch (e) {}
  }

  // Lignes d'articles
  const lignes = (devis?.lignes && devis.lignes.length > 0)
    ? devis.lignes
    : (dossier?.notes ? (() => {
        try {
          const p = JSON.parse(dossier.notes);
          return p.facture_lignes || [];
        } catch(e) { return []; }
      })() : []);

  // Numéro de document & dates
  const typeDoc = isDevis ? 'Devis' : 'Facture';
  const numeroDoc = isDevis
    ? (devis?.numero || `DEV-${new Date().getFullYear()}-${dossier?.numero?.replace(/[^0-9]/g, '') || '001'}`)
    : (facture?.numero || `FAC-${new Date().getFullYear()}-${dossier?.numero?.replace(/[^0-9]/g, '') || '001'}`);

  const dateEmission = formatDate(isDevis ? devis?.date_emission : (facture?.date_emission || devis?.date_emission));
  
  // Date limite (par défaut +30 jours)
  let dateLimite = formatDate(isDevis ? devis?.date_validite : (facture?.date_echeance || devis?.date_validite));
  if (!dateLimite || dateLimite === '—') {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    dateLimite = d.toLocaleDateString('fr-FR');
  }

  // Numéros sinistre et contrat
  let numSinistre = dossier?.numero_sinistre || '—';
  let numContrat = dossier?.numero_police || '—';
  if (numSinistre === '—' && dossier?.notes) {
    try {
      const p = JSON.parse(dossier.notes);
      numSinistre = p.numero_sinistre || numSinistre;
      numContrat = p.numero_contrat || p.numero_police || numContrat;
    } catch(e) {}
  }

  // --- EN-TÊTE : COORDONNÉES GARAGE (GAUCHE) ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 25, 45);
  doc.text(garageNom, 15, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 85, 100);
  doc.text(garageAdresse, 15, 25);
  doc.text(garageEmail, 15, 29.5);
  doc.text(garageTel, 15, 34);
  doc.text(`SIREN: ${siren || rawSiret}`, 15, 38.5);
  doc.text(`TVA: ${tvaNumber}`, 15, 43);

  // --- LOGO CENTRAL (BADGE STYLISÉ SI PAS D'IMAGE) ---
  const logoX = 95;
  const logoY = 24;
  doc.setDrawColor(20, 45, 90);
  doc.setFillColor(10, 20, 45);
  doc.circle(logoX, logoY, 13, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const initials = garageNom.length > 8 ? garageNom.substring(0, 8) : garageNom;
  doc.text(initials, logoX, logoY + 1.5, { align: 'center' });

  // --- BLOC TITRE ET NUMÉRO (DROITE) ---
  const rightX = 195;
  
  // Badge Facture / Devis
  doc.setFillColor(235, 245, 255);
  doc.roundedRect(rightX - 32, 14, 32, 7, 2, 2, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 84, 255);
  doc.text(typeDoc, rightX - 16, 18.8, { align: 'center' });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 110, 125);
  doc.text(`N° de ${typeDoc.toLowerCase()} :`, rightX - 45, 27);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 25, 45);
  doc.text(numeroDoc, rightX, 27, { align: 'right' });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 110, 125);
  doc.text("Date d'émission :", rightX - 45, 32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 25, 45);
  doc.text(dateEmission, rightX, 32, { align: 'right' });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 110, 125);
  doc.text(isDevis ? "Date de validité :" : "Date limite de paiement :", rightX - 45, 37);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 25, 45);
  doc.text(dateLimite, rightX, 37, { align: 'right' });

  // --- SÉPARATION ---
  doc.setDrawColor(230, 235, 245);
  doc.line(15, 49, 195, 49);

  // --- BLOC CLIENT (GAUCHE) & BLOC VÉHICULE (DROITE) ---
  const blockY = 56;
  
  // Client
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(130, 140, 155);
  doc.text("Client", 15, blockY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(20, 25, 45);
  doc.text(clientNom, 15, blockY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 65, 80);
  doc.text(clientAdresse, 15, blockY + 10.5);
  if (clientCpVille) {
    doc.text(clientCpVille, 15, blockY + 15);
  }
  if (clientTel) {
    doc.text(clientTel, 15, blockY + (clientCpVille ? 19.5 : 15));
  }

  // Véhicule & Sinistre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(130, 140, 155);
  doc.text("Véhicule", rightX - 70, blockY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(70, 75, 90);
  
  doc.text("Immatriculation :", rightX - 70, blockY + 5.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 25, 45);
  doc.text(immatriculation, rightX, blockY + 5.5, { align: 'right' });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 75, 90);
  doc.text("Modèle :", rightX - 70, blockY + 10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 25, 45);
  doc.text(modele, rightX, blockY + 10, { align: 'right' });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 75, 90);
  doc.text("Assurance :", rightX - 70, blockY + 14.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 25, 45);
  doc.text(assuranceNom, rightX, blockY + 14.5, { align: 'right' });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 75, 90);
  doc.text("Kilométrage :", rightX - 70, blockY + 19);
  doc.text("—", rightX, blockY + 19, { align: 'right' });

  doc.text("Numéro de sinistre :", rightX - 70, blockY + 23.5);
  doc.text(numSinistre, rightX, blockY + 23.5, { align: 'right' });

  doc.text("Numéro de contrat :", rightX - 70, blockY + 28);
  doc.text(numContrat, rightX, blockY + 28, { align: 'right' });

  // --- TABLEAU DES ARTICLES ---
  const startTableY = blockY + 34;

  const tableHead = [["Détails", "P.U", "Quantité", "Remise", "Total HT"]];
  
  let computedTotalHT = 0;
  const tableRows = lignes.map(l => {
    const desc = (l.designation || l.desc || 'Prestation vitrage').toUpperCase();
    const pu = Number(l.prix_ht || l.prix || 0);
    const qte = Number(l.quantite || l.qte || 1);
    const rem = Number(l.remise || 0);
    const remiseStr = rem > 0 ? `${rem}%` : '-';
    const totalLigne = pu * qte * (1 - rem / 100);
    computedTotalHT += totalLigne;

    return [
      desc,
      formatEuro(pu),
      qte.toString(),
      remiseStr,
      formatEuro(totalLigne)
    ];
  });

  // Si aucune ligne n'a été saisie, injecter une ligne par défaut
  if (tableRows.length === 0) {
    tableRows.push([
      `REMPLACEMENT VITRAGE (${dossier?.type_vitrage || 'PARE-BRISE'})`,
      formatEuro(350),
      "1",
      "-",
      formatEuro(350)
    ]);
    computedTotalHT = 350;
  }

  // Calcul totaux
  const remiseGenerale = Number(devis?.remise_generale || 0);
  const remiseType = devis?.remise_type || '%';
  let montantRemiseGen = 0;
  if (remiseGenerale > 0) {
    montantRemiseGen = remiseType === '%' ? computedTotalHT * (remiseGenerale / 100) : remiseGenerale;
  }
  const finalHT = Math.max(0, (devis?.total_ht !== undefined ? Number(devis.total_ht) : computedTotalHT - montantRemiseGen));
  const tvaRate = Number(devis?.taux_tva || 20);
  const finalTVA = devis?.montant_tva !== undefined ? Number(devis.montant_tva) : finalHT * (tvaRate / 100);
  const finalTTC = devis?.total_ttc !== undefined ? Number(devis.total_ttc) : finalHT + finalTVA;
  
  // Dû client (franchise si applicable)
  const franchiseMontant = Number(dossier?.franchise_montant || 0);
  const duClient = franchiseMontant > 0 ? franchiseMontant : 0;

  autoTable(doc, {
    startY: startTableY,
    head: tableHead,
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [238, 245, 255],
      textColor: [20, 30, 60],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 3.5,
      halign: 'left'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: [35, 40, 55],
      lineColor: [240, 243, 248],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 100, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 24, halign: 'right' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
    },
    didDrawPage: (data) => {
      // Pour pagination future si nécessaire
    }
  });

  let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : startTableY + 50;

  // --- BLOC TOTAUX (DROITE) ---
  const totauxBoxWidth = 85;
  const totauxX = pageWidth - totauxBoxWidth - 15;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 85, 100);

  // Total HT
  doc.text("Total HT", totauxX + 5, currentY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 25, 45);
  doc.text(formatEuro(finalHT), pageWidth - 15, currentY, { align: 'right' });
  currentY += 5.5;

  // TVA
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 85, 100);
  doc.text(`TVA ${tvaRate.toFixed(2)}%`, totauxX + 5, currentY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 25, 45);
  doc.text(formatEuro(finalTVA), pageWidth - 15, currentY, { align: 'right' });
  currentY += 6.5;

  // Total TTC (Boîte bleue claire)
  doc.setFillColor(238, 245, 255);
  doc.roundedRect(totauxX, currentY - 4.5, totauxBoxWidth, 7.5, 1, 1, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 45, 90);
  doc.text("Total TTC", totauxX + 5, currentY);
  doc.text(formatEuro(finalTTC), pageWidth - 15, currentY, { align: 'right' });
  currentY += 8.5;

  // Dû client (Boîte pêche douce)
  doc.setFillColor(255, 243, 230);
  doc.roundedRect(totauxX, currentY - 4.5, totauxBoxWidth, 7.5, 1, 1, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(170, 75, 20);
  doc.text("Dû client", totauxX + 5, currentY);
  doc.text(formatEuro(duClient), pageWidth - 15, currentY, { align: 'right' });
  currentY += 12;

  // --- BLOC INFORMATIONS DE PAIEMENT & MENTIONS LÉGALES ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 145);
  doc.text("Informations de paiement", 15, currentY);
  currentY += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 65, 80);
  doc.text(`IBAN : ${iban}`, 15, currentY);
  currentY += 4;
  doc.text(`BIC : ${bic}`, 15, currentY);
  currentY += 6;

  // Conditions de paiement
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(40, 45, 60);
  doc.text("Conditions de paiement :", 15, currentY);
  currentY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(90, 95, 110);
  doc.text("Délai de paiement : 30 jours à compter de la réception de la facture.", 15, currentY);
  currentY += 3.5;
  doc.text("Escompte : aucun pour paiement anticipé.", 15, currentY);
  currentY += 3.5;
  doc.text("Pénalités de retard : taux d'intérêt légal en vigueur multiplié par trois.", 15, currentY);
  currentY += 3.5;
  doc.text("Indemnité forfaitaire pour frais de recouvrement : 40 €.", 15, currentY);
  currentY += 6;

  // Cession de créance
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(40, 45, 60);
  doc.text("Cession de créance :", 15, currentY);
  currentY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(90, 95, 110);
  doc.text("Règlement à effectuer au profit du cessionnaire désigné.", 15, currentY);
  currentY += 3.5;
  doc.text("Facture établie dans le cadre d'une cession de créance.", 15, currentY);
  currentY += 7;

  // Documents joints
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(40, 45, 60);
  doc.text("Documents joints :", 15, currentY);
  currentY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(90, 95, 110);
  doc.text("- Déclaration de bris de glace", 15, currentY);
  currentY += 3.5;
  doc.text("- Ordre de réparation", 15, currentY);
  currentY += 3.5;
  doc.text("- Cession de créance signée", 15, currentY);

  // --- BAS DE PAGE (FOOTER) ---
  const footerY = pageHeight - 10;
  doc.setDrawColor(230, 235, 245);
  doc.line(15, footerY - 4, 195, footerY - 4);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(130, 140, 155);
  doc.text(`${garageNom} - SIRET : ${rawSiret || siren}`, pageWidth / 2, footerY, { align: 'center' });

  return doc;
}
