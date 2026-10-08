const fs = require('fs');

const paths = [
  'c:\\mon-app-garage\\app\\gestionnaire\\dossiers\\[id]\\page.js',
  'c:\\mon-app-garage\\app\\dashboard\\dossiers\\[id]\\page.js'
];

for (const p of paths) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');

    // 1. Update imports
    if (!content.includes('Pencil,')) {
      content = content.replace('Upload, Plus', 'Upload, Plus, Pencil, Eye');
    }

    // 2. Remove existing hover overlay for Documents Requis
    const overlayRegexReq = /<div className="absolute inset-0 bg-\[var\(--white\)]\/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">[\s\S]*?<\/div>/;
    
    // 3. Replace the footer for Documents Requis
    const footerRegexReq = /<div className="p-3 bg-white\/10 border-t border-white\/20">\s*<p className="text-xs font-bold text-white truncate">\{slot\.label\}<\/p>\s*<p className="text-\[10px\] text-slate-300 mt-0\.5 truncate">\{doc\.name\}<\/p>\s*<\/div>/;
    const newFooterReq = `<div className="p-3 bg-white/10 border-t border-white/20">
                              <p className="text-xs font-bold text-white truncate">{slot.label}</p>
                              <p className="text-[10px] text-slate-300 mt-0.5 mb-2 truncate">{doc.name}</p>
                              <div className="flex items-center justify-between gap-1 pt-2 border-t border-white/10">
                                {doc.isImage && (
                                  <button onClick={(e) => { e.stopPropagation(); setSelectedImage(doc.url); }} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Visualiser">
                                    <Eye size={14} />
                                  </button>
                                )}
                                <a href={doc.url} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Télécharger">
                                  <Download size={14} />
                                </a>
                                <label className="p-1.5 text-blue-300 hover:text-blue-100 hover:bg-blue-500/20 rounded transition-colors cursor-pointer" title="Modifier" onClick={(e) => e.stopPropagation()}>
                                  <Pencil size={14} />
                                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleUploadSlotFile(e, slot.key)} disabled={uploading} />
                                </label>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(doc.name); }} className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded transition-colors" title="Supprimer">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>`;

    if (overlayRegexReq.test(content) && footerRegexReq.test(content)) {
      content = content.replace(overlayRegexReq, '');
      content = content.replace(footerRegexReq, newFooterReq);
    }

    // 4. Remove existing hover overlay for Autres documents
    const overlayRegexAut = /<div className="absolute inset-0 bg-\[var\(--white\)]\/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">[\s\S]*?<\/div>/;
    
    // 5. Replace the footer for Autres documents
    const footerRegexAut = /<div className="p-3 bg-white\/10 border-t border-white\/20 text-center">\s*<p className="text-xs font-medium text-white truncate">\{doc\.label\}<\/p>\s*<\/div>/;
    const newFooterAut = `<div className="p-3 bg-white/10 border-t border-white/20">
                          <p className="text-[10px] font-medium text-white truncate mb-2">{doc.label}</p>
                          <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10">
                            {doc.isImage && (
                              <button onClick={(e) => { e.stopPropagation(); setSelectedImage(doc.url); }} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Visualiser">
                                <Eye size={14} />
                              </button>
                            )}
                            <a href={doc.url} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Télécharger">
                              <Download size={14} />
                            </a>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(doc.name); }} className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded transition-colors" title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>`;

    if (overlayRegexAut.test(content) && footerRegexAut.test(content)) {
      content = content.replace(overlayRegexAut, '');
      content = content.replace(footerRegexAut, newFooterAut);
    }

    fs.writeFileSync(p, content);
    console.log("Updated", p);
  }
}
