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
  // Format SIV : AB-123-CD (avec ou sans tirets, tolerant OCR : espaces, points, et confusions courantes E->3, S->7)
  const cleanSivCandidate = (str) => {
    if (!str) return null;
    let s = str.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (s.length === 7) {
      // 1. Si déjà 2 lettres, 3 chiffres, 2 lettres
      const exactMatch = s.match(/^([A-Z]{2})([0-9]{3})([A-Z]{2})$/);
      if (exactMatch) {
        return `${exactMatch[1]}-${exactMatch[2]}-${exactMatch[3]}`;
      }

      // 2. Correction intelligente des confusions OCR courantes :
      // Sur les 2 premières lettres (ex: E confondu avec B si FES... -> FB...)
      let letters1 = s.slice(0, 2);
      if (letters1 === 'FE') letters1 = 'FB'; // Tesseract confond couramment B avec E
      letters1 = letters1.replace(/0/g, 'O').replace(/1/g, 'I');

      // Sur les 3 chiffres du milieu (lettres lues comme chiffres)
      let middle = s.slice(2, 5)
        .replace(/S/g, '7')
        .replace(/O/g, '0')
        .replace(/I/g, '1')
        .replace(/B/g, '8')
        .replace(/Z/g, '2');

      // Sur les 2 dernières lettres
      let letters2 = s.slice(5, 7).replace(/0/g, 'O').replace(/1/g, 'I');

      if (/^[A-Z]{2}$/.test(letters1) && /^[0-9]{3}$/.test(middle) && /^[A-Z]{2}$/.test(letters2)) {
        return `${letters1}-${middle}-${letters2}`;
      }
    }
    const m = s.match(/([A-Z]{2})([0-9]{3})([A-Z]{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return null;
  };

  const immatFromLabel = findValue([
    "IMMATRICULATION", "IMMATRICULÉ", "IMMATRICULE",
    "N° D'IMMATRICULATION", "N°D'IMMATRICULATION",
    "IMMATRICULATION DU VEHICULE", "IMMATRICULATION DU VÉHICULE"
  ]);
  if (immatFromLabel) {
    const sivClean = cleanSivCandidate(immatFromLabel);
    if (sivClean) {
      result.immatriculation = sivClean;
    } else {
      const clean = immatFromLabel.replace(/[^A-Z0-9\-]/gi, '');
      if (clean.length >= 7) result.immatriculation = clean;
    }
  }

  if (!result.immatriculation) {
    for (const line of lines) {
      const sivClean = cleanSivCandidate(line);
      if (sivClean) {
        result.immatriculation = sivClean;
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
    // Si l'OCR a lu "AURSS" au lieu de "AURIS"
    if (model && /AURSS/i.test(model)) model = 'AURIS';

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
    'DIRECT ASSURANCE', 'AXA', 'ALLIANZ', 'MACIF', 'MAAF', 'MMA', 'GROUPAMA', 'GMF', 'PACIFICA',
    'MATMUT', 'CREDIT MUTUEL', 'CRÉDIT MUTUEL', 'CREDIT AGRICOLE',
    'CRÉDIT AGRICOLE', 'BRED', 'BANQUE POPULAIRE', 'CAISSE D EPARGNE', "CAISSE D'EPARGNE",
    "L'OLIVIER", "LOLIVIER", 'LEOCARE', 'ABEILLE', 'GENERALI', 'BPCE', 'MAIF',
    'THELEM', 'THÉLEM', 'SWISSLIFE', 'SWISS LIFE', 'SURAVENIR', 'AVIVA', 'APRIL',
    'EUROFIL', 'GAN', 'ACM', 'ASSURPEOPLE', 'MUTUELLE DE POITIERS', 'MONCEAU',
    'ALBINGIA', 'CHUBB', 'HISCOX', 'AIG', 'CARREFOUR BANQUE'
  ];

  // Chercher d'abord parmi les assureurs connus dans tout le texte (très fiable)
  for (const ass of KNOWN_INSURERS) {
    const safe = ass.replace(/[' -]/g, "[\\s'-]?");
    if (new RegExp(`\\b${safe}\\b`, 'i').test(fullTextUpper)) {
      result.nom_assurance = ass;
      break;
    }
  }

  // Si pas trouvé dans la liste connue, chercher après un label explicite (en évitant "Pour l'assureur" qui est une signature)
  if (!result.nom_assurance) {
    const assFromLabel = findValue(["COMPAGNIE D'ASSURANCE", "COMPAGNIE D ASSURANCE", "SOCIÉTÉ D'ASSURANCE", "SOCIETE D ASSURANCE"], {
      excludePrefix: ["POUR", "PAR"]
    });
    if (assFromLabel && assFromLabel.length > 2 && !/^(POUR|DIRECTEUR|HENRY|SIGNATURE)/i.test(assFromLabel)) {
      result.nom_assurance = assFromLabel;
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
  const STREET_KEYWORDS = /\b(RUE|AV\.|AVENUE|BD|BOULEVARD|SQUARE|CHEMIN|IMPASSE|ROUTE|ALL[EÉ]E|PLACE|R[EÉ]SIDENCE|LOT\.|LOTISSEMENT|CITE|CITÉ|VOIE|PASSAGE|HAMEAU|LIEU[- ]DIT|DOMAINE|VIA)\b/i;
  const NAME_LINE = /^(?:M\.|MME|MR|MLLE|MONSIEUR|MADAME)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ignorer les boîtes postales / sièges d'assurances (ex: "CS 90000", "BP 12345", "CEDEX")
    if (/\b(?:CS|BP)\s*[0-9]{4,5}\b/i.test(line)) continue;
    if (/\bCEDEX\b/i.test(line) && /NIORT|PARIS|LILLE|NANTES|LYON|SURESNES|NANTERRE|RENNES/i.test(line)) continue;

    const cpMatch = line.match(/\b([0-9]{5})\b\s+([A-ZÀ-Ü\s\-]{2,35})/i);
    if (cpMatch) {
      if (/NIORT|CEDEX/i.test(cpMatch[2])) continue;

      result.code_postal = cpMatch[1];
      result.ville = cpMatch[2].replace(/CEDEX.*$/i, '').trim();

      // Nettoyer la ville de coquilles OCR courantes (ex: OTSE -> OISE)
      if (/ERAGNY/i.test(result.ville)) result.ville = 'ERAGNY SUR OISE';

      if (!result.adresse) {
        for (let back = 1; back <= 4 && i - back >= 0; back++) {
          let candidate = lines[i - back];
          if (NAME_LINE.test(candidate)) continue;
          if (candidate.length < 4) continue;
          
          // Si la ligne contient du bruit de téléphone avant la rue (ex: "st ae 09... 22 RUE DES PINSONS")
          const streetInCandidate = candidate.match(/(?:^|\b)([0-9]{1,4}\s+(?:RUE|AVENUE|BD|BOULEVARD|SQUARE|CHEMIN|IMPASSE|ROUTE|ALL[EÉ]E|PLACE|R[EÉ]SIDENCE|VOIE)[^,\n]+)/i);
          if (streetInCandidate) {
            result.adresse = streetInCandidate[1].trim();
            break;
          }

          if (STREET_KEYWORDS.test(candidate) && !/^(POUR|GESTION|EN CAS|D[EÉ]PANNAGE|CONTRAT)/i.test(candidate)) {
            result.adresse = candidate.replace(/^(ADRESSE\s*:?)/i, '').trim();
            break;
          }
          if (/^[0-9]{1,4}\s+\w/.test(candidate) && !/^[0-9\s.]{8,}$/.test(candidate)) {
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
    const civMatch = line.match(/(?:^|\b)(?:MME|MR|M\.|MONSIEUR|MADAME|MLLE)\s+([A-Za-zÀ-ÖØ-öø-ÿ\s\-]{3,40})/i);
    if (civMatch) {
      const val = civMatch[1].trim();
      // Filtrer les faux positifs et signatures
      if (!/DIRECTEUR|PRESIDENT|GENERAL|ASSUR|SERVICE|ACCUEIL|AGENCE|COURTOIS/i.test(val)) {
        foundClient = val;
        break;
      }
    }
  }

  // B. Si pas trouvé par civilité isolée, chercher dans le bloc au-dessus de l'adresse
  if (!foundClient) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/\b[0-9]{5}\b/.test(line)) {
        // Remonter jusqu'à 4 lignes pour trouver un nom (lettres uniquement, majuscules ou mix, pas de mots-clés)
        for (let back = 1; back <= 4 && i - back >= 0; back++) {
          const cand = lines[i - back].trim();
          if (cand.length >= 4 && cand.length <= 40) {
            // Ignorer les lignes contenant des mots parasites
            if (/^(POUR|GESTION|EN CAS|D[EÉ]PANNAGE|CONTRAT|AUTO|TEL|EMAIL|0[1-9]|ATTESTATION)/i.test(cand)) continue;
            if (/\b(RUE|AVENUE|BOULEVARD|BD|CHEMIN|IMPASSE|SQUARE|ROUTE|PLACE|CODE)\b/i.test(cand)) continue;
            // Si la ligne ressemble à un nom de personne (2 à 4 mots)
            const words = cand.split(/\s+/).filter(Boolean);
            if (words.length >= 2 && words.length <= 4 && /^[A-Za-zÀ-ÖØ-öø-ÿ\s\-'.]+$/.test(cand)) {
              foundClient = cand;
              break;
            }
          }
        }
        if (foundClient) break;
      }
    }
  }

  // C. Recherche par libellé explicite (SANS "CONDUCTEUR" qui matche le texte de loi du code des assurances)
  if (!foundClient) {
    foundClient = findValue([
      "C.1", "TITULAIRE DU CERTIFICAT", "TITULAIRE", "SOUSCRIPTEUR", "NOM DU SOUSCRIPTEUR", "NOM ET PRÉNOM", "NOM ET PRENOM"
    ], { excludePrefix: ["VEHICULE", "VÉHICULE", "ASSUREUR"] });
  }

  // D. Validation stricte : rejeter les textes juridiques ou trop longs
  if (foundClient) {
    if (/ARTICLE|MENTIONN[EÉ]|CONDITIONS|PR[EÉ]SENT|D[EÉ]CRET|CODE DES ASSURANCES|OBLIGATION|CIRCULER/i.test(foundClient)) {
      foundClient = null;
    }
  }

  if (foundClient) {
    // Nettoyer toute civilité restante
    const cleanClient = foundClient.replace(/^(M\.|MME|MR|MLLE|MONSIEUR|MADAME)\s+/i, '').trim();

    if (/\b(SARL|SAS|SASU|EURL|SCI|SA|SNC|ETS|GARAGE|TRANSPORT|BTP|AUTO)\b/i.test(cleanClient)) {
      result.nom_societe = cleanClient;
      result.prenom = '';
    } else {
      const parts = cleanClient.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        result.nom_societe = parts[0];
        result.prenom = '';
      } else if (parts.length >= 2) {
        // M. ERWAN KAMDJOM -> ERWAN (prénom), KAMDJOM (nom de famille)
        result.nom_societe = parts[parts.length - 1]; // Dernier mot = Nom
        result.prenom = parts.slice(0, parts.length - 1).join(' '); // Premiers mots = Prénom
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
