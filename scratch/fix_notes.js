const fs = require('fs');
const files = [
  'app/dashboard/dossiers/[id]/page.js',
  'app/gestionnaire/dossiers/[id]/page.js'
];
for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  let lines = c.split('\n');
  lines = lines.filter(l => !l.includes('addSystemNote(') || !l.includes('Le statut du dossier a été changé en :'));
  fs.writeFileSync(file, lines.join('\n'));
  console.log('Fixed ' + file);
}
