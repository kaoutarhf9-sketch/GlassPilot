const fs = require('fs');

const p = 'c:\\mon-app-garage\\app\\gestionnaire\\dossiers\\page.js';
let content = fs.readFileSync(p, 'utf8');

// Replace card container
content = content.replace(
  /className="bg-\[var\(--white\)] rounded-2xl border border-\[var\(--stone\)] shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col"/g,
  'className="bg-[#0D1B2A] rounded-2xl border border-[#1E3A5F] shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"'
);

// En-tête : Client & Statut
content = content.replace(
  /className="p-5 border-b border-\[var\(--stone\)] bg-\[var\(--white\)]\/20 flex items-start justify-between gap-4"/g,
  'className="p-5 border-b border-[#1E3A5F] bg-[#112233] flex items-start justify-between gap-4"'
);

// Initials background
content = content.replace(
  /className="w-10 h-10 rounded-xl bg-\[var\(--blue\)]\/10 border border-\[var\(--stone\)] flex items-center justify-center text-xs font-bold text-\[var\(--blue\)] shrink-0"/g,
  'className="w-10 h-10 rounded-xl bg-[#1E3A5F] border border-[#1E3A5F] flex items-center justify-center text-xs font-bold text-[#18CDEC] shrink-0"'
);

// Client name
content = content.replace(
  /className="font-semibold text-\[var\(--ink\)] truncate max-w-\[120px\]"/g,
  'className="font-bold text-[#18CDEC] truncate max-w-[120px] uppercase tracking-wide text-sm"'
);

// Phone number
content = content.replace(
  /className="text-xs text-\[var\(--muted\)] mt-0\.5"/g,
  'className="text-xs text-[#A0B4C8] mt-0.5"'
);

// N° et Vitrage
content = content.replace(
  /className="font-mono font-bold text-\[var\(--ink\)] text-sm tracking-wide"/g,
  'className="font-mono font-bold text-white text-sm tracking-wide"'
);
content = content.replace(
  /className="ml-5 text-xs text-\[var\(--muted\)] font-medium bg-\[var\(--white\)]\/40 w-fit px-2 py-0\.5 rounded border border-\[var\(--stone\)]"/g,
  'className="ml-5 text-[10px] text-[#18CDEC] font-bold bg-[#18CDEC]/10 w-fit px-2 py-0.5 rounded border border-[#18CDEC]/20 uppercase tracking-wider"'
);

// Vehicule, Garage, Date text
content = content.replace(
  /className="font-mono font-semibold text-\[var\(--ink\)] text-xs"/g,
  'className="font-mono font-bold text-white text-xs"'
);
content = content.replace(
  /className="text-\[var\(--ink\)] truncate"/g,
  'className="text-white text-sm truncate font-medium"'
);
content = content.replace(
  /className="text-\[var\(--ink\)]"/g,
  'className="text-white text-sm font-medium"'
);

// Assurance
content = content.replace(
  /className="text-\[var\(--ink\)] font-medium truncate"/g,
  'className="text-white font-medium text-sm truncate"'
);
content = content.replace(
  /className="font-semibold text-\[var\(--ink\)]"/g,
  'className="font-semibold text-white"'
);

// Icons
content = content.replace(
  /className="text-\[var\(--muted\)] shrink-0"/g,
  'className="text-[#18CDEC] shrink-0"'
);
content = content.replace(
  /className="text-\[var\(--blue\)]"/g,
  'className="text-[#18CDEC]"'
);

// Footer
content = content.replace(
  /className="px-5 py-3 bg-\[var\(--white\)]\/40 border-t border-\[var\(--stone\)] mt-auto"/g,
  'className="px-5 py-3 border-t border-[#1E3A5F] mt-auto"'
);
content = content.replace(
  /className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-\[var\(--blue\)] hover:bg-\[var\(--white\)] rounded-xl transition-all border border-transparent hover:border-\[var\(--stone\)]"/g,
  'className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#18CDEC] hover:bg-[#1E3A5F]/40 rounded-xl transition-all border border-transparent"'
);

// Badges (Assurance / Garage non renseigné)
content = content.replace(
  /className="italic text-\[var\(--muted\)]"/g,
  'className="italic text-[#6B8299]"'
);
content = content.replace(
  /className="italic text-\[var\(--muted\)] text-xs"/g,
  'className="italic text-[#6B8299] text-xs"'
);

fs.writeFileSync(p, content);
console.log("gestionnaire updated");
