const fs = require('fs');
let content = fs.readFileSync('app/dashboard/dossiers/[id]/page.js', 'utf8');

// The corruption pattern that replaced apostrophes
const corruptPattern = /{client\?\.adresse \? \(client\?\.code_postal \? \${client\.adresse},\s*: client\.adresse\) : \\'Non renseignée\\'}/g;

let count = 0;
content = content.replace(corruptPattern, (match) => {
  count++;
  return "'";
});

console.log(`Fixed ${count} corrupted apostrophes`);
fs.writeFileSync('app/dashboard/dossiers/[id]/page.js', content);
console.log('Done!');
