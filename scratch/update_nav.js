const fs = require('fs');
let content = fs.readFileSync('app/dashboard/layout.js', 'utf8');
content = content.replace(
  "{ href: '/dashboard/clients', label: 'Clients', icon: Users }",
  "{ href: '/dashboard/clients', label: 'Répertoire clients', icon: Users }"
);
fs.writeFileSync('app/dashboard/layout.js', content, 'utf8');
console.log('Updated app/dashboard/layout.js successfully!');
