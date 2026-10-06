"use client";

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mail, Phone, ExternalLink, LifeBuoy, ShieldCheck, FileText, Settings, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AidePage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      question: "Comment créer un nouveau dossier de sinistre ?",
      answer: "Pour créer un nouveau dossier, allez dans l'onglet 'Dossiers' de votre menu principal, puis cliquez sur le bouton 'Nouveau Dossier'. Vous devrez renseigner les informations du client, de son véhicule et de son assurance.",
      icon: FileText
    },
    {
      question: "Que signifient les différents statuts de dossier ?",
      answer: "Un dossier passe par plusieurs statuts : 'En attente' (lors de sa création), 'Validé' (quand les documents sont bons), 'Terminé' (quand l'intervention est faite) et 'Archivé' (quand tout est finalisé par le gestionnaire).",
      icon: ShieldCheck
    },
    {
      question: "Comment ajouter des documents à un dossier existant ?",
      answer: "Ouvrez le dossier en question depuis votre liste de dossiers. Dans la page de détails, vous trouverez une section pour uploader vos documents (carte grise, constat, photos, etc.) directement au bon emplacement.",
      icon: ExternalLink
    },
    {
      question: "À quoi sert le journal d'activité dans le tchat ?",
      answer: "Le tchat vous permet non seulement de communiquer avec votre gestionnaire assigné, mais il enregistre également tous les changements d'état du dossier (comme le passage à 'Terminé'). Tout l'historique est centralisé !",
      icon: Send
    },
    {
      question: "Je n'arrive pas à télécharger un document, que faire ?",
      answer: "Vérifiez que votre fichier est au format accepté (PDF, JPG, PNG) et qu'il ne dépasse pas la taille maximale autorisée (généralement 10Mo). Si le problème persiste, contactez notre support technique.",
      icon: Settings
    }
  ];

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-[var(--blue)] to-indigo-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-indigo-200 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-indigo-900 opacity-20 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <LifeBuoy size={28} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Centre d'aide</h1>
            </div>
            <p className="text-indigo-100 max-w-xl text-lg leading-relaxed">
              Retrouvez toutes les réponses à vos questions et les bonnes pratiques pour utiliser GlassPilot Pro au quotidien.
            </p>
          </div>
          <img src="/logo.jpeg" alt="GlassPilot" className="w-24 h-24 rounded-2xl shadow-lg border-2 border-white/20 hidden md:block" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Colonne Principale: FAQ */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
            <HelpCircle size={22} className="text-[var(--blue)]" />
            Questions fréquentes
          </h2>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              const Icon = faq.icon;
              return (
                <div 
                  key={index} 
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen ? 'border-[var(--blue)] shadow-md shadow-indigo-100' : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg transition-colors ${isOpen ? 'bg-indigo-50 text-[var(--blue)]' : 'bg-slate-50 text-slate-500'}`}>
                        <Icon size={20} />
                      </div>
                      <span className={`font-semibold ${isOpen ? 'text-[var(--ink)]' : 'text-slate-700'}`}>
                        {faq.question}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp size={20} className="text-[var(--blue)] shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-400 shrink-0" />
                    )}
                  </button>
                  
                  <div 
                    className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-slate-600 leading-relaxed pl-14">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colonne Latérale: Contact & Support */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[var(--ink)] mb-4">Besoin de plus d'aide ?</h2>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed">
              Si vous ne trouvez pas la réponse à votre question, notre équipe de support technique est à votre disposition.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                  <Phone size={18} className="text-[var(--blue)]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Téléphone</p>
                  <a href="tel:+33123456789" className="text-[var(--ink)] font-semibold hover:text-[var(--blue)] transition-colors">
                    01 23 45 67 89
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Lun-Ven, 9h-18h</p>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full"></div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                  <Mail size={18} className="text-[var(--blue)]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</p>
                  <a href="mailto:glasspilotcontact@gmail.com" className="text-[var(--ink)] font-semibold hover:text-[var(--blue)] transition-colors break-all">
                    glasspilotcontact@gmail.com
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Réponse sous 24h</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <Link 
                href="/dashboard/dossiers" 
                className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium py-2.5 rounded-xl transition-colors border border-slate-200"
              >
                Retour aux dossiers
              </Link>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-blue-500">
              <Sparkles size={24} />
            </div>
            <h3 className="font-semibold text-[var(--ink)] mb-2">Une suggestion ?</h3>
            <p className="text-sm text-slate-600 mb-4">
              GlassPilot évolue grâce à vos retours. N'hésitez pas à nous faire part de vos idées d'amélioration !
            </p>
            <a href="mailto:glasspilotcontact@gmail.com" className="text-sm font-semibold text-[var(--blue)] hover:underline">
              Envoyer une suggestion &rarr;
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
