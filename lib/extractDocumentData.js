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
  // Format SIV : AB-123-CD (avec ou sans tirets, tolerant OCR : espaces, points)
  // On cherche d'abord le label puis on utilise le regex
  const immatFromLabel = findValue([
    "IMMATRICULATION", "IMMATRICULÉ", "IMMATRICULE",
    "N° D'IMMATRICULATION", "N°D'IMMATRICULATION",
    "IMMATRICULATION DU VEHICULE", "IMMATRICULATION DU VÉHICULE"
  ]);
  if (immatFromLabel) {
    // Nettoyer et rechercher un format SIV dedans
    const clean = immatFromLabel.replace(/\s+/g, '').toUpperCase();
    const sivInLabel = clean.match(/([A-Z]{2})[\s\-.]?([0-9]{3})[\s\-.]?([A-Z]{2})/);
    if (sivInLabel) {
      result.immatriculation = `${sivInLabel[1]}-${sivInLabel[2]}-${sivInLabel[3]}`;
    } else if (clean.length >= 5) {
      result.immatriculation = clean.replace(/[^A-Z0-9\-]/g, '');
    }
  }

  if (!result.immatriculation) {
    // Chercher dans toutes les lignes le pattern SIV (tolérant OCR)
    for (const line of lines) {
      const up = line.toUpperCase();
      // Match "FB-377-HV" ou "FB 377 HV" ou "FB377HV"
      const m = up.match(/\b([A-Z]{2})[\s\-.]?([0-9]{3})[\s\-.]?([A-Z]{2})\b/);
      if (m) {
        // Ignorer les faux positifs courants (codes postaux, N° contrat déjà trouvé…)
        const candidate = `${m[1]}-${m[2]}-${m[3]}`;
        result.immatriculation = candidate;
        break;
      }
    }
  }

  if (!result.immatriculation) {
    // Format FNI (ancien) : 1234 AB 75
    const fniMatch = fullTextUpper.match(/\b([0-9]{1,4})[\s\-.]+([A-Z]{2,3})[\s\-.]+([0-9]{2,3})\b/);
    if (fniMatch) {
      result.immatriculation = `${fniMatch[1]} ${fniMatch[2]} ${fniMatch[3]}`;
    }
  }

  // --- 2. MARQUE & MODÈLE ---
  const vehiculeAssureVal = findValue(["VÉHICULE ASSURÉ", "VEHICULE ASSURE"]);
  const marqueModeleCombined = findValue(["MARQUE / MODÈLE", "MARQUE / MODELE", "MARQUE/MODELE", "MARQUE ET MODÈLE"]);

  // Labels séparés (format Direct Assurance : "Marque : TOYOTA" puis "Modèle : AURIS")
  const brandFromLabel = findValue(["MARQUE :", "MARQUE:", "D.1", "MARQUE"]);
  const modelFromLabel = findValue(["MODÈLE :", "MODELE :", "MODÈLE:", "MODELE:", "D.3", "DÉNOMINATION COMMERCIALE", "DENOMINATION COMMERCIALE", "APPELLATION"]);

  const KNOWN_BRANDS = [
    'PEUGEOT', 'RENAULT', 'CITROEN', 'CITROËN', 'DACIA', 'VOLKSWAGEN', 'AUDI',
    'MERCEDES', 'BMW', 'TOYOTA', 'FORD', 'FIAT', 'NISSAN',
    'KIA', 'HYUNDAI', 'OPEL', 'SEAT', 'SKODA', 'ŠKODA', 'VOLVO', 'MINI',
    'DS', 'ALFA ROMEO', 'TESLA', 'SUZUKI', 'JEEP', 'LAND ROVER',
    'MAZDA', 'PORSCHE', 'HONDA', 'CUPRA', 'SMART', 'MITSUBISHI', 'MG'
  ];

  if (vehiculeAssureVal && vehiculeAssureVal.length > 2 && !/^(ASSUR|OBLIG)/i.test(vehiculeAssureVal)) {
    result.modele = vehiculeAssureVal;
  } else if (marqueModeleCombined) {
    result.modele = marqueModeleCombined;
  } else {
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
      const bUp = brand.toUpperCase().trim();
      const mUp = model.toUpperCase().trim();
      result.modele = bUp === mUp ? brand : `${brand} ${model}`;
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
  // Recherche d'un bloc postal : ex "95610 ERAGNY SUR OISE"
  const STREET_KEYWORDS = /\b(RUE|AV\.|AVENUE|BD|BOULEVARD|SQUARE|CHEMIN|IMPASSE|ROUTE|ALL[EÉ]E|PLACE|R[EÉ]SIDENCE|LOT\.|LOTISSEMENT|CITE|CITÉ|VOIE|PASSAGE|HAMEAU|LIEU[- ]DIT|DOMAINE|VIA|[0-9]{1,4})\b/i;
  const NAME_LINE = /^(?:M\.|MME|MR|MLLE|MONSIEUR|MADAME)\s/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cpMatch = line.match(/\b([0-9]{5})\b\s+([A-ZÀ-Ü\s\-]{2,35})/i);
    if (cpMatch) {
      // Ignorer adresses de siège assureur en bas de page
      if (/NIORT|CEDEX|LILLE|NANTES|PARIS|LYON/i.test(cpMatch[2]) && i > lines.length * 0.75) {
        continue;
      }

      result.code_postal = cpMatch[1];
      result.ville = cpMatch[2].replace(/CEDEX.*$/i, '').trim();

      // Chercher la rue dans les lignes précédentes (jusqu'à 3 lignes au-dessus)
      if (!result.adresse) {
        for (let back = 1; back <= 3 && i - back >= 0; back++) {
          const candidate = lines[i - back];
          // Ignorer les lignes de civilité/nom et les lignes trop courtes
          if (NAME_LINE.test(candidate)) continue;
          if (candidate.length < 4) continue;
          if (STREET_KEYWORDS.test(candidate)) {
            result.adresse = candidate.replace(/^(ADRESSE\s*:?)/i, '').trim();
            break;
          }
          // Accepter aussi une ligne commençant par un numéro (ex: "22 RUE DES PIRESONS")
          if (/^[0-9]{1,4}\s+\w/.test(candidate)) {
            result.adresse = candidate.trim();
            break;
          }
        }
      }
      break;
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
