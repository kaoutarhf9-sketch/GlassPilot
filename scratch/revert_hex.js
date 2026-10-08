const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  { regex: /bg-\[#E6FAFC\]/g, replacement: 'bg-[var(--page-bg)]' },
  { regex: /border-\[#18CDEC\]/g, replacement: 'border-[var(--stone)]' },
  { regex: /text-\[#0A0030\]/g, replacement: 'text-[var(--ink)]' },
  { regex: /text-\[#3B0FAA\]/g, replacement: 'text-[var(--blue)]' },
  { regex: /text-\[#18CDEC\]/g, replacement: 'text-[var(--blue)]' },
  { regex: /bg-\[#18CDEC\]/g, replacement: 'bg-[var(--blue)]' },
  { regex: /bg-\[#0A0030\]/g, replacement: 'bg-[var(--page-bg)]' },
  { regex: /bg-\[var\(--white\)\]\/40/g, replacement: 'bg-[var(--white)]' }
];

walkDir('app', (filePath) => {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed ' + filePath);
  }
});
