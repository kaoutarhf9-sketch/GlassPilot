const { extractDocumentData } = require('../lib/extractDocumentData.js');

const maifPDFText = `
MAIF
Societe d'assurance mutuelle
CS 90000 - 79038 Niort cedex 9

Contrat renouvelable par tacite reconduction

N° de sociétaire : 3299020A
NAGALE KONTE

Le 03/09/2026

MME NAGALE KONTE
12 SQUARE JULES CESAR
95120 ERMONT

Attestation ASSURANCE AUTO/MOTO
Valable du 01/01/2026 au 31/12/2026

Véhicule assuré
CITROEN GRAND C4 PICASSO 1.6 BLUEHDI 100 CH BUSINESS
Immatriculé : DR-698-QX

Formule souscrite
Plénitude
`;

console.log('--- TEST EXTRACTION MAIF ---');
console.log(JSON.stringify(extractDocumentData(maifPDFText), null, 2));
