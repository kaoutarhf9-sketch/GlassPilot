/**
 * Extraction intelligente et robuste des données d'un document (Carte Grise, Attestation, Mémo Assuré)
 */
export function extractDocumentData(rawText) {
  if (!rawText || typeof rawText !== 'string') return {};

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = {};

  const fullText = rawText.replace(/\r?\n/g, ' ');
  const fullTextUpper = fullText.toUpperCase();

  // Helper pour trouver une valeur après un libellé
  const findValue = (labelPatterns, options = {}) => {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineUpper = line.toUpperCase();

      for (const pattern of labelPatterns) {
        const patUpper = pattern.toUpperCase();
        const idx = lineUpper.indexOf(patUpper);
        if (idx !== -1) {
          // Si on doit éviter certains faux-amis (ex: "VÉHICULE ASSURÉ" pour "ASSURÉ")
          if (options.excludePrefix && idx > 0) {
            const before = lineUpper.substring(0, idx).trim();
            if (options.excludePrefix.some(ex => before.includes(ex))) continue;
          }

          let after = line.substring(idx + pattern.length);
          after = after.replace(/^[\s/:.\-_=)]+/, '').trim();
          if (after && after.length > 1) {
            return after;
          }
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine && !/^[A-Z]\.[0-9]|^[A-Z]\b|^(N°|DATE|ADRESSE|MARQUE|MOD[EÈ]LE|IMMAT|ASSUR|SOUSCRIPTEUR|FORMULE|OPTIONS|USAGE|VALABLE)/i.test(nextLine)) {
              return nextLine;
            }
          }
        }
      }
    }
    return null;
  };

  // --- 1. IMMATRICULATION ---
  // Format SIV : AA-123-AA ou AA 123 AA ou AA123AA
  const sivMatch = fullTextUpper.match(/\b([A-Z]{2})[\s\-.]?([0-9]{3})[\s\-.]?([A-Z]{2})\b/);
  if (sivMatch) {
    result.immatriculation = `${sivMatch[1]}-${sivMatch[2]}-${sivMatch[3]}`;
  } else {
    // Format FNI (ancien) : 1234 AB 75
    const fniMatch = fullTextUpper.match(/\b([0-9]{1,4})[\s\-.]+([A-Z]{2,3})[\s\-.]+([0-9]{2,3})\b/);
    if (fniMatch) {
      result.immatriculation = `${fniMatch[1]} ${fniMatch[2]} ${fniMatch[3]}`;
    } else {
      const fromLabel = findValue([
        "N° D'IMMATRICULATION", "N°D'IMMATRICULATION", "IMMATRICULATION DU VEHICULE",
        "IMMATRICULATION DU VÉHICULE", "IMMATRICULATION", "IMMATRICULÉ", "IMMATRICULE", "(A)", " A "
      ]);
      if (fromLabel) {
        const cleaned = fromLabel.replace(/[^A-Z0-9\-]/gi, '');
        if (cleaned.length >= 7) result.immatriculation = cleaned;
      }
    }
  }

  // --- 2. MARQUE & MODÈLE ---
  const vehiculeAssureVal = findValue(["VÉHICULE ASSURÉ", "VEHICULE ASSURE", "VÉHICULE", "VEHICULE"]);
  const marqueModeleCombined = findValue(["MARQUE / MODÈLE", "MARQUE / MODELE", "MARQUE/MODELE", "MARQUE ET MODÈLE"]);

  if (vehiculeAssureVal && vehiculeAssureVal.length > 2 && !/^(ASSUR|OBLIG)/i.test(vehiculeAssureVal)) {
    result.modele = vehiculeAssureVal;
  } else if (marqueModeleCombined) {
    result.modele = marqueModeleCombined;
  } else {
    const brandFromLabel = findValue(["D.1", "MARQUE"]);
    const modelFromLabel = findValue(["D.3", "DÉNOMINATION COMMERCIALE", "DENOMINATION COMMERCIALE", "MODÈLE", "MODELE"]);

    const KNOWN_BRANDS = [
      'PEUGEOT', 'RENAULT', 'CITROEN', 'CITROËN', 'DACIA', 'VOLKSWAGEN', 'AUDI', 
      'MERCEDES', 'BMW', 'TOYOTA', 'FORD', 'FIAT', 'NISSAN', 
      'KIA', 'HYUNDAI', 'OPEL', 'SEAT', 'SKODA', 'ŠKODA', 'VOLVO', 'MINI', 
      'DS', 'ALFA ROMEO', 'TESLA', 'SUZUKI', 'JEEP', 'LAND ROVER',
      'MAZDA', 'PORSCHE', 'HONDA', 'CUPRA', 'SMART', 'MITSUBISHI', 'MG'
    ];

    let brand = brandFromLabel;
    if (!brand) {
      for (const b of KNOWN_BRANDS) {
        if (new RegExp(`\\b${b}\\b`, 'i').test(fullTextUpper)) {
          brand = b;
          break;
        }
      }
    }

    let model = modelFromLabel;
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

  // --- 4. NUMÉRO DE CONTRAT OU SOCIÉTAIRE ---
  const contratFromLabel = findValue([
    "N° DE SOCIÉTAIRE", "N° DE SOCIETAIRE", "N° SOCIÉTAIRE", "N° SOCIETAIRE",
    "NUMÉRO DE SOCIÉTAIRE", "NUMERO DE SOCIETAIRE", "SOCIÉTAIRE :", "SOCIETAIRE :",
    "N° DE CONTRAT", "N°DE CONTRAT", "NUMERO DE CONTRAT", "N° CONTRAT", "CONTRAT N°", "CONTRAT NO",
    "POLICE N°", "N° DE POLICE", "POLICE D'ASSURANCE", "POLICE D ASSURANCE",
    "RÉFÉRENCE CONTRAT", "REFERENCE CONTRAT"
  ]);

  if (contratFromLabel) {
    const cleaned = contratFromLabel.replace(/^[^A-Z0-9]+|[^A-Z0-9\-]+$/gi, '').trim();
    if (cleaned.length >= 3) result.num_contrat = cleaned;
  } else {
    const contratRegex = /(?:CONTRAT|POLICE|SOCI[EÉ]TAIRE|SOUSCRIPTION)[\s:.\-_#N°O]+([A-Z0-9\-]{4,22})/i;
    const m = fullText.match(contratRegex);
    if (m && /\d/.test(m[1])) {
      result.num_contrat = m[1].trim();
    }
  }

  // --- 5. ADRESSE, CODE POSTAL, VILLE ---
  // A. Recherche d'un bloc postal : ex "95120 ERMONT"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cpMatch = line.match(/\b([0-9]{5})\b\s+([A-Z\s\-]{2,30})/i);
    if (cpMatch) {
      // Ignorer l'adresse de siège d'assurance en bas de page (ex "Niort" pour MAIF)
      if (/NIORT|CEDEX/i.test(cpMatch[2]) && i > lines.length - 5) {
        // Ignorer
      } else {
        result.code_postal = cpMatch[1];
        result.ville = cpMatch[2].replace(/CEDEX.*$/i, '').trim();

        // La ligne juste au-dessus est souvent la rue (ex: "12 SQUARE JULES CESAR")
        if (i > 0 && !result.adresse) {
          const prevLine = lines[i - 1];
          if (/\b(RUE|AVENUE|BD|BOULEVARD|SQUARE|CHEMIN|IMPASSE|ROUTE|ALLEE|ALLÉE|PLACE|RESIDENCE|RÉSIDENCE|[0-9]{1,4})\b/i.test(prevLine)) {
            result.adresse = prevLine.replace(/^(ADRESSE\s*:?)/i, '').trim();
          }
        }
        break;
      }
    }
  }

  if (!result.adresse) {
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
  }

  // --- 6. CLIENT (NOM, PRÉNOM, SOCIÉTÉ) ---
  let foundClient = null;

  // A. Recherche explicite d'une civilité (MME, MR, M., MONSIEUR, MADAME)
  for (const line of lines) {
    const civMatch = line.match(/^(?:MME|MR|M\.|MONSIEUR|MADAME|MLLE)\s+([A-Z\s\-]{3,40})$/i);
    if (civMatch) {
      if (!/DIRECTEUR|PRESIDENT|GENERAL/i.test(line)) {
        foundClient = civMatch[1].trim();
        break;
      }
    }
  }

  if (!foundClient) {
    // B. Recherche par libellé en excluant explicitement "VÉHICULE ASSURÉ"
    foundClient = findValue([
      "C.1", "TITULAIRE", "SOUSCRIPTEUR", "NOM DU SOUSCRIPTEUR", "NOM ET PRÉNOM", "NOM ET PRENOM", "CONDUCTEUR"
    ], { excludePrefix: ["VEHICULE", "VÉHICULE"] });
  }

  if (foundClient) {
    if (/\b(SARL|SAS|SASU|EURL|SCI|SA|SNC|ETS|GARAGE|TRANSPORT|BTP|AUTO)\b/i.test(foundClient)) {
      result.nom_societe = foundClient;
      result.prenom = '';
    } else {
      const parts = foundClient.replace(/^(M\.|MME|MLLE|MONSIEUR|MADAME)\s+/i, '').trim().split(/\s+/);
      if (parts.length === 1) {
        result.nom_societe = parts[0];
      } else if (parts.length >= 2) {
        result.nom_societe = parts[0];
        result.prenom = parts.slice(1).join(' ');
      }
    }
  }

  // --- 7. VIN (Numéro de série) ---
  const vinMatch = fullTextUpper.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  if (vinMatch) {
    result.vin = vinMatch[1];
  }

  return result;
}
