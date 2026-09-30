"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Archive, Calendar, FileText, Loader2, ChevronRight,
  Sparkles, Trash2, RefreshCw, Clock, Building2
} from 'lucide-react';

export default function ArchivesPage() {
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: gestionnaireData, error: gError } = await supabase
        .from('gestionnaires')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (gError || !gestionnaireData) {
        throw new Error("Impossible de récupérer les informations du gestionnaire");
      }

      const gestionnaireId = gestionnaireData.id;

      const { data, error } = await supabase
        .from('dossiers')
        .select(`*,
 clients (nom, prenom, telephone),
 garages (nom_garage)`)
        .eq('gestionnaire_id', gestionnaireId)
        .or('statut.eq.reglement_en_cours,statut.eq.termine')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const filtered = (data || []).filter(d => {
        if (d.statut === 'reglement_en_cours') return true;
        if (d.statut === 'termine') return true;
        return false;
      });

      setArchives(filtered);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreDossier = async (id) => {
    setRestoring(id);
    try {
      // 1. Lire notes pour trouver previous_status
      const { data: dossierData, error: fetchError } = await supabase
        .from('dossiers')
        .select('notes')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

      const notesObj = JSON.parse(dossierData?.notes || '{}');
      const previousStatus = notesObj.previous_status || 'en_cours';

      // 2. Nettoyer previous_status de l'objet notes
      const updatedNotesObj = { ...notesObj };
      delete updatedNotesObj.previous_status;

      // 3. Restaurer le statut et mettre à jour les notes
      const { error } = await supabase
        .from('dossiers')
        .update({ 
          statut: previousStatus,
          notes: JSON.stringify(updatedNotesObj)
        })
        .eq('id', id);

      if (error) throw error;

      // Retirer des archives
      setArchives(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Erreur restauration:', error);
    } finally {
      setRestoring(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={48} className="animate-spin text-[var(--blue)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* En-tête */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[var(--white)] shadow-md rounded-full px-4 py-2 mb-6 border border-[var(--stone)]">
          <Archive size={14} className="text-[var(--blue)]" />
          <span className="text-xs font-medium text-[var(--blue)] uppercase tracking-wider">Archives</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-[var(--ink)] mb-2">Archives</h1>
        <p className="text-[var(--muted)] font-light">Dossiers réglés (Paiement reçu) ou terminés depuis plus de 30 jours</p>
      </div>

      {/* Statistiques */}
      <div className="bg-gradient-to-r from-[#EEF2FF] to-white rounded-2xl p-5 border border-[#1454FF]/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
            <Archive size={24} className="text-[var(--blue)]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--ink)]">{archives.length}</p>
            <p className="text-xs text-[var(--muted)]">dossiers archivés</p>
          </div>
        </div>
      </div>

      {/* Liste des archives */}
      {archives.length === 0 ? (
        <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] p-12 text-center">
          <Archive size={48} className="text-[var(--muted)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--muted)] font-medium">Aucun dossier archivé</p>
          <p className="text-sm text-[var(--muted)] mt-1">Les dossiers réglés ou terminés depuis plus de 30 jours apparaîtront ici</p>
        </div>
      ) : (
        <div className="bg-[var(--white)] rounded-2xl border border-[var(--stone)] shadow-md overflow-hidden">
          <div className="divide-y divide-[#F4F3EF]">
            {archives.map((archive) => (
              <div key={archive.id} className="p-5 hover:bg-[var(--white)]/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--white)] rounded-xl flex items-center justify-center">
                      <FileText size={16} className="text-[var(--muted)]" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-[var(--ink)]">{archive.numero}</p>
                      <p className="text-sm text-[var(--muted)] mt-1">
                        <span className="font-medium">{archive.garages?.nom_garage}</span> • 
                        {archive.clients?.prenom} {archive.clients?.nom}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted)]">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {new Date(archive.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 size={10} /> {archive.modele_vehicule}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => restoreDossier(archive.id)}
                      disabled={restoring === archive.id}
                      className="px-4 py-2 bg-[var(--blue)]/10 hover:bg-[var(--blue)] text-[var(--blue)] hover:text-[var(--ink)] rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {restoring === archive.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      Restaurer
                    </button>
                    <Link 
                      href={`/gestionnaire/dossiers/${archive.id}`}
                      className="px-4 py-2 bg-[var(--white)] border border-[var(--stone)] hover:border-[#1454FF] text-[var(--muted)] hover:text-[var(--blue)] rounded-xl text-sm font-medium transition-all flex items-center gap-1"
                    >
                      Voir <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}