// Refine test extractor
function extractDocumentData(rawText) {
  if (!rawText || typeof rawText !== 'string') return {};

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = {};

  const fullText = rawText.replace(/\r?\n/g, ' ');
  const fullTextUpper = fullText.toUpperCase();

  // Helper pour trouver une valeur associée à un libellé
  const findValue = (labelPatterns) => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineUpper = line.toUpperCase();

      for (const pattern of labelPatterns) {
        // Nettoyer pattern
        const patUpper = pattern.toUpperCase();
        const idx = lineUpper.indexOf(patUpper);
        if (idx !== -1) {
          // Extraire ce qui se trouve après le libellé sur la même ligne
          let after = line.substring(idx + pattern.length);
          // Nettoyer séparateurs de début (/ , : = - etc.)
          after = after.replace(/^[\s/:.\-_=)]+/, '').trim();
          if (after && after.length > 1) {
            return after;
          }
          // Sinon regarder la ligne suivante
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            // Ignorer si la ligne suivante ressemble à un autre en-tête / libellé
            if (nextLine && !/^[A-Z]\.[0-9]|^[A-Z]\b|^(N°|DATE|ADRESSE|MARQUE|MOD[EÈ]LE|IMMAT|ASSUR|SOUSCRIPTEUR)/i.test(nextLine)) {
              return nextLine;
            }
          }
        }
      }
    }
    return null;
  };

  // --- 1. IMMATRICULATION ---
  const sivMatch = fullTextUpper.match(/\b([A-Z]{2})[\s\-.]?([0-9]{3})[\s\-.]?([A-Z]{2})\b/);
  if (sivMatch) {
    result.immatriculation = `${sivMatch[1]}-${sivMatch[2]}-${sivMatch[3]}`;
  } else {
    const fniMatch = fullTextUpper.match(/\b([0-9]{1,4})[\s\-.]+([A-Z]{2,3})[\s\-.]+([0-9]{2,3})\b/);
    if (fniMatch) {
      result.immatriculation = `${fniMatch[1]} ${fniMatch[2]} ${fniMatch[3]}`;
    } else {
      const fromLabel = findValue(["N° D'IMMATRICULATION", "N°D'IMMATRICULATION", "IMMATRICULATION DU VEHICULE", "IMMATRICULATION DU VÉHICULE", "IMMATRICULATION", "(A)", " A "]);
      if (fromLabel) {
        const cleaned = fromLabel.replace(/[^A-Z0-9\-]/gi, '');
        if (cleaned.length >= 7) result.immatriculation = cleaned;
      }
    }
  }

  // --- 2. MARQUE & MODÈLE ---
  const KNOWN_BRANDS = [
    'PEUGEOT', 'RENAULT', 'CITROEN', 'CITROËN', 'DACIA', 'VOLKSWAGEN', 'AUDI', 
    'MERCEDES', 'BMW', 'TOYOTA', 'FORD', 'FIAT', 'NISSAN', 
    'KIA', 'HYUNDAI', 'OPEL', 'SEAT', 'SKODA', 'ŠKODA', 'VOLVO', 'MINI', 
    'DS', 'ALFA ROMEO', 'TESLA', 'SUZUKI', 'JEEP', 'LAND ROVER',
    'MAZDA', 'PORSCHE', 'HONDA', 'CUPRA', 'SMART', 'MITSUBISHI', 'MG'
  ];

  let brand = '';
  let model = '';

  const marqueModeleCombined = findValue(["MARQUE / MODÈLE", "MARQUE / MODELE", "MARQUE/MODELE", "MARQUE ET MODÈLE"]);
  if (marqueModeleCombined) {
    result.modele = marqueModeleCombined;
  } else {
    const brandFromLabel = findValue(["D.1", "MARQUE"]);
    const modelFromLabel = findValue(["D.3", "DÉNOMINATION COMMERCIALE", "DENOMINATION COMMERCIALE", "MODÈLE", "MODELE"]);

    if (brandFromLabel) {
      brand = brandFromLabel;
    } else {
      for (const b of KNOWN_BRANDS) {
        if (new RegExp(`\\b${b}\\b`, 'i').test(fullTextUpper)) {
          brand = b;
          break;
        }
      }
    }

    if (modelFromLabel) model = modelFromLabel;

    if (brand && model) {
      result.modele = brand.toUpperCase() === model.toUpperCase() ? brand : `${brand} ${model}`;
    } else if (brand) {
      result.modele = brand;
    } else if (model) {
      result.modele = model;
    }
  }

  // --- 3. COMPAGNIE D'ASSURANCE ---
  const KNOWN_INSURERS = [
    'AXA', 'ALLIANZ', 'MACIF', 'MAAF', 'MMA', 'GROUPAMA', 'GMF', 'PACIFICA',
    'MATMUT', 'DIRECT ASSURANCE', 'CREDIT MUTUEL', 'CRÉDIT MUTUEL', 'CREDIT AGRICOLE',
    'CRÉDIT AGRICOLE', 'BRED', 'BANQUE POPULAIRE', 'CAISSE D EPARGNE', "CAISSE D'EPARGNE",
    "L'OLIVIER", "LOLIVIER", 'LEOCARE', 'ABEILLE', 'GENERALI', 'BPCE', 'MAIF',
    'THELEM', 'THÉLEM', 'SWISSLIFE', 'SWISS LIFE', 'SURAVENIR', 'AVIVA', 'APRIL',
    'EUROFIL', 'GAN', 'ACM', 'ASSURPEOPLE', 'MUTUELLE DE POITIERS', 'MONCEAU',
    'ALBINGIA', 'CHUBB', 'HISCOX', 'AIG', 'CARREFOUR BANQUE'
  ];

  const assFromLabel = findValue(["COMPAGNIE D'ASSURANCE", "COMPAGNIE D ASSURANCE", "ASSUREUR", "SOCIÉTÉ D'ASSURANCE", "SOCIETE D ASSURANCE"]);
  if (assFromLabel) {
    result.nom_assurance = assFromLabel;
  } else {
    for (const ass of KNOWN_INSURERS) {
      const safe = ass.replace(/[' -]/g, "[\\s'-]?");
      if (new RegExp(`\\b${safe}\\b`, 'i').test(fullTextUpper)) {
        result.nom_assurance = ass;
        break;
      }
    }
  }

  // --- 4. NUMÉRO DE CONTRAT ---
  const contratFromLabel = findValue([
    "N° DE CONTRAT", "N°DE CONTRAT", "NUMERO DE CONTRAT", "N° CONTRAT", "CONTRAT N°", "CONTRAT NO",
    "POLICE N°", "N° DE POLICE", "POLICE D'ASSURANCE", "POLICE D ASSURANCE",
    "RÉFÉRENCE CONTRAT", "REFERENCE CONTRAT"
  ]);

  if (contratFromLabel) {
    const cleaned = contratFromLabel.replace(/^[^A-Z0-9]+|[^A-Z0-9\-]+$/gi, '').trim();
    if (cleaned.length >= 3) result.num_contrat = cleaned;
  } else {
    const contratRegex = /(?:CONTRAT|POLICE|SOUSCRIPTION)[\s:.\-_#N°O]+([A-Z0-9\-]{4,22})/i;
    const m = fullText.match(contratRegex);
    if (m && /\d/.test(m[1])) {
      result.num_contrat = m[1].trim();
    }
  }

  // --- 5. CLIENT (NOM, PRÉNOM, SOCIÉTÉ) ---
  const titulaire = findValue([
    "C.1", "TITULAIRE", "SOUSCRIPTEUR", "ASSURÉ", "ASSURE",
    "NOM DU SOUSCRIPTEUR", "NOM ET PRÉNOM", "NOM ET PRENOM", "CONDUCTEUR"
  ]);

  if (titulaire) {
    if (/\b(SARL|SAS|SASU|EURL|SCI|SA|SNC|ETS|GARAGE|TRANSPORT|BTP|AUTO)\b/i.test(titulaire)) {
      result.nom_societe = titulaire;
      result.prenom = '';
    } else {
      const parts = titulaire.replace(/^(M\.|MME|MLLE|MONSIEUR|MADAME)\s+/i, '').trim().split(/\s+/);
      if (parts.length === 1) {
        result.nom_societe = parts[0];
      } else if (parts.length >= 2) {
        result.nom_societe = parts[0];
        result.prenom = parts.slice(1).join(' ');
      }
    }
  }

  // --- 6. ADRESSE, CODE POSTAL, VILLE ---
  const adresseRaw = findValue([
    "C.3", "ADRESSE DU TITULAIRE", "ADRESSE DU SOUSCRIPTEUR", "ADRESSE DE L'ASSURÉ", "ADRESSE"
  ]);

  if (adresseRaw) {
    const cpMatch = adresseRaw.match(/\b([0-9]{5})\b/);
    if (cpMatch) {
      result.code_postal = cpMatch[1];
      const parts = adresseRaw.split(cpMatch[1]);
      result.adresse = parts[0].replace(/[\s,;]+$/, '').trim();
      result.ville = (parts[1] || '').replace(/^[\s,;]+/, '').trim();
    } else {
      result.adresse = adresseRaw;
    }
  }

  // --- 7. VIN (Numéro de série) ---
  const vinMatch = fullTextUpper.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  if (vinMatch) {
    result.vin = vinMatch[1];
  }

  return result;
}

const testAttestation = `
ATTESTATION D'ASSURANCE AUTOMOBILE
COMPAGNIE D'ASSURANCE : AXA FRANCE IARD
N° DE CONTRAT : 9876543210
SOUSCRIPTEUR : MARTIN SOPHIE
ADRESSE : 14 BOULEVARD HAUSSMANN 75009 PARIS
IMMATRICULATION DU VEHICULE : AB-345-CD
MARQUE / MODÈLE : PEUGEOT 208
`;
console.log('Result Attestation:', extractDocumentData(testAttestation));
