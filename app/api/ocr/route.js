import { NextResponse } from 'next/server';
import Tesseract from 'tesseract.js';
const PDFParser = require("pdf2json");

// --- Libellés reconnus sur les documents FR ---
// Pour chaque champ : la ligne de LIBELLÉ. La valeur est lue sur la ligne SUIVANTE,
// ce qui correspond à la structure réelle des documents (label \n valeur).
const CARTE_GRISE_LABELS = {
  immatriculation: ["N° D'IMMATRICULATION", "N°D'IMMATRICULATION", "IMMATRICULATION"],
  date_premiere_immatriculation: ["1ÈRE IMMATRICULATION", "1ERE IMMATRICULATION"],
  titulaire: ["C.1", "TITULAIRE"],
  adresse: ["C.3", "ADRESSE"],
  marque: ["D.1", "MARQUE"],
  modele: ["D.3", "DÉNOMINATION COMMERCIALE", "DENOMINATION COMMERCIALE"],
  vin: ["N° D'IDENTIFICATION", "VIN"],
};

const ATTESTATION_LABELS = {
  nom_assurance: ["COMPAGNIE D'ASSURANCE", "COMPAGNIE D ASSURANCE"],
  num_contrat: ["N° DE CONTRAT", "N°DE CONTRAT", "CONTRAT"],
  souscripteur: ["SOUSCRIPTEUR"],
  date_naissance: ["DATE DE NAISSANCE"],
  adresse: ["ADRESSE"],
  immatriculation: ["IMMATRICULATION DU VÉHICULE", "IMMATRICULATION DU VEHICULE"],
  modele: ["MARQUE / MODÈLE", "MARQUE / MODELE", "MARQUE/MODELE"],
  vin: ["N° DE SÉRIE", "N° DE SERIE", "VIN"],
  date_effet: ["DATE D'EFFET"],
  date_echeance: ["DATE D'ÉCHÉANCE", "DATE D'ECHEANCE"],
  type_garantie: ["TYPE DE GARANTIE"],
};

// Extraction structurée : parcourt les lignes, dès qu'une ligne contient un libellé
// connu, on prend la ligne suivante comme valeur.
function extractByLabels(rawText, labelMap) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = {};
  for (let i = 0; i < lines.length - 1; i++) {
    const lineUpper = lines[i].toUpperCase();
    for (const [key, labels] of Object.entries(labelMap)) {
      if (result[key]) continue; // déjà trouvé, on garde la première occurrence
      if (labels.some(lbl => lineUpper.includes(lbl))) {
        result[key] = lines[i + 1];
      }
    }
  }
  return result;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type'); // 'carte_grise' ou 'attestation'

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);

    let text = "";

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      console.log(`[OCR] Extraction texte du PDF natif: ${file.name}`);
      try {
        text = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, 1); // 1 = format texte
          pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => resolve(pdfParser.getRawTextContent()));
          pdfParser.parseBuffer(nodeBuffer);
        });
      } catch (err) {
        console.error("Erreur lecture PDF:", err);
        throw new Error("Impossible de lire le contenu de ce PDF");
      }
    } else {
      // Image (JPG/PNG) : OCR Tesseract avec timeout 25s
      const ocrPromise = new Promise(async (resolve, reject) => {
        let worker;
        try {
          worker = await Tesseract.createWorker('fra');
          const ret = await worker.recognize(nodeBuffer);
          await worker.terminate();
          resolve(ret.data.text);
        } catch (err) {
          if (worker) await worker.terminate().catch(e => console.error(e));
          reject(err);
        }
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout de l'analyse OCR (25s)")), 25000)
      );

      text = await Promise.race([ocrPromise, timeoutPromise]);
    }

    console.log(`[OCR ${type}] Texte extrait (début):\n`, text.substring(0, 150) + '...');

    // --- ÉTAPE 1 : extraction structurée par libellé (fiable sur PDF natif propre) ---
    const labelMap = type === 'attestation' ? ATTESTATION_LABELS : CARTE_GRISE_LABELS;
    let extractedData = extractByLabels(text, labelMap);

    // --- ÉTAPE 2 : filets de sécurité par regex globale, UNIQUEMENT pour les champs
    // encore vides (utile pour du texte OCR image, moins bien structuré en lignes) ---
    const textUpper = text.toUpperCase().replace(/\r?\n/g, ' ');

    if (!extractedData.immatriculation) {
      // Plaque SIV : 2 lettres - 3 chiffres - 2 lettres.
      // Séparateur OBLIGATOIRE (+ au lieu de *) + \b pour ne jamais matcher
      // à l'intérieur d'un mot comme "IMMATRICULATION".
      const plateRegex = /\b([A-Z]{2})[-\s\.]+([0-9]{3})[-\s\.]+([A-Z]{2})\b/;
      const m = textUpper.match(plateRegex);
      if (m) extractedData.immatriculation = `${m[1]}-${m[2]}-${m[3]}`;
    }

    if (!extractedData.modele) {
      const marques = ['PEUGEOT', 'RENAULT', 'CITROEN', 'DACIA', 'VOLKSWAGEN', 'AUDI', 'MERCEDES', 'BMW', 'TOYOTA', 'FORD', 'FIAT', 'NISSAN', 'KIA', 'HYUNDAI', 'OPEL', 'SEAT', 'SKODA'];
      for (const marque of marques) {
        if (textUpper.includes(marque)) {
          extractedData.modele = marque;
          break;
        }
      }
    }

    if (!extractedData.num_contrat) {
      const contratRegex = /(?:CONTRAT|POLICE|N[°O]|REF|REFERENCE|DOSSIER|SINISTRE)[\s:.\-_]*([A-Z0-9\-]{5,20})/;
      const m = textUpper.match(contratRegex);
      if (m && /\d/.test(m[1])) extractedData.num_contrat = m[1];
    }

    if (!extractedData.nom_assurance) {
      const assurances = ['AXA', 'ALLIANZ', 'MACIF', 'MAAF', 'MMA', 'GROUPAMA', 'GMF', 'PACIFICA', 'MATMUT', 'DIRECT ASSURANCE', 'CREDIT MUTUEL', 'CREDIT AGRICOLE', 'BRED', 'BANQUE POPULAIRE', 'CAISSE D EPARGNE', "L'OLIVIER", 'LEOCARE', 'ABEILLE', 'GENERALI', 'BPCE'];
      for (const ass of assurances) {
        const safeAss = ass.replace(/ /g, "[\\s']?");
        if (new RegExp(`\\b${safeAss}\\b`).test(textUpper)) {
          extractedData.nom_assurance = ass;
          break;
        }
      }
    }

    if (!extractedData.vin) {
      // VIN : 17 caractères, alphanumérique, sans I/O/Q (norme ISO)
      const vinRegex = /\b([A-HJ-NPR-Z0-9]{17})\b/;
      const m = textUpper.match(vinRegex);
      if (m) extractedData.vin = m[1];
    }

    return NextResponse.json(extractedData);

  } catch (error) {
    console.error("Erreur API OCR:", error);
    return NextResponse.json({ error: "Erreur lors de l'analyse du document par l'IA" }, { status: 500 });
  }
}