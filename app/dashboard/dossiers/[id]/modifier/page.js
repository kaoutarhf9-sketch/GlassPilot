"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Loader2, Car, 
  AlertCircle, Sparkles, Edit3, Gauge, FileText,
  CheckCircle2, User, Phone, 
  Mail, MapPin, Key,
  ChevronRight, Check
} from 'lucide-react';
import clsx from 'clsx';

const STEPS = [
  { id: 1, label: 'Client', icon: User, desc: 'Coordonnées' },
  { id: 2, label: 'Véhicule', icon: Car, desc: 'Immat. & vitrage' },
];

export default function ModifierDossier() {
  const params = useParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    client_nom: '',
    client_prenom: '',
    client_telephone: '',
    client_email: '',
    client_adresse: '',
    immatriculation: '',
    modele_vehicule: '',
    kilometrage: '',
    type_vitrage: '',
    commentaire: ''
  });

  useEffect(() => {
    if (params?.id) {
      fetchDossier(params.id);
    }
  }, [params?.id]);

  const fetchDossier = async (id) => {
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select(`
          *,
          clients:clients_id (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      const client = data.clients;
      setClientId(client?.id);
      
      setFormData({
        client_nom: client?.nom || '',
        client_prenom: client?.prenom || '',
        client_telephone: client?.telephone || '',
        client_email: client?.email || '',
        client_adresse: client?.adresse || '',
        immatriculation: data.immatriculation || '',
        modele_vehicule: data.modele_vehicule || '',
        kilometrage: data.kilometrage || '',
        type_vitrage: data.type_vitrage || '',
        commentaire: data.commentaire || ''
      });
    } catch (err) {
      console.error('Erreur:', err);
      setError("Impossible de charger le dossier.");
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!formData.client_nom) e.client_nom = 'Obligatoire';
      if (!formData.client_telephone) e.client_telephone = 'Obligatoire';
    }
    if (step === 2) {
      if (!formData.immatriculation) e.immatriculation = 'Obligatoire';
      if (!formData.modele_vehicule) e.modele_vehicule = 'Obligatoire';
      if (!formData.type_vitrage) e.type_vitrage = 'Requis';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep(s => s + 1); };
  const prev = () => { setErrors({}); setStep(s => s - 1); };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) return;
    
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      if (clientId) {
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            nom: formData.client_nom,
            prenom: formData.client_prenom,
            telephone: formData.client_telephone,
            email: formData.client_email,
            adresse: formData.client_adresse
          })
          .eq('id', clientId);

        if (clientError) throw clientError;
      }

      const { error: dossierError } = await supabase
        .from('dossiers')
        .update({
          immatriculation: formData.immatriculation?.toUpperCase(),
          modele_vehicule: formData.modele_vehicule,
          kilometrage: formData.kilometrage ? parseInt(formData.kilometrage) : null,
          type_vitrage: formData.type_vitrage,
          commentaire: formData.commentaire
        })
        .eq('id', params.id);

      if (dossierError) throw dossierError;

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/dossiers/${params.id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Erreur de sauvegarde:', err);
      setError('Une erreur est survenue lors de la modification.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/20 transition-all";
  const textareaClass = "w-full px-4 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/20 transition-all resize-none";
  const labelClass = "block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-2";

  const TYPES_VITRAGE = [
    'Pare-brise', 'Lunette arrière', 'Latérale AV Gauche',
    'Latérale AV Droite', 'Latérale AR Gauche', 'Latérale AR Droite', 
    'Toit pano.', 'Optique phare', 'Autre'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[var(--blue)] rounded-full animate-ping opacity-20"></div>
            <Loader2 size={48} className="animate-spin text-[var(--blue)] mx-auto relative z-10" />
          </div>
          <p className="text-[var(--muted)] font-light">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans flex flex-col">
      
      {/* Effets de fond */}
      <div className="fixed top-0 -left-48 w-96 h-96 bg-[var(--blue)]/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="fixed bottom-0 -right-48 w-96 h-96 bg-[var(--blue)]/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

      {/* Header */}
      <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]/95 backdrop-blur-sm border-b border-[var(--stone)] px-4 py-3 flex items-center justify-between flex-shrink-0 z-10 shadow-md sticky top-0">
        <Link 
          href={`/dashboard/dossiers/${params.id}`} 
          className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--blue)] text-sm font-medium transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Annuler
        </Link>
        
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--blue)]" />
          <span className="text-xs text-[var(--muted)] font-medium">Modification du dossier</span>
        </div>
        
        <div className="w-16"></div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        
        {/* STEPPER */}
        <div className="w-full md:w-80 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]/50 backdrop-blur-sm border-b md:border-b-0 md:border-r border-[var(--stone)] p-4 md:p-6 flex-shrink-0 overflow-x-auto">
          <div className="flex md:flex-col gap-3 md:gap-4 min-w-max md:min-w-0">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                    isActive && "bg-[var(--blue)] text-white shadow-md",
                    isCompleted && "bg-emerald-100 text-emerald-600",
                    !isActive && !isCompleted && "bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] text-[var(--muted)]"
                  )}>
                    {isCompleted ? (
                      <Check size={18} className="text-emerald-600" />
                    ) : (
                      <Icon size={18} className={isActive ? "text-white" : "text-[var(--muted)]"} />
                    )}
                  </div>
                  <div className="hidden md:block">
                    <p className={clsx(
                      "text-xs font-bold uppercase tracking-wider",
                      isActive ? "text-[var(--blue)]" : "text-[var(--muted)]"
                    )}>
                      Étape {s.id}
                    </p>
                    <p className={clsx(
                      "text-sm font-semibold",
                      isActive ? "text-[var(--ink)]" : "text-[var(--muted)]"
                    )}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">{s.desc}</p>
                  </div>
                  <div className="block md:hidden">
                    <p className={clsx(
                      "text-sm font-semibold",
                      isActive ? "text-[var(--blue)]" : "text-[var(--muted)]"
                    )}>
                      {s.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FORMULAIRE */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            
            {/* Titre de l'étape */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-[var(--blue)] rounded-lg flex items-center justify-center">
                  {step === 1 && <User size={16} className="text-white" />}
                  {step === 2 && <Car size={16} className="text-white" />}
                </div>
                <h2 className="text-2xl md:text-3xl font-serif text-[var(--ink)]">
                  {STEPS[step-1].label}
                </h2>
              </div>
              <p className="text-[var(--muted)] text-sm ml-10">
                {STEPS[step-1].desc}
              </p>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-sm text-rose-600">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-sm text-emerald-600">
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
                <span>Modifications enregistrées ! Redirection...</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              
              {/* STEP 1 : CLIENT */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl shadow-md border border-[var(--stone)] p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Nom complet *</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input 
                            type="text" 
                            name="client_nom" 
                            value={formData.client_nom} 
                            onChange={handleChange} 
                            className={clsx(inputClass, "pl-10", errors.client_nom && "border-rose-400")}
                            placeholder="Dupont Jean"
                          />
                        </div>
                        {errors.client_nom && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Prénom</label>
                        <input 
                          type="text" 
                          name="client_prenom" 
                          value={formData.client_prenom} 
                          onChange={handleChange} 
                          className={inputClass}
                          placeholder="Jean"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Téléphone *</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input 
                            type="tel" 
                            name="client_telephone" 
                            value={formData.client_telephone} 
                            onChange={handleChange} 
                            className={clsx(inputClass, "pl-10", errors.client_telephone && "border-rose-400")}
                            placeholder="06 12 34 56 78"
                          />
                        </div>
                        {errors.client_telephone && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input 
                            type="email" 
                            name="client_email" 
                            value={formData.client_email} 
                            onChange={handleChange} 
                            className={clsx(inputClass, "pl-10")}
                            placeholder="client@email.com"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>Adresse</label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input 
                            type="text" 
                            name="client_adresse" 
                            value={formData.client_adresse} 
                            onChange={handleChange} 
                            className={clsx(inputClass, "pl-10")}
                            placeholder="123 rue de la Paix, 75000 Paris"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 : VÉHICULE */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl shadow-md border border-[var(--stone)] p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className={labelClass}>Immatriculation *</label>
                        <div className="relative">
                          <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input 
                            type="text" 
                            name="immatriculation" 
                            value={formData.immatriculation} 
                            onChange={handleChange} 
                            className={clsx(inputClass, "pl-10 uppercase", errors.immatriculation && "border-rose-400")}
                            placeholder="AB-123-CD"
                          />
                        </div>
                        {errors.immatriculation && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Modèle *</label>
                        <input 
                          type="text" 
                          name="modele_vehicule" 
                          value={formData.modele_vehicule} 
                          onChange={handleChange} 
                          className={clsx(inputClass, errors.modele_vehicule && "border-rose-400")}
                          placeholder="Peugeot 208"
                        />
                        {errors.modele_vehicule && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Kilométrage</label>
                        <div className="relative">
                          <Gauge size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input 
                            type="number" 
                            name="kilometrage" 
                            value={formData.kilometrage} 
                            onChange={handleChange} 
                            className={clsx(inputClass, "pl-10")}
                            placeholder="45000"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">km</span>
                        </div>
                      </div>
                      <div className="md:col-span-3">
                        <label className={labelClass}>Type de vitrage *</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                          {TYPES_VITRAGE.map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFormData({ ...formData, type_vitrage: type })}
                              className={clsx(
                                'px-3 py-2 rounded-xl text-xs font-medium transition-all border',
                                formData.type_vitrage === type
                                  ? 'border-[#1454FF] bg-[var(--blue)]/10 text-[var(--blue)] shadow-md'
                                  : 'border-[var(--stone)] text-[var(--muted)] hover:border-[#1454FF] hover:bg-[var(--blue)]/10/50'
                              )}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        {errors.type_vitrage && <p className="text-rose-500 text-xs mt-2">Veuillez sélectionner un type de vitrage</p>}
                      </div>
                    </div>

                    <div className="mt-5">
                      <label className={labelClass}>Notes complémentaires</label>
                      <textarea 
                        name="commentaire" 
                        value={formData.commentaire} 
                        onChange={handleChange} 
                        rows="3" 
                        className={textareaClass}
                        placeholder="Informations supplémentaires pour l'atelier..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button 
                    type="button" 
                    onClick={prev}
                    className="flex-1 md:flex-none md:w-32 py-3 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-xl text-[var(--muted)] font-medium hover:bg-[var(--white)]/40 hover:border-[#1454FF] transition-all"
                  >
                    Retour
                  </button>
                )}
                
                {step < STEPS.length ? (
                  <button 
                    type="button" 
                    onClick={next}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--blue)] hover:bg-[#0ea5e9] text-white rounded-xl font-medium transition-all shadow-md shadow-[#1454FF]/25"
                  >
                    Continuer <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-md shadow-emerald-600/25 disabled:opacity-70"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                )}
              </div>

            </form>

            {/* Message info */}
            <div className="mt-6 p-4 bg-[var(--blue)]/10 rounded-xl border border-[#1454FF]/20">
              <p className="text-xs text-[var(--blue)] text-center">
                Les informations assurance, sinistre et rendez-vous sont gérées par votre gestionnaire.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}