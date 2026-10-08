// Test d'extraction sur un texte simulant ce que Tesseract lit depuis l'attestation Direct Assurance
import { extractDocumentData } from '../lib/extractDocumentData.js';

const simulatedOCR = `AUTO
Pour nous contacter
Gestion de votre contrat dans votre Espace Perso
en vous connectant avec votre adresse e-mail
et au 09 70 80 80 06 (n* non surtaxé)
En cas de sinistre dans votre Espace Perso
ou appli Mobile Direct Assurance
et au 09 70 80 80 01 (n* non surtaxé)
Dépannage 01 55 92 27 20 24h/24, 7 j/7
Contrat n° 100138580615

M. ERWAN KAMDJOM
22 RUE DES PIRESONS
95610 ERAGNY SUR OISE

Suresnes, le 07/09/2026

ATTESTATION D'ASSURANCE

Nous confirmons que la voiture ci-dessous est assurée du 14/07/2026 à 0h00 jusqu'au 12/07/2027 inclus.

Marque : TOYOTA
Modèle : AURIS
Appellation : 136H COLLECTION
Immatriculation : FB377HV

Nous vous remercions de votre confiance.

Pour l'assureur,

Henry de Courtois
Directeur Général d'Avanssur

Direct Assurance 40 rue Taitbout 75009 Paris`;

const result = extractDocumentData(simulatedOCR);
console.log('Résultat extraction:');
console.log(JSON.stringify(result, null, 2));

console.log('\nVérifications:');
console.log('nom_societe:', result.nom_societe || '❌ MANQUANT');
console.log('prenom:', result.prenom || '❌ MANQUANT');
console.log('adresse:', result.adresse || '❌ MANQUANT');
console.log('code_postal:', result.code_postal || '❌ MANQUANT');
console.log('ville:', result.ville || '❌ MANQUANT');
console.log('nom_assurance:', result.nom_assurance || '❌ MANQUANT');
console.log('num_contrat:', result.num_contrat || '❌ MANQUANT');
console.log('immatriculation:', result.immatriculation || '❌ MANQUANT');
console.log('modele:', result.modele || '❌ MANQUANT');
