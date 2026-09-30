"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Loader2, 
  Image as ImageIcon,
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
  Upload,
  Globe,
  Wrench,
  UserCheck
} from 'lucide-react';
import clsx from 'clsx';

export default function AdminActualitesPage() {
  const [actualites, setActualites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [cible, setCible] = useState('tous');
  const [files, setFiles] = useState([]);
  
  useEffect(() => {
    fetchActualites();
  }, []);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      showToastMsg('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titre.trim() || !contenu.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous n'êtes pas connecté");

      const uploadedUrls = [];

      // Upload files
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('actualites_media')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Erreur upload:', uploadError);
          throw new Error(`Erreur lors du téléchargement de ${file.name}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('actualites_media')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      // Insert News
      const { error: insertError } = await supabase
        .from('actualites')
        .insert([{
          titre,
          contenu,
          cible,
          media_urls: uploadedUrls,
          auteur_id: user.id
        }]);

      if (insertError) throw insertError;

      // ENVOI DES NOTIFICATIONS
      try {
        let notifsToInsert = [];
        const shortMessage = contenu.length > 80 ? contenu.substring(0, 80) + '...' : contenu;

        // 1. Garagistes
        if (cible === 'tous' || cible === 'garagistes') {
          const { data: garages } = await supabase.from('garages').select('id');
          if (garages) {
            garages.forEach(g => {
              notifsToInsert.push({
                garage_id: g.id,
                type: 'actualite',
                title: `Nouvelle actualité: ${titre}`,
                message: shortMessage,
                link: '/dashboard/actualites'
              });
            });
          }
        }

        // 2. Gestionnaires
        if (cible === 'tous' || cible === 'gestionnaires') {
          const { data: gestionnaires } = await supabase.from('gestionnaires').select('id');
          if (gestionnaires) {
            gestionnaires.forEach(g => {
              notifsToInsert.push({
                gestionnaire_id: g.id,
                type: 'actualite',
                title: `Nouvelle actualité: ${titre}`,
                message: shortMessage,
                link: '/gestionnaire/actualites'
              });
            });
          }
        }

        if (notifsToInsert.length > 0) {
          // On insère par lots si trop grand, mais pour l'instant un seul appel suffit
          await supabase.from('notifications').insert(notifsToInsert);
        }
      } catch (notifErr) {
        console.error("Erreur d'envoi des notifications:", notifErr);
      }

      showToastMsg('Actualité publiée avec succès !');
      setShowModal(false);
      
      // Reset form
      setTitre('');
      setContenu('');
      setCible('tous');
      setFiles([]);
      
      // Refresh list
      fetchActualites();
    } catch (err) {
      console.error(err);
      showToastMsg(err.message || 'Erreur de publication', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette actualité ?')) return;

    try {
      const { error } = await supabase
        .from('actualites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setActualites(prev => prev.filter(a => a.id !== id));
      showToastMsg('Actualité supprimée');
    } catch (err) {
      console.error(err);
      showToastMsg('Erreur lors de la suppression', 'error');
    }
  };

  const getCibleInfo = (c) => {
    switch(c) {
      case 'garagistes': return { label: 'Garagistes uniquement', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'gestionnaires': return { label: 'Gestionnaires uniquement', icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
      default: return { label: 'Publique (Tous)', icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full relative animate-in fade-in duration-500">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={clsx(
            "rounded-2xl shadow-2xl p-4 w-[340px] flex items-center gap-3 border transition-all",
            toast.type === 'success' 
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-emerald-900/5 shadow-xl" 
              : "bg-rose-50/90 border-rose-200 text-rose-900 shadow-rose-900/5 shadow-xl"
          )}>
            <div className={clsx(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
              toast.type === 'success' ? "bg-emerald-100 border-emerald-200 text-emerald-600" : "bg-rose-100 border-rose-200 text-rose-600"
            )}>
              {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 p-1">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--white)] p-6 sm:p-8 rounded-3xl border border-[var(--stone)] shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#18CDEC]/10 flex items-center justify-center border border-[#18CDEC]/20 shrink-0">
            <Megaphone className="text-[#3B0FAA]" size={24} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif-premium text-[#0A0030]">Actualités & Annonces</h2>
            <p className="text-xs font-semibold text-[#64748B] mt-1.5">
              Publiez des mises à jour pour les garagistes et les gestionnaires.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#18CDEC] hover:bg-[#0fd0f0] text-[#0A0030] px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus size={16} />
          Créer une annonce
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[#18CDEC]" />
        </div>
      ) : actualites.length === 0 ? (
        <div className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] shadow-md p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-[#E6FAFC] border border-[#18CDEC]/20 flex items-center justify-center mb-4">
            <Megaphone size={28} className="text-[#3B0FAA]" />
          </div>
          <h3 className="text-base font-bold text-[#0A0030] mb-1">Aucune actualité</h3>
          <p className="text-xs text-[#64748B] font-semibold max-w-sm mb-6">
            Vous n'avez pas encore publié d'annonces. Créez-en une pour informer vos équipes.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-bold text-[#3B0FAA] hover:text-[#18CDEC] transition-colors flex items-center gap-1"
          >
            <Plus size={14} /> Publier la première actualité
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actualites.map((actu) => {
            const cibleInfo = getCibleInfo(actu.cible);
            const CibleIcon = cibleInfo.icon;
            
            return (
              <div key={actu.id} className="bg-[var(--white)] rounded-3xl border border-[var(--stone)] shadow-md overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-300 group">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ring-1 ring-inset", cibleInfo.bg, cibleInfo.color, cibleInfo.border)}>
                      <CibleIcon size={10} />
                      {cibleInfo.label}
                    </span>
                    <button 
                      onClick={() => handleDelete(actu.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Supprimer l'actualité"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-bold text-[#0A0030] mb-2 leading-tight">{actu.titre}</h3>
                  <div className="text-xs text-[#64748B] whitespace-pre-wrap flex-1 mb-4">
                    {actu.contenu}
                  </div>

                  {actu.media_urls && actu.media_urls.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {actu.media_urls.map((url, i) => {
                        const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                        return isImage ? (
                          <img key={i} src={url} alt="PJ" className="h-12 w-12 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer hover:opacity-80" onClick={() => window.open(url, '_blank')} />
                        ) : (
                          <a key={i} href={url} target="_blank" rel="noreferrer" className="h-12 w-12 bg-slate-50 flex items-center justify-center rounded-lg border border-slate-200 shrink-0 text-slate-500 hover:text-[#3B0FAA] hover:bg-indigo-50">
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

      {/* Modal Création */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#0A0030]/40 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <div className="bg-[var(--white)] rounded-3xl shadow-2xl max-w-xl w-full relative z-10 animate-in zoom-in-95 duration-200 border border-[var(--stone)] flex flex-col max-h-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-[#0A0030]">Rédiger une annonce</h3>
              <button onClick={() => !submitting && setShowModal(false)} className="p-2 text-slate-400 hover:text-[#0A0030] rounded-xl hover:bg-slate-50 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
              
              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Titre de l'annonce</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mise à jour de la plateforme..."
                  value={titre}
                  onChange={e => setTitre(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-[#0A0030] placeholder-slate-400 focus:ring-2 focus:ring-[#18CDEC]/30 focus:border-[#18CDEC] transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Détails de l'actualité..."
                  value={contenu}
                  onChange={e => setContenu(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-[#0A0030] placeholder-slate-400 focus:ring-2 focus:ring-[#18CDEC]/30 focus:border-[#18CDEC] transition-all outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Audience cible</label>
                <select
                  value={cible}
                  onChange={e => setCible(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0A0030] focus:ring-2 focus:ring-[#18CDEC]/30 focus:border-[#18CDEC] transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="tous">🌍 Publique (Tout le monde)</option>
                  <option value="garagistes">🔧 Garagistes uniquement</option>
                  <option value="gestionnaires">👥 Gestionnaires uniquement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Pièces jointes (Optionnel)</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-[#E6FAFC] text-[#3B0FAA] hover:bg-[#18CDEC]/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors">
                    <Upload size={16} />
                    Ajouter des fichiers
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                  <span className="text-xs text-slate-400 font-medium">Images, PDF...</span>
                </div>
                
                {files.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {files.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600">
                        <ImageIcon size={14} className="text-slate-400" />
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-rose-500 ml-1">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#0A0030] hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[#18CDEC] hover:bg-[#0fd0f0] text-[#0A0030] px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#18CDEC]/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Publication...</>
                  ) : (
                    'Publier l\'actualité'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
