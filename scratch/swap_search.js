const fs = require('fs');

const path = 'c:\\mon-app-garage\\components\\ReferentielAssuranceTable.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /(\{\/\* Search Input \*\/\}\s*<div className="relative w-full md:max-w-md">[\s\S]*?<\/div>\s*)(\{\/\* Quick Filter Buttons \*\/\}\s*<div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">[\s\S]*?<\/button>\s*<\/div>)/;

const match = content.match(regex);

if (match) {
  const searchInput = match[1];
  const quickFilters = match[2];
  content = content.replace(regex, quickFilters + "\n        " + searchInput);
  fs.writeFileSync(path, content);
  console.log("Swapped search and filters");
} else {
  console.log("Regex didn't match");
}
