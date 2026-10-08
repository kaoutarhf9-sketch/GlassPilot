const fs = require('fs');

let code = fs.readFileSync('app/dashboard/layout.js', 'utf8');

// Update navSections
const oldNavRegex = /const navSections = \[[\s\S]*?\];\s*const isActive/;

const newNav = `const navSections = [
    {
      title: 'COMMUNICATION',
      items: [
        { href: '/dashboard/actualites', label: 'Actualités', icon: Newspaper },
        { href: '/dashboard/referentiel-assurance', label: 'Référentiel Assurance', icon: BookOpen },
      ]
    },
    {
      title: 'FACTURATION',
      items: [
        { href: '/dashboard/facturation', label: 'Facturation', icon: FileText },
        { href: '/dashboard/devis', label: 'Devis', icon: FileSignature },
      ]
    },
    {
      title: 'GARAGE',
      items: [
        { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
        { href: '/dashboard/dossiers', label: 'Dossiers', icon: FileText },
        { href: '/dashboard/clients', label: 'Répertoire clients', icon: Users },
        { href: '/dashboard/abonnement', label: 'Jetons', icon: ShoppingBag },
      ]
    }
  ];

  const isActive`;

if (oldNavRegex.test(code)) {
  code = code.replace(oldNavRegex, newNav);
} else {
  console.error("Could not match oldNavRegex");
}

// Add page title for facturation & devis
if (!code.includes("pathname === '/dashboard/devis' && 'Devis'")) {
  code = code.replace(
    /\{pathname === '\/dashboard\/clients' && 'Clients'\}/,
    `{pathname === '/dashboard/clients' && 'Clients'}
                  {pathname === '/dashboard/facturation' && 'Facturation'}
                  {pathname === '/dashboard/devis' && 'Devis'}`
  );
}

// Make sure FileSignature is in imports
if (!code.includes('FileSignature')) {
  code = code.replace(/BookOpen,/, 'BookOpen,\n  FileSignature,');
}

fs.writeFileSync('app/dashboard/layout.js', code, 'utf8');
console.log('Successfully updated app/dashboard/layout.js with FACTURATION nav section');
