"use client";

import { useState, useEffect } from 'react';
import { REFERENTIEL_ASSURANCES } from '@/lib/referentielAssurances';
import { 
  Search, Phone, Mail, Clock, Copy, Check, 
  ExternalLink, AlertCircle, Sparkles, ChevronLeft, ChevronRight
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
      item.telephone.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q) ||
      item.notes.toLowerCase().includes(q) ||
      item.horaires.toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (filterType === 'consignes') {
      return item.notes && item.notes.trim() !== '';
    }
    if (filterType === 'conference') {
      return item.notes.toLowerCase().includes('conférence') || item.notes.toLowerCase().includes('conference');
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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Search and Quick Filters Header */}
      <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] p-4 sm:p-6 shadow-md flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
          <input
            type="text"
            placeholder="Rechercher une assurance, téléphone, e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-[#E6FAFC]/50 border border-[#18CDEC]/30 rounded-2xl text-sm font-medium text-[#0A0030] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#18CDEC]/40 focus:bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterType('tous')}
            className={clsx(
              "px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border",
              filterType === 'tous'
                ? "bg-[#3B0FAA] text-white border-[#3B0FAA] shadow-md shadow-[#3B0FAA]/20"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
          >
            Toutes ({REFERENTIEL_ASSURANCES.length})
          </button>
          <button
            onClick={() => setFilterType('consignes')}
            className={clsx(
              "px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border",
              filterType === 'consignes'
                ? "bg-[#18CDEC] text-[#0A0030] border-[#18CDEC] shadow-md shadow-[#18CDEC]/20"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
          >
            <AlertCircle size={14} /> Consignes ({REFERENTIEL_ASSURANCES.filter(i => i.notes && i.notes.trim()).length})
          </button>
          <button
            onClick={() => setFilterType('conference')}
            className={clsx(
              "px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border",
              filterType === 'conference'
                ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            )}
          >
            <Phone size={14} /> Conférence ({REFERENTIEL_ASSURANCES.filter(i => i.notes.toLowerCase().includes('conférence') || i.notes.toLowerCase().includes('conference')).length})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#E6FAFC] border-b border-[#18CDEC]/20 text-[#0A0030] text-xs font-bold uppercase tracking-wider">
                <th className="p-4 sm:p-5 pl-6">Assurance</th>
                <th className="p-4 sm:p-5">Téléphone</th>
                <th className="p-4 sm:p-5">Email</th>
                <th className="p-4 sm:p-5">Horaires</th>
                <th className="p-4 sm:p-5 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Search size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">Aucune assurance trouvée</p>
                    <p className="text-xs text-slate-400 mt-1">Essayez un autre mot-clé (ex: AXA, ALLIANZ, etc.)</p>
                  </td>
                </tr>
              ) : (
                pageData.map((item) => {
                  const telHref = getPhoneTelHref(item.telephone);
                  const mailtoHref = getEmailMailtoHref(item.email);
                  const hasNotes = item.notes && item.notes.trim() !== '';
                  const isConference = item.notes.toLowerCase().includes('conférence') || item.notes.toLowerCase().includes('conference');

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#E6FAFC]/40 transition-colors group"
                    >
                      {/* 1. Assurance */}
                      <td className="p-4 sm:p-5 pl-6 align-top">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#0A0030] text-base group-hover:text-[#3B0FAA] transition-colors">
                              {item.nom}
                            </span>
                            {isConference && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Conférence oblig.
                              </span>
                            )}
                          </div>

                          {hasNotes && (
                            <div className="mt-2">
                              <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 p-2 rounded-xl border border-amber-200/50">
                                <span className="font-bold text-amber-900">💡 </span>
                                {item.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 2. Téléphone */}
                      <td className="p-4 sm:p-5 align-top">
                        {item.telephone && item.telephone !== '—' ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-[#18CDEC] shrink-0" />
                              <span className="font-mono text-xs font-semibold text-[#0A0030] break-words max-w-[220px]">
                                {item.telephone}
                              </span>
                            </div>
                            {telHref && (
                              <a
                                href={telHref}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3B0FAA] hover:underline"
                              >
                                <ExternalLink size={10} /> Appeler
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* 3. Email */}
                      <td className="p-4 sm:p-5 align-top max-w-[240px]">
                        {item.email && item.email !== '—' ? (
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <Mail size={14} className="text-[#3B0FAA] shrink-0 mt-0.5" />
                              <span className="font-mono text-xs text-slate-700 break-words leading-tight">
                                {item.email}
                              </span>
                            </div>
                            {mailtoHref && (
                              <a
                                href={mailtoHref}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#18CDEC] hover:underline"
                              >
                                <ExternalLink size={10} /> Écrire
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* 4. Horaires */}
                      <td className="p-4 sm:p-5 align-top">
                        {item.horaires && item.horaires !== '—' ? (
                          <div className="flex items-start gap-2">
                            <Clock size={14} className="text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-xs font-medium text-slate-600 max-w-[180px] leading-tight">
                              {item.horaires}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* 5. Actions */}
                      <td className="p-4 sm:p-5 pr-6 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          {telHref && (
                            <a
                              href={telHref}
                              className="p-2 bg-[#E6FAFC] text-[#3B0FAA] hover:bg-[#3B0FAA] hover:text-white rounded-xl transition-colors border border-[#18CDEC]/30"
                              title="Appeler par téléphone"
                            >
                              <Phone size={14} />
                            </a>
                          )}
                          {mailtoHref && (
                            <a
                              href={mailtoHref}
                              className="p-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors border border-indigo-100"
                              title="Envoyer un courriel"
                            >
                              <Mail size={14} />
                            </a>
                          )}
                          <button
                            onClick={() => handleCopy(`${item.nom} - Tel: ${item.telephone} | Email: ${item.email} | Consignes: ${item.notes}`, `all-${item.id}`)}
                            className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                            title="Copier toutes les coordonnées"
                          >
                            {copiedId === `all-${item.id}` ? (
                              <Check size={14} className="text-emerald-600 animate-in zoom-in" />
                            ) : (
                              <Copy size={14} />
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
        <div className="p-4 bg-[#E6FAFC]/60 border-t border-[#18CDEC]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left info */}
          <span className="text-xs text-slate-500 font-medium">
            <strong className="text-[#0A0030]">{filteredData.length}</strong> compagnie{filteredData.length > 1 ? 's' : ''} —{' '}
            page <strong className="text-[#0A0030]">{currentPage}</strong> / <strong className="text-[#0A0030]">{totalPages || 1}</strong>
          </span>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={clsx(
                  "p-2 rounded-xl border text-xs font-bold transition-all",
                  currentPage === 1
                    ? "text-slate-300 border-slate-200 cursor-not-allowed bg-slate-50"
                    : "text-[#3B0FAA] border-[#3B0FAA]/30 hover:bg-[#3B0FAA] hover:text-white bg-white"
                )}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers */}
              {getPageNumbers().map((page, i) =>
                page === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-xs font-bold select-none">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={clsx(
                      "min-w-[36px] h-9 px-2 rounded-xl border text-xs font-bold transition-all",
                      page === currentPage
                        ? "bg-[#3B0FAA] text-white border-[#3B0FAA] shadow-md shadow-[#3B0FAA]/20"
                        : "text-[#0A0030] border-slate-200 hover:border-[#3B0FAA]/40 hover:bg-[#E6FAFC] bg-white"
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
                  "p-2 rounded-xl border text-xs font-bold transition-all",
                  currentPage === totalPages
                    ? "text-slate-300 border-slate-200 cursor-not-allowed bg-slate-50"
                    : "text-[#3B0FAA] border-[#3B0FAA]/30 hover:bg-[#3B0FAA] hover:text-white bg-white"
                )}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Right branding */}
          <span className="hidden sm:flex items-center gap-1.5 text-[#3B0FAA] font-bold text-xs">
            <Sparkles size={14} /> GlassPilot
          </span>
        </div>
      </div>
    </div>
  );
}
