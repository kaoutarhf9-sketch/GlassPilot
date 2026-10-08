const fs = require('fs');
const p = 'c:\\mon-app-garage\\app\\gestionnaire\\garages\\page.js';
let content = fs.readFileSync(p, 'utf8');

const target = `      if (!res.ok) {
        throw new Error("Erreur lors de la récupération des garages");
      }`;
      
const replacement = `      if (!res.ok) {
        const text = await res.text();
        console.error("Erreur API garages:", res.status, text);
        throw new Error(\`Erreur lors de la récupération des garages (Statut \${res.status}): \${text}\`);
      }`;

content = content.replace(target, replacement);

fs.writeFileSync(p, content);
console.log("Done");
