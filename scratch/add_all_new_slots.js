const fs = require('fs');

const NEW_SLOTS_CODE = `const DOCUMENT_SLOTS = [
  { key: 'bon_commande', label: 'Bon de commande', patterns: ['bon_commande', 'bon_de_commande', 'commande', 'bdc'] },
  { key: 'facture', label: 'Facture / Devis', patterns: ['facture', 'devis'] },
  { key: 'carte_grise', label: 'Carte Grise', patterns: ['carte_grise'] },
  { key: 'assurance', label: 'Assurance', patterns: ['assurance', 'attestation'] },
  { key: 'controle_technique', label: 'Contrôle Technique', patterns: ['controle_technique', 'ct'] },
  { key: 'cession', label: 'Cession de créance', patterns: ['cession', 'documents_complets', 'signature'] },
  { key: 'avis_depot', label: 'Avis de dépôt', patterns: ['avis_depot', 'depot'] },
  { key: 'avis_reception', label: 'Avis de réception', patterns: ['avis_reception', 'reception', 'ar_'] },
  { key: 'rapport_expertise', label: 'Rapport d’expertise', patterns: ['rapport_expertise', 'expertise'] },
  { key: 'accord_prise_en_charge', label: 'Accord prise en charge', patterns: ['accord_prise_en_charge', 'accord', 'pec', 'prise_en_charge'] },
  { key: 'declaration', label: 'Déclaration', patterns: ['declaration'] },
  { key: 'mail_assurance', label: 'Mail assurance', patterns: ['mail_assurance', 'mail'] },
  { key: 'photo_vehicule', label: 'Photo du véhicule', patterns: ['photo_vehicule', 'vehicule'] },
  { key: 'photo_impact', label: "Photo de l'impact", patterns: ['photo_impact', 'impact'] },
  { key: 'photo_avant', label: 'Photo avant pose', patterns: ['photo_avant', 'avant_pose'] },
  { key: 'photo_apres', label: 'Photo après pose', patterns: ['photo_apres', 'apres_pose'] },
  { key: 'autre', label: 'Autre', patterns: ['autre', 'divers'] },
];`;

const PREFIX_DETECTION = `        let prefix = 'autre';
        const lowerName = file.name.toLowerCase();
        if (lowerName.includes('commande') || lowerName.includes('bdc')) {
          prefix = 'bon_commande';
        } else if (lowerName.includes('depot')) {
          prefix = 'avis_depot';
        } else if (lowerName.includes('reception') || lowerName.includes('avis_rec')) {
          prefix = 'avis_reception';
        } else if (lowerName.includes('expertise') || lowerName.includes('rapport')) {
          prefix = 'rapport_expertise';
        } else if (lowerName.includes('accord') || lowerName.includes('pec')) {
          prefix = 'accord_prise_en_charge';
        } else if (lowerName.includes('declaration')) {
          prefix = 'declaration';
        } else if (lowerName.includes('mail')) {
          prefix = 'mail_assurance';
        } else if (lowerName.includes('grise')) {
          prefix = 'carte_grise';
        } else if (lowerName.includes('facture') || lowerName.includes('devis')) {
          prefix = 'facture';
        } else if (lowerName.includes('attestation') || lowerName.includes('assurance')) {
          prefix = 'assurance';
        } else if (lowerName.includes('controle') || lowerName.includes('ct')) {
          prefix = 'controle_technique';
        } else if (lowerName.includes('cession') || lowerName.includes('signature')) {
          prefix = 'cession';
        } else if (lowerName.includes('impact')) {
          prefix = 'photo_impact';
        } else if (lowerName.includes('avant')) {
          prefix = 'photo_avant';
        } else if (lowerName.includes('apres')) {
          prefix = 'photo_apres';
        } else if (lowerName.includes('vehicule')) {
          prefix = 'photo_vehicule';
        } else if (file.type.includes('pdf')) {
          prefix = 'autre';
        }`;

// 1. Update app/dashboard/dossiers/[id]/page.js
console.log('1. Updating Garagiste dossier detail...');
let garagistePage = fs.readFileSync('app/dashboard/dossiers/[id]/page.js', 'utf8');
garagistePage = garagistePage.replace(/const DOCUMENT_SLOTS = \[[\s\S]*?\];/, NEW_SLOTS_CODE);
garagistePage = garagistePage.replace(
  /let prefix = 'photo_vehicule';[\s\S]*?else if \(file\.name\.toLowerCase\(\)\.includes\('impact'\)\) \{\s*prefix = 'photo_impact';\s*\}/,
  PREFIX_DETECTION
);
garagistePage = garagistePage.replace(
  /'Ajouter le document'/g,
  "'Cliquer ou déposer ici'"
);
fs.writeFileSync('app/dashboard/dossiers/[id]/page.js', garagistePage, 'utf8');
console.log('-> Garagiste page updated!');

