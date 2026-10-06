"use client";

import { useState, useEffect } from 'react';
import { REFERENTIEL_ASSURANCES } from '@/lib/referentielAssurances';
import { 
  Search, Phone, Mail, Clock, Copy, Check, 
  ExternalLink, AlertCircle, Sparkles, ChevronLeft, ChevronRight,
  ShieldCheck, HelpCircle
} from 'lucide-react';
import clsx from 'clsx';

const PAGE_SIZE = 15;

export default function ReferentielAssuranceTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('tous');
  const [copiedId, setCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleCopy = (text, id) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredData = REFERENTIEL_ASSURANCES.filter(item => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.nom.toLowerCase().includes(q) ||
      (item.telephone && item.telephone.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      (item.horaires && item.horaires.toLowerCase().includes(q));

    if (!matchSearch) return false;

    if (filterType === 'consignes') {
      return item.notes && item.notes.trim() !== '';
    }
    if (filterType === 'conference') {
      return item.notes && (item.notes.toLowerCase().includes('conférence') || item.notes.toLowerCase().includes('conference'));
    }

    return true;
  });

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData = filteredData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const getPhoneTelHref = (phoneStr) => {
    if (!phoneStr || phoneStr === '—') return null;
    const firstNumMatch = phoneStr.match(/(?:0|\+33)[0-9\s.-]{8,14}/);
    if (firstNumMatch) {
      return `tel:${firstNumMatch[0].replace(/[\s.-]/g, '')}`;
    }
    return null;
  };

  const getEmailMailtoHref = (emailStr) => {
    if (!emailStr || emailStr === '—') return null;
    const firstEmailMatch = emailStr.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (firstEmailMatch) {
      return `mailto:${firstEmailMatch[0]}`;
    }
    return null;
  };

  // Build page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Search and Quick Filters Header */}
      <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] p-4 sm:p-6 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType('tous')}
            className={clsx(
              "px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 flex items-center gap-2 border cursor-pointer",
              filterType === 'tous'
                ? "bg-[#1454FF] text-white border-[#1454FF] shadow-lg shadow-[#1454FF]/30"
                : "bg-[#111c35] text-slate-300 border-[#1e2d4a] hover:bg-[#16223d] hover:text-white"
            )}
          >
            Toutes ({REFERENTIEL_ASSURANCES.length})
          </button>
          
          <button
            onClick={() => setFilterType('consignes')}
            className={clsx(
              "px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 flex items-center gap-2 border cursor-pointer",
              filterType === 'consignes'
                ? "bg-[#00d4ff] text-[#071026] border-[#00d4ff] font-extrabold shadow-lg shadow-[#00d4ff]/30"
                : "bg-[#111c35] text-slate-300 border-[#1e2d4a] hover:bg-[#16223d] hover:text-white"
            )}
          >
            <AlertCircle size={16} /> 
            Consignes ({REFERENTIEL_ASSURANCES.filter(i => i.notes && i.notes.trim()).length})
          </button>
          
          <button
            onClick={() => setFilterType('conference')}
            className={clsx(
              "px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 flex items-center gap-2 border cursor-pointer",
              filterType === 'conference'
                ? "bg-amber-500 text-black border-amber-500 font-extrabold shadow-lg shadow-amber-500/30"
                : "bg-[#111c35] text-slate-300 border-[#1e2d4a] hover:bg-[#16223d] hover:text-white"
            )}
          >
            <Phone size={16} /> 
            Conférence ({REFERENTIEL_ASSURANCES.filter(i => i.notes && (i.notes.toLowerCase().includes('conférence') || i.notes.toLowerCase().includes('conference'))).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00d4ff] pointer-events-none" size={20} />
          <input
            type="text"
            placeholder="Rechercher une assurance, téléphone, e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-[#111c35] border border-[#1e2d4a] rounded-xl text-sm sm:text-base font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-[#1e2d4a] transition-colors cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

      </div>

      {/* Main Table */}
      <div className="bg-[#0d1428] rounded-2xl border border-[#1e2d4a] shadow-xl overflow-hidden">
        
        {/* Vue Desktop Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#111c35] border-b border-[#1e2d4a] text-slate-300 text-xs sm:text-sm font-bold uppercase tracking-wider">
                <th className="p-4 sm:p-5 pl-6">Compagnie d'Assurance</th>
                <th className="p-4 sm:p-5">Téléphone</th>
                <th className="p-4 sm:p-5">Email sinistre</th>
                <th className="p-4 sm:p-5">Horaires</th>
                <th className="p-4 sm:p-5 pr-6 text-right">Actions rapides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2d4a]/70">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <Search size={36} className="mx-auto mb-3 text-[#00d4ff]/50" />
                    <p className="font-bold text-white text-lg">Aucune assurance trouvée</p>
                    <p className="text-sm text-slate-400 mt-1">Essayez un autre mot-clé (ex: AXA, ALLIANZ, PACIFICA, etc.)</p>
                  </td>
                </tr>
              ) : (
                pageData.map((item) => {
                  const telHref = getPhoneTelHref(item.telephone);
                  const mailtoHref = getEmailMailtoHref(item.email);
                  const hasNotes = item.notes && item.notes.trim() !== '';
                  const isConference = item.notes && (item.notes.toLowerCase().includes('conférence') || item.notes.toLowerCase().includes('conference'));

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#16223d]/60 transition-colors group"
                    >
                      {/* 1. Assurance */}
                      <td className="p-4 sm:p-5 pl-6 align-top max-w-[340px]">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-extrabold text-white text-base sm:text-lg group-hover:text-[#00d4ff] transition-colors">
                              {item.nom}
                            </span>
                            {isConference && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                Conférence oblig.
                              </span>
                            )}
                          </div>

                          {hasNotes && (
                            <div className="mt-2.5">
                              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#16223d] p-3 rounded-xl border border-[#25375c]">
                                <span className="font-bold text-amber-300">💡 Consigne : </span>
                                {item.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 2. Téléphone */}
                      <td className="p-4 sm:p-5 align-top">
                        {item.telephone && item.telephone !== '—' ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Phone size={15} className="text-[#00d4ff] shrink-0" />
                              <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wide break-words max-w-[220px]">
                                {item.telephone}
                              </span>
                            </div>
                            {telHref && (
                              <a
                                href={telHref}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00d4ff] hover:text-cyan-200 hover:underline transition-colors"
                              >
                                <ExternalLink size={12} /> Appeler directement
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-sm">—</span>
                        )}
                      </td>

                      {/* 3. Email */}
                      <td className="p-4 sm:p-5 align-top max-w-[280px]">
                        {item.email && item.email !== '—' ? (
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-2">
                              <Mail size={15} className="text-[#00d4ff] shrink-0 mt-0.5" />
                              <span className="font-mono text-xs sm:text-sm font-medium text-slate-200 break-words leading-relaxed">
                                {item.email}
                              </span>
                            </div>
                            {mailtoHref && (
                              <a
                                href={mailtoHref}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00d4ff] hover:text-cyan-200 hover:underline transition-colors"
                              >
                                <ExternalLink size={12} /> Envoyer un e-mail
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-sm">—</span>
                        )}
                      </td>

                      {/* 4. Horaires */}
                      <td className="p-4 sm:p-5 align-top">
                        {item.horaires && item.horaires !== '—' ? (
                          <div className="flex items-start gap-2">
                            <Clock size={15} className="text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm font-medium text-slate-300 max-w-[200px] leading-relaxed">
                              {item.horaires}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-sm">—</span>
                        )}
                      </td>

                      {/* 5. Actions */}
                      <td className="p-4 sm:p-5 pr-6 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          {telHref && (
                            <a
                              href={telHref}
                              className="p-2.5 bg-[#1454FF]/20 text-[#00d4ff] hover:bg-[#1454FF] hover:text-white rounded-xl transition-all border border-[#00d4ff]/30 shadow-sm"
                              title="Appeler par téléphone"
                            >
                              <Phone size={15} />
                            </a>
                          )}
                          {mailtoHref && (
                            <a
                              href={mailtoHref}
                              className="p-2.5 bg-[#1454FF]/20 text-[#00d4ff] hover:bg-[#1454FF] hover:text-white rounded-xl transition-all border border-[#00d4ff]/30 shadow-sm"
                              title="Envoyer un courriel"
                            >
                              <Mail size={15} />
                            </a>
                          )}
                          <button
                            onClick={() => handleCopy(`${item.nom} - Tel: ${item.telephone} | Email: ${item.email} | Consignes: ${item.notes || 'N/A'}`, `all-${item.id}`)}
                            className="p-2.5 bg-[#16223d] text-slate-200 hover:bg-[#25375c] hover:text-white rounded-xl transition-all border border-[#25375c] shadow-sm cursor-pointer"
                            title="Copier les coordonnées complètes"
                          >
                            {copiedId === `all-${item.id}` ? (
                              <Check size={15} className="text-emerald-400 animate-in zoom-in" />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: info + pagination */}
        <div className="p-4 sm:p-5 bg-[#111c35] border-t border-[#1e2d4a] flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left info */}
          <span className="text-sm text-slate-300 font-medium">
            <strong className="text-white font-bold">{filteredData.length}</strong> compagnie{filteredData.length > 1 ? 's' : ''} —{' '}
            page <strong className="text-white font-bold">{currentPage}</strong> / <strong className="text-white font-bold">{totalPages || 1}</strong>
          </span>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {/* Prev */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={clsx(
                  "p-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer",
                  currentPage === 1
                    ? "text-slate-600 border-[#1e2d4a] cursor-not-allowed bg-[#0d1428]"
                    : "text-white border-[#25375c] bg-[#16223d] hover:bg-[#1454FF]"
                )}
                title="Page précédente"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Page numbers */}
              {getPageNumbers().map((page, i) =>
                page === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-500 text-sm font-bold select-none">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={clsx(
                      "min-w-[38px] h-9 px-2 rounded-xl border text-sm font-bold transition-all cursor-pointer",
                      page === currentPage
                        ? "bg-[#1454FF] text-white border-[#1454FF] shadow-lg shadow-[#1454FF]/30"
                        : "text-slate-200 border-[#25375c] bg-[#16223d] hover:border-[#00d4ff]/40 hover:bg-[#1f3054] hover:text-white"
                    )}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={clsx(
                  "p-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer",
                  currentPage === totalPages
                    ? "text-slate-600 border-[#1e2d4a] cursor-not-allowed bg-[#0d1428]"
                    : "text-white border-[#25375c] bg-[#16223d] hover:bg-[#1454FF]"
                )}
                title="Page suivante"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* Right branding */}
          <span className="hidden sm:flex items-center gap-1.5 text-[#00d4ff] font-bold text-sm">
            <Sparkles size={16} /> GlassPilot Référentiel
          </span>
        </div>
      </div>
    </div>
  );
}
