const fs = require('fs');

const files = [
  'app/dashboard/dossiers/nouveau/page.js',
  'app/inscription/page.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (file === 'app/dashboard/dossiers/nouveau/page.js') {
    const cpRegex = /<input className=\{clsx\(inputClass, errors\.code_postal && 'border-rose-400'\)\} value=\{client\.code_postal\} onChange=\{e => setC\('code_postal', e\.target\.value\)\} placeholder="75001" \/>/;
    const cpReplace = `<AddressAutocomplete
                      name="code_postal"
                      searchType="municipality"
                      value={client.code_postal}
                      onChange={e => setC('code_postal', e.target.value)}
                      onSelect={(sugg) => {
                        if (sugg.nom_rue) setC('adresse', sugg.nom_rue);
                        if (sugg.code_postal) setC('code_postal', sugg.code_postal);
                        if (sugg.ville) setC('ville', sugg.ville);
                      }}
                      className={clsx(inputClass, "pl-11", errors.code_postal && 'border-rose-400')}
                      placeholder="75001"
                    />`;
    
    if (content.match(cpRegex)) {
      content = content.replace(cpRegex, cpReplace);
      changed = true;
    }

    const villeRegex = /<input className=\{clsx\(inputClass, errors\.ville && 'border-rose-400'\)\} value=\{client\.ville\} onChange=\{e => setC\('ville', e\.target\.value\)\} placeholder="Paris" \/>/;
    const villeReplace = `<AddressAutocomplete
                      name="ville"
                      searchType="municipality"
                      value={client.ville}
                      onChange={e => setC('ville', e.target.value)}
                      onSelect={(sugg) => {
                        if (sugg.nom_rue) setC('adresse', sugg.nom_rue);
                        if (sugg.code_postal) setC('code_postal', sugg.code_postal);
                        if (sugg.ville) setC('ville', sugg.ville);
                      }}
                      className={clsx(inputClass, "pl-11", errors.ville && 'border-rose-400')}
                      placeholder="Paris"
                    />`;
    
    if (content.match(villeRegex)) {
      content = content.replace(villeRegex, villeReplace);
      changed = true;
    }
    
    // Also fix the adresse onSelect to check sugg.nom_rue
    content = content.replace(
      `setC('adresse', sugg.nom_rue);\n                      setC('code_postal', sugg.code_postal);\n                      setC('ville', sugg.ville);`,
      `if (sugg.nom_rue) setC('adresse', sugg.nom_rue);\n                      if (sugg.code_postal) setC('code_postal', sugg.code_postal);\n                      if (sugg.ville) setC('ville', sugg.ville);`
    );

  } else if (file === 'app/inscription/page.js') {
    const cpRegex = /<input\s*type="text"\s*name="code_postal"\s*required\s*value=\{formData\.code_postal\}\s*onChange=\{handleChange\}\s*className="w-full px-4 py-3 bg-\[var\(--white\)\] border border-\[var\(--stone\)\] rounded-xl text-sm text-\[var\(--ink\)\] focus:outline-none focus:border-\[var\(--blue\)\] focus:ring-2 focus:ring-\[var\(--blue\)\]\/10 transition-all"\s*placeholder="75001"\s*\/>/;
    
    const cpReplace = `<AddressAutocomplete
                        name="code_postal"
                        searchType="municipality"
                        required
                        value={formData.code_postal}
                        onChange={handleChange}
                        onSelect={(sugg) => {
                          setFormData(prev => ({
                            ...prev,
                            ...(sugg.nom_rue && { adresse: sugg.nom_rue }),
                            ...(sugg.code_postal && { code_postal: sugg.code_postal }),
                            ...(sugg.ville && { ville: sugg.ville })
                          }));
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                        placeholder="75001"
                      />`;
                      
    if (content.match(cpRegex)) {
      content = content.replace(cpRegex, cpReplace);
      changed = true;
    }

    const villeRegex = /<input\s*type="text"\s*name="ville"\s*required\s*value=\{formData\.ville\}\s*onChange=\{handleChange\}\s*className="w-full px-4 py-3 bg-\[var\(--white\)\] border border-\[var\(--stone\)\] rounded-xl text-sm text-\[var\(--ink\)\] focus:outline-none focus:border-\[var\(--blue\)\] focus:ring-2 focus:ring-\[var\(--blue\)\]\/10 transition-all"\s*placeholder="Paris"\s*\/>/;

    const villeReplace = `<AddressAutocomplete
                        name="ville"
                        searchType="municipality"
                        required
                        value={formData.ville}
                        onChange={handleChange}
                        onSelect={(sugg) => {
                          setFormData(prev => ({
                            ...prev,
                            ...(sugg.nom_rue && { adresse: sugg.nom_rue }),
                            ...(sugg.code_postal && { code_postal: sugg.code_postal }),
                            ...(sugg.ville && { ville: sugg.ville })
                          }));
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/10 transition-all"
                        placeholder="Paris"
                      />`;
                      
    if (content.match(villeRegex)) {
      content = content.replace(villeRegex, villeReplace);
      changed = true;
    }
    
    // Fix adresse onSelect
    const adresseOnSelectOld = `setFormData(prev => ({
                            ...prev,
                            adresse: sugg.nom_rue,
                            code_postal: sugg.code_postal,
                            ville: sugg.ville
                          }));`;
    const adresseOnSelectNew = `setFormData(prev => ({
                            ...prev,
                            ...(sugg.nom_rue && { adresse: sugg.nom_rue }),
                            ...(sugg.code_postal && { code_postal: sugg.code_postal }),
                            ...(sugg.ville && { ville: sugg.ville })
                          }));`;
    
    if (content.includes(adresseOnSelectOld)) {
      content = content.replace(adresseOnSelectOld, adresseOnSelectNew);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`No changes made to ${file}`);
  }
}