// 2. Update app/gestionnaire/dossiers/[id]/page.js
console.log('2. Updating Gestionnaire dossier detail...');
let gestionnairePage = fs.readFileSync('app/gestionnaire/dossiers/[id]/page.js', 'utf8');
gestionnairePage = gestionnairePage.replace(/const DOCUMENT_SLOTS = \[[\s\S]*?\];/, NEW_SLOTS_CODE);
gestionnairePage = gestionnairePage.replace(
  /let prefix = 'photo_vehicule';[\s\S]*?else if \(file\.name\.toLowerCase\(\)\.includes\('impact'\)\) \{\s*prefix = 'photo_impact';\s*\}/,
  PREFIX_DETECTION
);
gestionnairePage = gestionnairePage.replace(
  /'Ajouter le document'/g,
  "'Cliquer ou déposer ici'"
);
fs.writeFileSync('app/gestionnaire/dossiers/[id]/page.js', gestionnairePage, 'utf8');
console.log('-> Gestionnaire page updated!');

// 3. Update app/api/gestionnaire/send-clearbus/route.js
console.log('3. Updating ClearBUS route...');
let clearbusRoute = fs.readFileSync('app/api/gestionnaire/send-clearbus/route.js', 'utf8');
const clearbusLabels = `if (lowerName.includes('carte_grise')) friendlyLabel = \`Carte_Grise_\${immat.replace(/\\s+/g, '_')}.pdf\`;
          else if (lowerName.includes('attestation') || lowerName.includes('assurance')) friendlyLabel = \`Attestation_Assurance_\${immat.replace(/\\s+/g, '_')}.pdf\`;
          else if (lowerName.includes('bon_commande') || lowerName.includes('commande') || lowerName.includes('bdc')) friendlyLabel = \`Bon_De_Commande_\${immat.replace(/\\s+/g, '_')}.pdf\`;
          else if (lowerName.includes('avis_depot') || lowerName.includes('depot')) friendlyLabel = \`Avis_De_Depot_\${immat.replace(/\\s+/g, '_')}.pdf\`;
          else if (lowerName.includes('avis_reception') || lowerName.includes('reception')) friendlyLabel = \`Avis_De_Reception_\${immat.replace(/\\s+/g, '_')}.pdf\`;
          else if (lowerName.includes('rapport_expertise') || lowerName.includes('expertise')) friendlyLabel = \`Rapport_Expertise_\${immat.replace(/\\s+/g, '_')}.pdf\`;
          else if (lowerName.includes('accord_prise_en_charge') || lowerName.includes('accord') || lowerName.includes('pec')) friendlyLabel = \`Accord_Prise_En_Charge_\${immat.replace(/\\s+/g, '_')}.pdf\`;
          else if (lowerName.includes('declaration')) friendlyLabel = \`Declaration_\${immat.replace(/\\s+/g, '_')}.pdf\`;
          else if (lowerName.includes('mail_assurance') || lowerName.includes('mail')) friendlyLabel = \`Mail_Assurance_\${immat.replace(/\\s+/g, '_')}.pdf\`;
          else if (lowerName.includes('autre')) friendlyLabel = \`Autre_Document_\${immat.replace(/\\s+/g, '_')}.pdf\`;
          else if (lowerName.includes('photo_vehicule') || lowerName.includes('vehicule')) friendlyLabel = \`Photo_Vehicule_\${immat.replace(/\\s+/g, '_')}.jpg\`;
          else if (lowerName.includes('photo_impact') || lowerName.includes('impact')) friendlyLabel = \`Photo_Impact_\${immat.replace(/\\s+/g, '_')}.jpg\`;
          else if (lowerName.includes('cession')) friendlyLabel = \`Contrat_Signe_Cession_\${immat.replace(/\\s+/g, '_')}.pdf\`;`;

clearbusRoute = clearbusRoute.replace(
  /if \(lowerName\.includes\('carte_grise'\)\) friendlyLabel = `Carte_Grise_\$\{immat\.replace\(\/\\s\+\/g, '_'\)\}\.pdf`;[\s\S]*?else if \(lowerName\.includes\('cession'\)\) friendlyLabel = `Contrat_Signe_Cession_\$\{immat\.replace\(\/\\s\+\/g, '_'\)\}\.pdf`;/,
  clearbusLabels
);
fs.writeFileSync('app/api/gestionnaire/send-clearbus/route.js', clearbusRoute, 'utf8');
console.log('-> ClearBUS route updated!');

console.log('ALL UPDATES COMPLETE!');
