const fs = require('fs');

const paths = [
  'c:\\mon-app-garage\\app\\gestionnaire\\garages\\page.js',
  'c:\\mon-app-garage\\app\\admin\\garages\\page.js'
];

for (const p of paths) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');

    // Add state if not present
    if (!content.includes('const [visibleIbanIds, setVisibleIbanIds] = useState({});')) {
      content = content.replace(
        /const \[expandedId, setExpandedId\] = useState\(null\);/g,
        'const [expandedId, setExpandedId] = useState(null);\n  const [visibleIbanIds, setVisibleIbanIds] = useState({});\n\n  const toggleIban = (e, id) => {\n    e.stopPropagation();\n    setVisibleIbanIds(prev => ({ ...prev, [id]: !prev[id] }));\n  };'
      );
    }

    const regexIban = /\{\/\* IBAN & BIC \*\/\}[\s\S]*?\{\/\* Liens vers les documents \(KBIS, RIB, CNI\) \*\/\}/g;
    
    const replacement = `{/* IBAN & BIC */}
                      {(garage.iban || garage.bic) && (
                        <div className="bg-[#0B172A] p-3 rounded-xl border border-[#1E3A5F] space-y-1.5">
                          {garage.iban && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#6B8299] font-medium">IBAN :</span>
                              {visibleIbanIds[garage.id] ? (
                                <span className="font-mono font-bold text-[#18CDEC]">{garage.iban}</span>
                              ) : (
                                <button onClick={(e) => toggleIban(e, garage.id)} className="px-2 py-0.5 bg-[#18CDEC]/10 text-[#18CDEC] hover:bg-[#18CDEC]/20 border border-[#18CDEC]/30 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">Afficher</button>
                              )}
                            </div>
                          )}
                          {garage.bic && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#6B8299] font-medium">BIC / SWIFT :</span>
                              {visibleIbanIds[garage.id] ? (
                                <span className="font-mono text-white">{garage.bic}</span>
                              ) : (
                                <button onClick={(e) => toggleIban(e, garage.id)} className="px-2 py-0.5 bg-[#18CDEC]/10 text-[#18CDEC] hover:bg-[#18CDEC]/20 border border-[#18CDEC]/30 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">Afficher</button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Liens vers les documents (KBIS, RIB, CNI) */}`;
                      
    content = content.replace(regexIban, replacement);
    fs.writeFileSync(p, content);
    console.log("Updated", p);
  }
}
