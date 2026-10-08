const fs = require('fs');

let content = fs.readFileSync('app/dashboard/dossiers/nouveau/page.js', 'utf8');
const searchString = `onChange={f => setDocs(p => ({ ...p, controle_technique: f }))}\n                />`;
const addition = `\n\n                <DocUploadRow\n                  label="Bon de commande"\n                  hint="Formats acceptés : PDF, JPG, PNG (max 5MB)"\n                  file={docs.bon_commande}\n                  onChange={f => setDocs(p => ({ ...p, bon_commande: f }))}\n                />`;

if (content.includes(searchString) && !content.includes('label="Bon de commande"')) {
  content = content.replace(searchString, searchString + addition);
  fs.writeFileSync('app/dashboard/dossiers/nouveau/page.js', content, 'utf8');
  console.log('Bon de commande row added successfully!');
} else {
  // Let's check with CRLF
  const searchStringCRLF = `onChange={f => setDocs(p => ({ ...p, controle_technique: f }))}\r\n                />`;
  const additionCRLF = `\r\n\r\n                <DocUploadRow\r\n                  label="Bon de commande"\r\n                  hint="Formats acceptés : PDF, JPG, PNG (max 5MB)"\r\n                  file={docs.bon_commande}\r\n                  onChange={f => setDocs(p => ({ ...p, bon_commande: f }))}\r\n                />`;
  if (content.includes(searchStringCRLF) && !content.includes('label="Bon de commande"')) {
    content = content.replace(searchStringCRLF, searchStringCRLF + additionCRLF);
    fs.writeFileSync('app/dashboard/dossiers/nouveau/page.js', content, 'utf8');
    console.log('Bon de commande row added successfully (CRLF)!');
  } else {
    console.log('Could not find search string or already added');
  }
}
