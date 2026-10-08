const fs = require('fs');

console.log('1. Updating app/dashboard/layout.js...');
let layoutContent = fs.readFileSync('app/dashboard/layout.js', 'utf8');

// Add Plus to lucide-react import
if (!layoutContent.includes('Plus,')) {
  layoutContent = layoutContent.replace(
    /import \{\s*LayoutDashboard,/,
    'import {\n  Plus,\n  LayoutDashboard,'
  );
}

// Remove referentiel-assurance from navSections
layoutContent = layoutContent.replace(
  /\s*\{\s*href:\s*'\/dashboard\/referentiel-assurance',\s*label:\s*'Référentiel Assurance',\s*icon:\s*BookOpen\s*\},?/,
  ''
);

// Add Nouveau dossier button in topbar header (before Notifications)
const targetHeader = `<div className="flex items-center gap-2 sm:gap-4">\n              {/* NOTIFICATIONS */}`;
const targetHeaderCRLF = `<div className="flex items-center gap-2 sm:gap-4">\r\n              {/* NOTIFICATIONS */}`;

const buttonCode = `<div className="flex items-center gap-2 sm:gap-4">
              {/* BOUTON NOUVEAU DOSSIER */}
              <Link
                href="/dashboard/dossiers/nouveau"
                className="flex items-center gap-2 px-3.5 py-2 bg-[#1454FF] hover:bg-[#1060ff] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#1454FF]/25 hover:shadow-lg hover:shadow-[#1454FF]/35 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus size={16} className="text-white" />
                <span className="hidden sm:inline">Nouveau dossier</span>
                <span className="sm:hidden">Nouveau</span>
              </Link>

              {/* NOTIFICATIONS */}`;

if (layoutContent.includes(targetHeader)) {
  layoutContent = layoutContent.replace(targetHeader, buttonCode);
} else if (layoutContent.includes(targetHeaderCRLF)) {
  layoutContent = layoutContent.replace(targetHeaderCRLF, buttonCode);
} else {
  // Regex replacement
  layoutContent = layoutContent.replace(
    /(<div className="flex items-center gap-2 sm:gap-4">\s*)(\{\/\* NOTIFICATIONS \*\/)/,
    `$1{/* BOUTON NOUVEAU DOSSIER */}
              <Link
                href="/dashboard/dossiers/nouveau"
                className="flex items-center gap-2 px-3.5 py-2 bg-[#1454FF] hover:bg-[#1060ff] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#1454FF]/25 hover:shadow-lg hover:shadow-[#1454FF]/35 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <Plus size={16} className="text-white" />
                <span className="hidden sm:inline">Nouveau dossier</span>
                <span className="sm:hidden">Nouveau</span>
              </Link>

              $2`
  );
}

// Add Nouveau dossier button in sidebar under Mon Garage
layoutContent = layoutContent.replace(
  /<p className="text-xs text-\[#64748B\] mt-0\.5 truncate">Espace professionnel<\/p>\s*<\/div>/g,
  `<p className="text-xs text-[#64748B] mt-0.5 truncate">Espace professionnel</p>
          </div>
          <Link
            href="/dashboard/dossiers/nouveau"
            className="mt-3 w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#1454FF] hover:bg-[#1060ff] text-white text-xs font-bold rounded-xl shadow-md shadow-[#1454FF]/25 transition-all group"
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Nouveau dossier</span>
          </Link>`
);

fs.writeFileSync('app/dashboard/layout.js', layoutContent, 'utf8');
console.log('-> app/dashboard/layout.js updated!');

console.log('2. Updating app/dashboard/actualites/page.js...');
let actContent = fs.readFileSync('app/dashboard/actualites/page.js', 'utf8');
// Remove tab switch linking to referentiel-assurance
actContent = actContent.replace(
  /\{!\* Tab switch \*!\}\s*<div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">[\s\S]*?<\/div>/,
  ''
);
// In case comment was different
actContent = actContent.replace(
  /<div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">\s*<span className="px-4 py-2 text-xs font-bold text-\[var\(--ink\)\] bg-white rounded-xl shadow-sm border border-slate-200\/60">\s*Actualités\s*<\/span>\s*<Link\s*href="\/dashboard\/referentiel-assurance"[\s\S]*?<\/Link>\s*<\/div>/,
  ''
);
fs.writeFileSync('app/dashboard/actualites/page.js', actContent, 'utf8');
console.log('-> app/dashboard/actualites/page.js updated!');

console.log('3. Updating app/dashboard/referentiel-assurance/page.js...');
const redirectContent = `"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GaragisteReferentielAssurancePage() {
  const router = useRouter();

  useEffect(() => {
    // Le référentiel d'assurance est strictement réservé au gestionnaire et super admin
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-sm font-semibold text-slate-400">
        Redirection vers le tableau de bord...
      </p>
    </div>
  );
}
`;
fs.writeFileSync('app/dashboard/referentiel-assurance/page.js', redirectContent, 'utf8');
console.log('-> app/dashboard/referentiel-assurance/page.js updated with redirect!');

console.log('ALL DONE!');
