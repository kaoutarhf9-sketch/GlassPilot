const fs = require('fs');
const file = 'app/inscription/page.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Update initial formData
content = content.replace(
  `email: '', password: '', prenom: '', nom_garage: '',
    responsable: '', telephone: '', adresse: '', siret: ''`,
  `email: '', password: '', prenom: '', nom_garage: '',
    responsable: '', telephone: '', adresse: '', code_postal: '', ville: '', siret: ''`
);

// 2. Update submit body
content = content.replace(
  `adresse: formData.adresse,`,
  `adresse: \`\${formData.adresse}, \${formData.code_postal} \${formData.ville}\`.trim().replace(/^,\\s*/, ''),`
);

// 3. Update the UI
// Find the AddressAutocomplete block and replace it
const oldUI = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Adresse
                      </label>
                      <AddressAutocomplete
                        name="adresse"
                        required
                        value={formData.adresse}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        SIRET
                      </label>`;

const newUI = `<div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Adresse
                      </label>
                      <AddressAutocomplete
                        name="adresse"
                        required
                        value={formData.adresse}
                        onChange={handleChange}
                        onSelect={(sugg) => {
                          setFormData(prev => ({
                            ...prev,
                            adresse: sugg.nom_rue,
                            code_postal: sugg.code_postal,
                            ville: sugg.ville
                          }));
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Code postal
                      </label>
                      <input
                        type="text"
                        name="code_postal"
                        required
                        value={formData.code_postal}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                        placeholder="75001"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        Ville
                      </label>
                      <input
                        type="text"
                        name="ville"
                        required
                        value={formData.ville}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                        placeholder="Paris"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1.5">
                        SIRET
                      </label>`;

if (content.includes(oldUI)) {
  content = content.replace(oldUI, newUI);
  fs.writeFileSync(file, content);
  console.log('Success');
} else {
  console.log('Could not find old UI chunk');
}
