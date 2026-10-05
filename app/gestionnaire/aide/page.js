"use client";

import { HelpCircle, Mail, Phone, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AideGestionnaire() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-serif text-[var(--ink)] flex items-center gap-3">
          <HelpCircle className="text-[#3B0FAA]" size={32} />
          Support technique
        </h1>
        <p className="text-[#64748B] text-sm max-w-2xl">
          Retrouvez ici toutes les informations pour contacter le support technique ou utiliser la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Contact Support */}
        <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] p-6 shadow-md">
          <h2 className="text-lg font-bold text-[#0A0030] mb-4 flex items-center gap-2">
            <Mail className="text-[#18CDEC]" size={20} />
            Nous contacter
          </h2>
          <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
            Notre équipe de support est disponible pour répondre à vos questions et résoudre vos problèmes techniques du lundi au vendredi.
          </p>
          
          <div className="space-y-4">
            <a 
              href="mailto:support@glasspilot.fr" 
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-[#18CDEC] hover:bg-[#E6FAFC] transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Mail size={18} className="text-[#3B0FAA]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Par email</p>
                <p className="font-bold text-[#0A0030] group-hover:text-[#3B0FAA] transition-colors">support@glasspilot.fr</p>
              </div>
            </a>
            
            <a 
              href="tel:+33123456789" 
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-[#18CDEC] hover:bg-[#E6FAFC] transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Phone size={18} className="text-[#3B0FAA]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Par téléphone (Urgence)</p>
                <p className="font-bold text-[#0A0030] group-hover:text-[#3B0FAA] transition-colors">01 23 45 67 89</p>
              </div>
            </a>
          </div>
        </div>

        {/* Ressources */}
        <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] p-6 shadow-md">
          <h2 className="text-lg font-bold text-[#0A0030] mb-4 flex items-center gap-2">
            <HelpCircle className="text-[#3B0FAA]" size={20} />
            Ressources utiles
          </h2>
          <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
            Consultez nos guides et la base de connaissances pour maîtriser l'utilisation de GlassPilot.
          </p>
          
          <div className="space-y-3">
            <Link 
              href="/gestionnaire/dossiers" 
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-colors group"
            >
              <span className="font-medium text-[#0A0030]">Comment gérer un dossier ?</span>
              <ExternalLink size={16} className="text-slate-400 group-hover:text-[#3B0FAA]" />
            </Link>
            <Link 
              href="/gestionnaire/referentiel-assurance" 
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-colors group"
            >
              <span className="font-medium text-[#0A0030]">Consulter le référentiel</span>
              <ExternalLink size={16} className="text-slate-400 group-hover:text-[#3B0FAA]" />
            </Link>
            <Link 
              href="/gestionnaire/actualites" 
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-colors group"
            >
              <span className="font-medium text-[#0A0030]">Voir les dernières actualités</span>
              <ExternalLink size={16} className="text-slate-400 group-hover:text-[#3B0FAA]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
