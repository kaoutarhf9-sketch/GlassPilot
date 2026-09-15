const text = `ATTESTATION D'ASSURANCE - DOCUMENT SPECIMEN
Ceci est un document de TEST genere pour verification OCR. Aucune valeur legale.
Compagnie d'assurance
ASSUR-TEST COMPAGNIE
Souscripteur (Nom Prénom)
MARTIN Jean
Adresse
12 Rue des Tests, 75001 Paris
Immatriculation du véhicule
AA-123-BB
N° de série (VIN)
VF3TESTVIN0001234
Date d'effet du contrat
01/01/2026
Type de garantie
TOUS RISQUES
N° de contrat
TST-2026-004821
Date de naissance
14/03/1985
Marque / Modèle
PEUGEOT 208
Date d'échéance
31/12/2026`;

const textUpper = text.toUpperCase();

// 1. Immatriculation (must be uppercase in original text, or we just use textUpper)
// We look for 2 chars, 3 chars, 2 chars. Must contain at least one number to avoid matching words.
const immatch = textUpper.match(/(?:^|\s)([A-Z80]{2})[-\s]*([0-9OIl]{2,3})[-\s]*([A-Z80]{2})(?:\s|$)/);
let immat = 'rien';
if (immatch) {
  let part1 = immatch[1].replace(/8/g, 'B').replace(/0/g, 'O');
  let part2 = immatch[2].replace(/O/g, '0').replace(/I/g, '1').replace(/L/g, '1');
  let part3 = immatch[3].replace(/8/g, 'B').replace(/0/g, 'O');
  // Check if it's a valid format (part2 must have digits)
  if (/\d/.test(part2)) {
    immat = `${part1}-${part2}-${part3}`;
  }
}
console.log('Immat:', immat);

// 2. Contrat
// Look for CONTRAT or POLICE, then within 40 chars find a string with at least one digit and length > 5, not containing slashes.
const contratMatch = textUpper.match(/(?:CONTRAT|POLICE)[\s\S]{0,40}?\b([A-Z0-9-]*\d[A-Z0-9-]{4,24})\b/);
console.log('Contrat:', contratMatch ? contratMatch[1] : 'rien');

// 3. Modèle
let modele = 'rien';
const marques = ['PEUGEOT', 'RENAULT', 'CITROEN', 'DACIA', 'VOLKSWAGEN', 'AUDI', 'MERCEDES', 'BMW', 'TOYOTA', 'FORD', 'FIAT', 'NISSAN', 'KIA', 'HYUNDAI'];
for (const marque of marques) {
  if (textUpper.includes(marque)) {
    modele = marque;
    const regex = new RegExp(`${marque}\\s+([\\w\\d]+)`);
    const m = textUpper.match(regex);
    if (m && m[1]) {
       modele = `${marque} ${m[1]}`;
    }
    break;
  }
}
console.log('Modele:', modele);

// 4. Assurance
let assurance = 'rien';
const assurances = ['AXA', 'ALLIANZ', 'MACIF', 'MAAF', 'MMA', 'GROUPAMA', 'GMF', 'PACIFICA', 'MATMUT', 'DIRECT ASSURANCE', 'CREDIT MUTUEL', 'CREDIT AGRICOLE', 'BRED', 'ASSUR-TEST'];
for (const ass of assurances) {
  const regex = new RegExp(`\\b${ass}\\b`);
  if (regex.test(textUpper)) {
    assurance = ass;
    break;
  }
}
console.log('Assurance:', assurance);
