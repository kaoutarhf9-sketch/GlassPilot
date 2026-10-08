const fs = require('fs');
const filePath = 'app/dashboard/dossiers/[id]/page.js';
let content = fs.readFileSync(filePath, 'utf8');

const target1 = "alert('Erreur lors de l''envoi du message');";
const replace1 = 'alert("Erreur lors de l\'envoi du message");';

const target2 = "alert('Impossible d''envoyer le fichier : ' + err.message);";
const replace2 = 'alert("Impossible d\'envoyer le fichier : " + err.message);';

if (content.includes(target1)) {
  content = content.replace(target1, replace1);
  console.log('Fixed target 1');
} else {
  console.log('Target 1 not found');
}

if (content.includes(target2)) {
  content = content.replace(target2, replace2);
  console.log('Fixed target 2');
} else {
  console.log('Target 2 not found');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
