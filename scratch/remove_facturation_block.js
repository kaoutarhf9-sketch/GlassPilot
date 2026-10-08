const fs = require('fs');

let content = fs.readFileSync('app/dashboard/dossiers/[id]/page.js', 'utf8');

// 1. Remove mobile tab
content = content.replace(
  /\s*\{\s*id:\s*'facturation',\s*label:\s*'Facture',\s*icon:\s*ReceiptEuro\s*\},?/,
  ''
);

// 2. Remove the entire FACTURATION block
const facturationBlockRegex = /\s*\{\/\* FACTURATION \*\/\}[\s\S]*?\{\/\* PIÈCES JOINTES \*\/\}/;

if (facturationBlockRegex.test(content)) {
  content = content.replace(facturationBlockRegex, '\n\n            {/* PIÈCES JOINTES */}');
  fs.writeFileSync('app/dashboard/dossiers/[id]/page.js', content, 'utf8');
  console.log('Facturation block removed successfully!');
} else {
  console.error('Facturation block not matched!');
}
