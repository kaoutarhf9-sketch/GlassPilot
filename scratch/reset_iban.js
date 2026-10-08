const fs = require('fs');

const paths = [
  'c:\\mon-app-garage\\app\\gestionnaire\\garages\\page.js',
  'c:\\mon-app-garage\\app\\admin\\garages\\page.js'
];

for (const p of paths) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');

    const regex = /onClick=\{\(\) => setExpandedId\(isExpanded \? null : garage\.id\)\}/g;
    
    const replacement = `onClick={() => {
                      setExpandedId(isExpanded ? null : garage.id);
                      if (isExpanded) {
                        setVisibleIbanIds(prev => {
                          const next = { ...prev };
                          delete next[garage.id];
                          return next;
                        });
                      }
                    }}`;
                      
    content = content.replace(regex, replacement);
    fs.writeFileSync(p, content);
    console.log("Updated", p);
  }
}
