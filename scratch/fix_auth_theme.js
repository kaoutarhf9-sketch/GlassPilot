const fs = require('fs');

const files = [
  'app/connexion/page.js',
  'app/inscription/page.js',
  'app/mot-de-passe-oublie/page.js',
  'app/reinitialiser-mot-de-passe/page.js'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace the inline :root colors with dark theme ones
  content = content.replace(/--page-bg:\s*#ECFEFF;/g, '--page-bg: #020617;');
  content = content.replace(/--white:\s*#FFFFFF;/g, '--white: rgba(11, 19, 41, 0.45);');
  content = content.replace(/--paper:\s*#F8FAFC;/g, '--paper: #04090f;');
  content = content.replace(/--stone:\s*rgba\(10,\s*0,\s*48,\s*0\.08\);/g, '--stone: rgba(56, 189, 248, 0.15);');
  content = content.replace(/--ink:\s*#0A0030;/g, '--ink: #FFFFFF;');
  content = content.replace(/--ink-2:\s*#120052;/g, '--ink-2: #F1F5F9;');
  content = content.replace(/--muted:\s*#64748B;/g, '--muted: #94a3b8;');
  
  // Specific hardcoded nav colors
  content = content.replace(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.85\);/g, 'background: rgba(2, 6, 23, 0.85);');
  
  // Button btn-main
  content = content.replace(/background:\s*#3B0FAA;/g, 'background: #38bdf8;');
  content = content.replace(/box-shadow:\s*0 6px 28px rgba\(56,189,248,\.35\);/g, 'box-shadow: 0 6px 28px rgba(56,189,248,.15);');
  
  fs.writeFileSync(file, content);
  console.log('Fixed ' + file);
});
