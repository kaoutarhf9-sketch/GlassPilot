"use client";

import ReferentielAssuranceTable from '@/components/ReferentielAssuranceTable';
import { ShieldCheck, Sparkles, Building2, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function GestionnaireReferentielAssurancePage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full relative animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--blue)]/10 flex items-center justify-center border border-[var(--stone)]/20 shrink-0">
            <BookOpen className="text-[var(--blue)]" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--page-bg)] text-[var(--blue)] border border-[var(--stone)]/30">
                Annuaire & Procédures
              </span>
              <Link href="/gestionnaire/actualites" className="text-xs text-slate-400 hover:text-[var(--blue)] transition-colors">
                ← Retour aux actualités
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-premium text-[var(--ink)]">
              Référentiel Assurance
            </h1>
            <p className="text-xs font-semibold text-[#64748B] mt-1">
              Coordonnées téléphoniques, e-mails de gestion sinistres, horaires et consignes de relance pour chaque compagnie d'assurance.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <Link
            href="/gestionnaire/actualites"
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 rounded-xl transition-colors"
          >
            Actualités
          </Link>
          <span className="px-4 py-2 text-xs font-bold text-[var(--ink)] bg-white rounded-xl shadow-sm border border-slate-200/60">
            Référentiel Assurance
          </span>
        </div>
      </div>

      {/* Table Component */}
      <ReferentielAssuranceTable />
    </div>
  );
}
