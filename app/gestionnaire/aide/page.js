"use client";

import { HelpCircle, Mail, Phone, ExternalLink, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function AideGestionnaire() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-serif text-[var(--ink)] flex items-center gap-3">
          <HelpCircle className="text-[var(--blue)]" size={32} />
          Support technique & Aide
        </h1>
        <p className="text-[#64748B] text-sm max-w-2xl">
          Retrouvez ici toutes les informations pour contacter le support technique ou utiliser la plateforme.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Contact Support */}
        <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] p-6 shadow-md">
          <h2 className="text-lg font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
            <Mail className="text-[var(--blue)]" size={20} />
            Nous contacter
          </h2>
          <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
            Notre équipe de support est disponible pour répondre à vos questions et résoudre vos problèmes techniques du lundi au vendredi.
          </p>
          
          <div className="space-y-4">
            <a 
              href="mailto:glasspilotcontact@gmail.com" 
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-[var(--stone)] hover:bg-[var(--page-bg)] transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Mail size={18} className="text-[var(--blue)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Par email</p>
                <p className="font-bold text-[var(--ink)] group-hover:text-[var(--blue)] transition-colors break-all">glasspilotcontact@gmail.com</p>
              </div>
            </a>
            
            <a 
              href="tel:+33756993583" 
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-[var(--stone)] hover:bg-[var(--page-bg)] transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Phone size={18} className="text-[var(--blue)]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Par téléphone (Urgence)</p>
                <p className="font-bold text-[var(--ink)] group-hover:text-[var(--blue)] transition-colors">+33 7 56 99 35 83</p>
              </div>
            </a>
          </div>
        </div>

        {/* Ressources */}
        <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] p-6 shadow-md">
          <h2 className="text-lg font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
            <HelpCircle className="text-[var(--blue)]" size={20} />
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
              <span className="font-medium text-[var(--ink)]">Comment gérer un dossier ?</span>
              <ExternalLink size={16} className="text-slate-400 group-hover:text-[var(--blue)]" />
            </Link>
            <Link 
              href="/gestionnaire/referentiel-assurance" 
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-colors group"
            >
              <span className="font-medium text-[var(--ink)]">Consulter le référentiel</span>
              <ExternalLink size={16} className="text-slate-400 group-hover:text-[var(--blue)]" />
            </Link>
            <Link 
              href="/gestionnaire/actualites" 
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-300 transition-colors group"
            >
              <span className="font-medium text-[var(--ink)]">Voir les dernières actualités</span>
              <ExternalLink size={16} className="text-slate-400 group-hover:text-[var(--blue)]" />
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ / Petites questions */}
      <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] p-6 shadow-md mt-6">
        <h2 className="text-lg font-bold text-[var(--ink)] mb-6 flex items-center gap-2">
          <HelpCircle className="text-[var(--blue)]" size={20} />
          Foire aux questions (FAQ)
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <h3 className="font-bold text-[var(--ink)] mb-2">Comment ajouter un nouveau garagiste ?</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Pour ajouter un nouveau garagiste à votre réseau, vous devez contacter notre équipe technique. Les garagistes peuvent également s'inscrire directement depuis la page d'accueil de GlassPilot et leur compte sera validé manuellement.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <h3 className="font-bold text-[var(--ink)] mb-2">Puis-je modifier un document généré ?</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Une fois généré et signé, un document est définitif pour des raisons légales. Si vous constatez une erreur, vous devez corriger les informations dans le dossier et générer un nouveau document.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <h3 className="font-bold text-[var(--ink)] mb-2">Où trouver le référentiel des prix ?</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Le référentiel d'assurance est accessible depuis le menu principal à gauche. Vous y trouverez les grilles tarifaires de toutes les assurances partenaires pour estimer au mieux vos interventions.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
            <h3 className="font-bold text-[var(--ink)] mb-2">Comment sont notifiés les garagistes ?</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Dès que vous envoyez un message via le chat d'un dossier, ou lorsque le statut d'un dossier change, le garagiste reçoit une notification en temps réel sur son tableau de bord GlassPilot.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
