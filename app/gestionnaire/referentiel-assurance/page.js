"use client";

import ReferentielAssuranceTable from '@/components/ReferentielAssuranceTable';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function GestionnaireReferentielAssurancePage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full relative animate-in fade-in duration-500 font-sans pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0d1428] p-6 sm:p-8 rounded-2xl border border-[#1e2d4a] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1454FF]/20 flex items-center justify-center border border-[#00d4ff]/30 text-[#00d4ff] shrink-0 shadow-md">
            <BookOpen size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30">
                Annuaire & Procédures
              </span>
              <Link href="/gestionnaire/actualites" className="text-xs font-semibold text-slate-400 hover:text-[#00d4ff] transition-colors">
                ← Retour aux actualités
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Référentiel Assurance
            </h1>
            <p className="text-sm font-medium text-slate-300 mt-1">
              Coordonnées téléphoniques, e-mails de gestion sinistres, horaires et consignes de relance pour chaque compagnie.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-[#111c35] p-1.5 rounded-xl border border-[#1e2d4a]">
          <Link
            href="/gestionnaire/actualites"
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Actualités
          </Link>
          <span className="px-4 py-2 text-xs font-bold text-white bg-[#1454FF] rounded-lg shadow-md">
            Référentiel Assurance
          </span>
        </div>
      </div>

      {/* Table Component */}
      <ReferentielAssuranceTable />
    </div>
  );
}
