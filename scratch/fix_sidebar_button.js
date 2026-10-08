const fs = require('fs');

let content = fs.readFileSync('app/dashboard/layout.js', 'utf8');

// 1. In navSections, add Nouveau dossier under GARAGE
if (!content.includes("href: '/dashboard/dossiers/nouveau'")) {
  content = content.replace(
    /\{\s*href:\s*'\/dashboard\/dossiers',\s*label:\s*'Dossiers',\s*icon:\s*FileText\s*\},/,
    `{ href: '/dashboard/dossiers', label: 'Dossiers', icon: FileText },\n        { href: '/dashboard/dossiers/nouveau', label: 'Nouveau dossier', icon: Plus, exact: true },`
  );
}

// 2. Adjust isActive to prevent both Dossiers and Nouveau dossier being active simultaneously
content = content.replace(
  /const isActive = \(href, exact = false\) => \{\s*if \(exact\) return pathname === href;\s*return pathname\.startsWith\(href\);\s*\};/,
  `const isActive = (href, exact = false) => {
    if (exact) return pathname === href;
    if (href === '/dashboard/dossiers') {
      return pathname.startsWith('/dashboard/dossiers') && pathname !== '/dashboard/dossiers/nouveau';
    }
    return pathname.startsWith(href);
  };`
);

// 3. Remove the button from the top navbar header
content = content.replace(
  /\s*\{\/\* BOUTON NOUVEAU DOSSIER \*\/\}\s*<Link\s*href="\/dashboard\/dossiers\/nouveau"[\s\S]*?<\/Link>/,
  ''
);

// 4. Remove the extra button from sidebar under Mon Garage (desktop and mobile)
content = content.replace(
  /\s*<Link\s*href="\/dashboard\/dossiers\/nouveau"\s*className="mt-3 w-full flex items-center justify-center gap-2 px-3\.5 py-2\.5 bg-\[#1454FF\][\s\S]*?<\/Link>/g,
  ''
);

fs.writeFileSync('app/dashboard/layout.js', content, 'utf8');
console.log('Layout updated successfully!');
