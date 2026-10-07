"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Megaphone, 
  Loader2, 
  FileText,
  AlertTriangle,
  Clock
} from 'lucide-react';
import clsx from 'clsx';

import Link from 'next/link';

export default function GaragisteActualitesPage() {
  const [actualites, setActualites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActualites();
  }, []);

  const fetchActualites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('actualites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActualites(data || []);
    } catch (err) {
      console.error('Erreur chargement actualités:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full relative animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--blue)]/10 flex items-center justify-center border border-[var(--blue)]/20 shrink-0">
            <Megaphone className="text-[var(--blue)]" size={24} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif text-[var(--ink)]">Actualités</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Toutes les dernières informations et annonces de GlassPilot.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--blue)]" />
        </div>
      ) : actualites.length === 0 ? (
        <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] shadow-md p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
            <Megaphone size={28} className="text-slate-300" />
          </div>
          <h3 className="text-base font-bold text-[var(--ink)] mb-1">Aucune actualité</h3>
          <p className="text-xs text-[#64748B] font-semibold max-w-sm">
            Il n'y a aucune nouvelle annonce pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actualites.map((actu) => {
            return (
              <div key={actu.id} className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] shadow-md overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300 group">
                <div className="p-6 flex-1 flex flex-col">
                  
                  <h3 className="text-lg font-bold text-[var(--ink)] mb-2 leading-tight">{actu.titre}</h3>
                  <div className="text-sm text-[#64748B] whitespace-pre-wrap flex-1 mb-4">
                    {actu.contenu}
                  </div>

                  {actu.media_urls && actu.media_urls.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {actu.media_urls.map((url, i) => {
                        const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                        return isImage ? (
                          <img key={i} src={url} alt="PJ" className="h-16 w-16 object-cover rounded-xl border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => window.open(url, '_blank')} />
                        ) : (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="h-16 w-16 bg-slate-50 flex items-center justify-center rounded-xl border border-slate-200 shrink-0 text-slate-500 hover:text-[var(--blue)] hover:bg-indigo-50 transition-colors">
                            <FileText size={20} />
                          </a>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="text-[10px] font-semibold text-slate-400 mt-4 flex items-center justify-between">
                    <span>{new Date(actu.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
