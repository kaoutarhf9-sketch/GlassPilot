const fs = require('fs');
let content = fs.readFileSync('app/dashboard/profil/page.js', 'utf8');

// The labels inside the form are dark. We replace text-[var(--ink)] with text-slate-300
// But only for the form fields, so we replace text-[var(--ink)] with text-white or text-slate-300.
// Let's just replace all text-[var(--ink)] with text-slate-200.
content = content.replace(/text-\[var\(--ink\)\]/g, 'text-slate-200');

// Fix text color for input fields
// The input currently has text-[var(--ink)]. So it became text-slate-200.
// Wait, the input background is bg-[var(--white)]/40 or bg-white.
// The input class: "w-full px-4 py-2.5 bg-[var(--white)]/40 border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)]"
// If the input background is white-ish, the text should be dark! 
// Oh! The background of the container is bg-[#120052] (dark blue). 
// The input bg is `bg-[var(--white)]/40` which is semi-transparent white, or it might be `bg-white/5` like other pages. 
// Let's rewrite the inputClass completely to match the dark theme inputs.

content = content.replace(
  /const inputClass = "w-full px-4 py-2.5 bg-\[var\(--white\)\]\/40 border border-\[var\(--stone\)\] rounded-xl text-sm text-\[var\(--ink\)\] focus:outline-none focus:border-\[#1454FF\] focus:ring-2 focus:ring-\[#1454FF\]\/10 transition-all placeholder:text-\[var\(--muted\)\]";/g,
  `const inputClass = "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/20 transition-all placeholder:text-slate-500";`
);

// Fix the main title H2 which is now text-slate-200 to be text-white
content = content.replace(/<h2 className="text-lg font-bold text-slate-200/g, '<h2 className="text-lg font-bold text-white');
content = content.replace(/<h2 className="text-lg font-bold text-\[var\(--ink\)\]/g, '<h2 className="text-lg font-bold text-white');

// The logo background is bg-slate-50. This is white! On a dark background it looks like a white square. 
// But the user said the logo doesn't show up. Maybe the image URL is not public? 
// Or maybe it has "w-full h-full object-contain p-2" inside a white square. If the logo is white, it won't show.
// Let's make the logo container dark: `bg-white/5` instead of `bg-slate-50`.
content = content.replace(/bg-slate-50 overflow-hidden/g, 'bg-white/5 overflow-hidden border-white/10');

fs.writeFileSync('app/dashboard/profil/page.js', content);
console.log('Fixed colors');
