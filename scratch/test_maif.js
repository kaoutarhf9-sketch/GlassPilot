import { extractDocumentData } from '../lib/extractDocumentData.js';

const text = `
Contrat renouvelable par tacite reconduction
au 1er janvier prochain
N° de sociétaire : 3299020A
NAGALE KONTE
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
Pascal DEMURGER
Directeur général MAIF
`;

console.log('EXTRACTED DATA:', extractDocumentData(text));
