const fs = require('fs');
const path = require('path');

function checkDir(dir) {
  for (const f of fs.readdirSync(dir)) {
    if (['node_modules', '.next', '.git'].includes(f)) continue;
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      checkDir(full);
    } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
      const lines = fs.readFileSync(full, 'utf8').split('\n');
      lines.forEach((l, i) => {
        if (/[a-zA-Z]''[a-zA-Z]/.test(l)) {
          console.log(`Corrupted apostrophe at ${full}:${i + 1}: ${l.trim()}`);
        }
      });
    }
  }
}

checkDir('.');
console.log('Check finished.');
