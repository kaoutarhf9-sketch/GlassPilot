const fs = require('fs');

console.log('1. Updating Garagiste dossier detail...');
let f1 = fs.readFileSync('app/dashboard/dossiers/[id]/page.js', 'utf8');
if (!f1.includes("key: 'bon_commande'")) {
  f1 = f1.replace(
    /const DOCUMENT_SLOTS = \[/,
    "const DOCUMENT_SLOTS = [\n  { key: 'bon_commande', label: 'Bon de commande', patterns: ['bon_commande', 'bon_de_commande', 'commande', 'bdc'] },"
  );
  f1 = f1.replace(
    /if \(file\.type\.includes\('pdf'\)\) \{/,
    "if (file.name.toLowerCase().includes('commande') || file.name.toLowerCase().includes('bdc')) {\n          prefix = 'bon_commande';\n        } else if (file.type.includes('pdf')) {"
  );
  fs.writeFileSync('app/dashboard/dossiers/[id]/page.js', f1, 'utf8');
  console.log('-> Garagiste detail updated successfully!');
} else {
  console.log('-> Garagiste already updated.');
}

console.log('2. Updating Gestionnaire dossier detail...');
let f2 = fs.readFileSync('app/gestionnaire/dossiers/[id]/page.js', 'utf8');
if (!f2.includes("key: 'bon_commande'")) {
  f2 = f2.replace(
    /const DOCUMENT_SLOTS = \[/,
    "const DOCUMENT_SLOTS = [\n  { key: 'bon_commande', label: 'Bon de commande', patterns: ['bon_commande', 'bon_de_commande', 'commande', 'bdc'] },"
  );
  f2 = f2.replace(
    /if \(file\.type\.includes\('pdf'\)\) \{/,
    "if (file.name.toLowerCase().includes('commande') || file.name.toLowerCase().includes('bdc')) {\n          prefix = 'bon_commande';\n        } else if (file.type.includes('pdf')) {"
  );
  fs.writeFileSync('app/gestionnaire/dossiers/[id]/page.js', f2, 'utf8');
  console.log('-> Gestionnaire detail updated successfully!');
} else {
  console.log('-> Gestionnaire already updated.');
}

console.log('3. Updating Nouveau dossier...');
let f3 = fs.readFileSync('app/dashboard/dossiers/nouveau/page.js', 'utf8');
if (!f3.includes("bon_commande: null")) {
  f3 = f3.replace(
    /carte_grise: null,/,
    "carte_grise: null,\n    bon_commande: null,"
  );
  // Add DocUploadRow for bon de commande under Carte Grise or Attestation
  const bonCommandeRow = `
                <DocUploadRow
                  label="Bon de commande"
                  hint="Formats acceptés : PDF, JPG, PNG (max 5MB)"
                  file={docs.bon_commande}
                  onChange={f => setDocs(p => ({ ...p, bon_commande: f }))}
                />
                <input id="native_camera_fallback_bon_commande" type="file" className="hidden" accept="image/*,.pdf" capture="environment" onChange={e => handleDocFile(e.target.files[0], 'bon_commande')} />
`;
  f3 = f3.replace(
    /<input id="native_camera_fallback_carte_grise"[^>]*\/>/,
    (match) => match + '\n' + bonCommandeRow
  );
  fs.writeFileSync('app/dashboard/dossiers/nouveau/page.js', f3, 'utf8');
  console.log('-> Nouveau dossier updated successfully!');
} else {
  console.log('-> Nouveau dossier already updated.');
}

console.log('4. Updating Clearbus route...');
let f4 = fs.readFileSync('app/api/gestionnaire/send-clearbus/route.js', 'utf8');
if (!f4.includes("lowerName.includes('bon_commande')")) {
  f4 = f4.replace(
    /else if \(lowerName\.includes\('photo_vehicule'\)/,
    "else if (lowerName.includes('bon_commande') || lowerName.includes('commande') || lowerName.includes('bdc')) friendlyLabel = `Bon_De_Commande_${immat.replace(/\\s+/g, '_')}.pdf`;\n          else if (lowerName.includes('photo_vehicule')"
  );
  fs.writeFileSync('app/api/gestionnaire/send-clearbus/route.js', f4, 'utf8');
  console.log('-> Clearbus route updated successfully!');
} else {
  console.log('-> Clearbus route already updated.');
}

console.log('ALL DONE!');
