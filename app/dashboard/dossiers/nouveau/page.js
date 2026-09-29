"use client";

import { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, User, Car,
  FileText, Upload, X, Save, AlertCircle,
  Sparkles, Clock, Phone, Mail, MapPin, Key, Gauge,
  Building2, Calendar, Gift, Euro, ImageIcon, ShieldCheck,
  Star, Crown, Camera, Image, Loader2, CheckCircle2
} from 'lucide-react';
import clsx from 'clsx';

const STEPS = [
  { id: 1, label: 'Client',    icon: User, desc: 'Coordonnées du client' },
  { id: 2, label: 'Véhicule',  icon: Car,  desc: 'Immatriculation & vitrage' },
  { id: 3, label: 'Documents', icon: FileText, desc: 'Photos & attestation' },
];

const TYPES_VITRAGE = [
  'Pare-brise', 'Lunette arrière', 'Latérale AV Gauche',
  'Latérale AV Droite', 'Latérale AR Gauche',
  'Latérale AR Droite', 'Toit pano.', 'Optique phare', 'Autre',
];

const inputClass = "w-full px-4 py-2.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all";
const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";
const requiredMark = <span className="text-rose-500 ml-1">*</span>;

function Field({ label, required, children, error }) {
  return (
    <div className="w-full">
      <label className={labelClass}>{label}{required && requiredMark}</label>
      {children}
      {error && (
        <p className="text-rose-500 text-xs mt-1 flex items-center gap-1 font-medium">
          <AlertCircle size={12}/>{error}
        </p>
      )}
    </div>
  );
}

function FileUpload({ label, hint, accept = '.pdf,.jpg,.jpeg,.png', onChange, file, optional }) {
  const ref = useRef();
  const isImage = file?.type?.startsWith('image/');
  const isPdf = file?.type === 'application/pdf';
  
  return (
    <div className="w-full">
      <label className={labelClass}>{label}{optional && <span className="text-slate-400 text-xs font-normal ml-1">(optionnel)</span>}</label>
      <div
        onClick={() => ref.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all text-center group flex flex-col items-center justify-center h-28',
          file ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
        )}
      >
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files[0])} />
        {file ? (
          <div className="flex flex-col items-center w-full px-2">
            {isPdf ? (
              <FileText size={24} className="text-indigo-600 mb-2" />
            ) : (
              <ImageIcon size={24} className="text-indigo-600 mb-2" />
            )}
            <p className="text-xs font-medium text-slate-800 truncate w-full">{file.name}</p>
            <div className="flex items-center justify-between w-full mt-2">
              <span className="text-[10px] font-medium text-slate-500">{(file.size / 1024).toFixed(0)} KB</span>
              <button 
                type="button" 
                onClick={e => { e.stopPropagation(); onChange(null); }} 
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <Upload size={20} className="text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
            <p className="text-xs font-medium text-slate-700">Importer un fichier</p>
            <p className="text-[10px] font-medium text-slate-400 mt-1">{hint}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function NouveauDossier() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [garageId, setGarageId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [stock, setStock] = useState({ simple: 0, prestige: 0 });
  const [selectedType, setSelectedType] = useState('simple');

  const [client, setClient] = useState({ 
    nom_societe: '', prenom: '', email: '', telephone: '', 
    adresse: '', code_postal: '', ville: '' 
  });
  
  const [vehicule, setVehicule] = useState({ 
    immatriculation: '', kilometrage: '', modele: '', 
    type_vitrage: '', commentaire: '',
    num_sinistre: '', date_sinistre: '', franchise_montant: '0',
    assurance_telephone: '', assurance_email: ''
  });
  
  const [docs, setDocs] = useState({ 
    attestation_assurance: null,
    carte_grise: null,
    controle_technique: null,
    photo_vehicule: null, 
    photo_impact: null,
    photo_avant: null,
    photo_apres: null
  });
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  
  const [showScanner, setShowScanner] = useState(false);
  const [scannerType, setScannerType] = useState(null);
  const webcamRef = useRef(null);
  const [cameraError, setCameraError] = useState(false);

  const handleOpenScanner = (type) => {
    if (window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setScannerType(type);
      setShowScanner(true);
    } else {
      const fallbackInput = document.getElementById(`native_camera_fallback_${type}`);
      if (fallbackInput) fallbackInput.click();
    }
  };

  const captureScanner = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const arr = imageSrc.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], `scan_${scannerType}_${Date.now()}.${mime.split('/')[1]}`, { type: mime });
        handleFile({ target: { files: [file] } }, scannerType);
        setShowScanner(false);
        setScannerType(null);
        setCameraError(false);
      }
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchGarageId();
  }, []);

  const fetchGarageId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/connexion');

      const { data: garage } = await supabase
        .from('garages')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();
      
      if (!garage) {
        router.push('/dashboard/onboarding');
        return;
      }

      setGarageId(garage.id);
        
        // Récupérer le token de session Supabase pour l'authentification
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/api/get-stock', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        const stockData = await res.json();
        
        if (res.ok) {
          setStock({
            simple: stockData.simple,
            prestige: stockData.prestige
          });
        } else {
          console.error("Erreur de récupération du stock via API:", stockData.error);
        }

    } catch (err) {
      console.error("Erreur d'initialisation:", err);
    }
  };

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!client.nom_societe) e.nom_societe = 'Obligatoire';
      if (!client.telephone) e.telephone = 'Obligatoire';
      if (!client.adresse) e.adresse = 'Obligatoire';
      if (!client.code_postal) e.code_postal = 'Obligatoire';
      if (!client.ville) e.ville = 'Obligatoire';
    }
    if (step === 2) {
      if (!vehicule.type_vitrage) e.type_vitrage = 'Requis';
      
      if (selectedType === 'simple' || selectedType === 'prestige') {
        if (!vehicule.immatriculation && selectedType === 'simple') e.immatriculation = 'Obligatoire';
        if (!vehicule.modele && selectedType === 'simple') e.modele = 'Obligatoire';
        
        if (selectedType === 'simple') {
          if (!vehicule.date_sinistre) e.date_sinistre = 'Obligatoire';
          if (!vehicule.num_sinistre) e.num_sinistre = 'Obligatoire';
          if (!vehicule.assurance_telephone) e.assurance_telephone = 'Obligatoire';
          if (!vehicule.assurance_email) e.assurance_email = 'Obligatoire';
        }
      }

      // Validation du stock de jetons
      if (!stock || stock[selectedType] < 1) {
        e.token = 'Solde de jetons insuffisant';
        alert(`Vous n'avez pas de jeton ${selectedType === 'simple' ? 'Simple' : 'Prestige'} en réserve pour continuer. Veuillez en acheter un.`);
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { 
    if (validateStep()) setStep(s => s + 1); 
  };
  
  const prev = () => { 
    setErrors({}); 
    setStep(s => s - 1); 
  };

  const handleSubmit = async () => {
    if (!garageId) {
      alert("Erreur: Impossible d'identifier le garage connecté.");
      return;
    }

    if (!stock || stock[selectedType] < 1) {
      alert(`Vous n'avez pas de jeton ${selectedType === 'simple' ? 'Simple' : 'Prestige'} en réserve. Veuillez en acheter un.`);
      return;
    }

    if (selectedType === 'prestige') {
      if (!docs.attestation_assurance || !docs.carte_grise) {
        alert("L'attestation d'assurance et la carte grise sont OBLIGATOIRES pour créer un dossier Prestige.");
        return;
      }
    }

    setLoading(true);
    try {
      // 0. Sécuriser et déduire 1 jeton du stock via API sécurisée (pour contourner les limitations RLS)
      const { data: { session } } = await supabase.auth.getSession();
      const deductRes = await fetch('/api/deduct-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ garageId, type: selectedType })
      });
      
      const deductData = await deductRes.json();
      if (!deductRes.ok) {
        throw new Error(deductData.error || `Vous n'avez pas de jeton ${selectedType === 'simple' ? 'Simple' : 'Prestige'} disponible.`);
      }

      // 1. Création du client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{
          garage_id: garageId,
          nom: client.nom_societe, 
          prenom: client.prenom, 
          email: client.email, 
          telephone: client.telephone, 
          adresse: `${client.adresse}, ${client.code_postal} ${client.ville}`,
        }])
        .select()
        .single();
        
      if (clientError) throw clientError;

      // 2. Création du numéro de dossier
      const numero = `DOS-${Date.now().toString().slice(-6).toUpperCase()}`;
      
      // 3. Création du dossier
      const { data: dossierData, error: dossierError } = await supabase
        .from('dossiers')
        .insert([{
          numero, 
          garage_id: garageId,
          clients_id: clientData.id, 
          immatriculation: vehicule.immatriculation?.toUpperCase(), 
          modele_vehicule: vehicule.modele, 
          kilometrage: vehicule.kilometrage ? parseInt(vehicule.kilometrage) : null, 
          type_vitrage: vehicule.type_vitrage, 
          commentaire: vehicule.commentaire, 
          statut: 'en_attente', 
          type: selectedType, 
          montant: 0,
          num_sinistre: selectedType === 'simple' ? vehicule.num_sinistre : null,
          date_sinistre: selectedType === 'simple' ? vehicule.date_sinistre || null : null,
          num_contrat: vehicule.num_contrat || vehicule.num_sinistre || null,
          franchise_montant: selectedType === 'simple' ? parseFloat(vehicule.franchise_montant) || 0 : 0,
          notes: JSON.stringify({
            assurance_telephone: vehicule.assurance_telephone,
            assurance_email: vehicule.assurance_email,
            assurance_nom_ocr: vehicule.nom_assurance || null
          })
        }])
        .select()
        .single();
        
      if (dossierError) throw dossierError;

      // 4. Upload des documents (optionnels)
      const uploads = Object.entries(docs).filter(([, file]) => file !== null);
      for (const [key, file] of uploads) {
        const ext = file.name.split('.').pop();
        const path = `dossiers/${dossierData.id}/${key}_${Date.now()}.${ext}`;
        await supabase.storage.from('documents').upload(path, file);
      }
      
      router.push('/dashboard/dossiers?success=true');
    } catch (err) {
      console.error("Erreur détaillée:", err);
      alert('Erreur lors de la création du dossier. Vérifiez la console.');
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) return resolve(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new globalThis.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1280;
          if (width > height && width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.85);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleFile = async (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setDocs(prev => ({ ...prev, [type]: file }));
      
      // LOGIQUE D'OCR POUR PRESTIGE
      if (selectedType === 'prestige' && (type === 'carte_grise' || type === 'attestation_assurance')) {
        setIsScanning(true);
        setScanMessage(type === 'carte_grise' ? 'Analyse de la Carte Grise en cours...' : "Analyse de l'Attestation en cours...");
        
        try {
          const fileToUpload = await compressImage(file);
          const formData = new FormData();
          formData.append('file', fileToUpload);
          formData.append('type', type);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

          const response = await fetch('/api/ocr', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            
            // Mise à jour des champs avec les données extraites
            if (data.immatriculation || data.modele || data.num_contrat || data.nom_assurance) {
              setVehicule(prev => ({ 
                ...prev, 
                immatriculation: data.immatriculation || prev.immatriculation,
                modele: data.modele || prev.modele,
                num_sinistre: data.num_contrat || prev.num_sinistre,
                num_contrat: data.num_contrat || prev.num_contrat,
                nom_assurance: data.nom_assurance || prev.nom_assurance
              }));
            } else {
              alert("L'IA n'a pas réussi à lire clairement d'informations sur ce document. Veuillez vérifier la netteté ou saisir manuellement.");
            }
          } else {
            const errData = await response.json().catch(() => ({}));
            console.error("L'OCR a retourné une erreur:", errData, response.status);
            alert(`Une erreur technique s'est produite lors de la lecture du document (${errData.error || response.statusText || 'Format non supporté ou fichier corrompu'}). Veuillez le saisir manuellement.`);
          }
        } catch (error) {
          console.error("Erreur lors de l'OCR:", error);
          alert("Impossible de contacter le serveur pour lire le document.");
        } finally {
          setIsScanning(false);
          setScanMessage('');
        }
      }
    }
  };
  const setC = (k, v) => { setClient(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };
  const setV = (k, v) => { setVehicule(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[var(--blue)] rounded-full animate-ping opacity-20"></div>
            <div className="w-16 h-16 border-4 border-[#1454FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <p className="text-[var(--muted)]">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans">
      
      {/* Effets de fond */}
      <div className="fixed top-0 -left-48 w-96 h-96 bg-[var(--blue)]/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>
      <div className="fixed bottom-0 -right-48 w-96 h-96 bg-[var(--blue)]/5 rounded-full mix-blend-multiply filter blur-3xl opacity-30 pointer-events-none"></div>

      {/* Top Bar */}
      <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]/95 backdrop-blur-sm border-b border-[var(--stone)] px-4 py-3 flex items-center justify-between flex-shrink-0 z-10 shadow-md sticky top-0">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--blue)] text-sm font-medium transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Quitter
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--blue)]" />
          <span className="font-semibold text-[var(--ink)] text-sm md:text-base">GlassPilot - Nouveau dossier</span>
        </div>
        <div className="w-16"></div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        
        {/* Stepper latéral */}
        <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
          <div className="sticky top-24">
            <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl border border-[var(--stone)] p-6 shadow-md">
              <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-4">Progression</h3>
              <div className="space-y-4">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const isActive = step === s.id;
                  const isCompleted = step > s.id;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className={clsx(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                        isActive ? "bg-[var(--blue)] text-white shadow-md" : 
                        isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-[var(--white)] text-[var(--muted)]"
                      )}>
                        {isCompleted ? <Check size={14} /> : <Icon size={14} />}
                      </div>
                      <div>
                        <p className={clsx("text-xs font-medium", isActive ? "text-[var(--blue)]" : "text-[var(--muted)]")}>
                          Étape {s.id}
                        </p>
                        <p className={clsx("text-sm font-semibold", isActive ? "text-[var(--ink)]" : "text-[var(--muted)]")}>
                          {s.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="mt-4 bg-[var(--white)]/20 backdrop-blur-xl rounded-2xl border border-[var(--stone)] p-4">
              <p className="text-[10px] font-bold text-[var(--blue)] uppercase tracking-wider mb-2">En cours de saisie</p>
              <p className="text-sm font-semibold text-[var(--ink)] truncate">{client.nom_societe || 'Nouveau Client'}</p>
              <p className="text-xs text-[var(--muted)] truncate">{vehicule.immatriculation || 'Véhicule non renseigné'}</p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="flex-1">
          
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-serif text-[var(--ink)]">{STEPS[step-1].label}</h1>
            <p className="text-[var(--muted)] text-sm mt-1">{STEPS[step-1].desc}</p>
          </div>

          <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl border border-[var(--stone)] shadow-md p-6 md:p-8">
            
            {/* STEP 1 : CLIENT */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Nom / Société *</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input className={clsx(inputClass, "pl-10", errors.nom_societe && 'border-rose-400')} value={client.nom_societe} onChange={e => setC('nom_societe', e.target.value)} placeholder="AutoGlass Pro" />
                    </div>
                    {errors.nom_societe && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Prénom</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input className={clsx(inputClass, "pl-10")} value={client.prenom} onChange={e => setC('prenom', e.target.value)} placeholder="Jean" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input type="email" className={clsx(inputClass, "pl-10")} value={client.email} onChange={e => setC('email', e.target.value)} placeholder="client@email.fr" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Téléphone *</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input type="tel" className={clsx(inputClass, "pl-10", errors.telephone && 'border-rose-400')} value={client.telephone} onChange={e => setC('telephone', e.target.value)} placeholder="06 12 34 56 78" />
                    </div>
                    {errors.telephone && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Adresse *</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    <input className={clsx(inputClass, "pl-10", errors.adresse && 'border-rose-400')} value={client.adresse} onChange={e => setC('adresse', e.target.value)} placeholder="123 rue du Commerce" />
                  </div>
                  {errors.adresse && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Code postal *</label>
                    <input className={clsx(inputClass, errors.code_postal && 'border-rose-400')} value={client.code_postal} onChange={e => setC('code_postal', e.target.value)} placeholder="75001" />
                    {errors.code_postal && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Ville *</label>
                    <input className={clsx(inputClass, errors.ville && 'border-rose-400')} value={client.ville} onChange={e => setC('ville', e.target.value)} placeholder="Paris" />
                    {errors.ville && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 : VÉHICULE & JETON */}
            {step === 2 && (
              <div className="space-y-5">
                {/* 1. Choix du Jeton */}
                <div className="pb-5 border-b border-[var(--stone)]">
                  <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-3">Type de dossier & jeton requis *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Dossier Simple */}
                    <button
                      type="button"
                      onClick={() => setSelectedType('simple')}
                      className={clsx(
                        'p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[140px]',
                        selectedType === 'simple'
                          ? 'border-[#1454FF] bg-[var(--blue)]/10/30 text-[var(--ink)] shadow-md'
                          : 'border-[var(--stone)] text-[var(--muted)] hover:border-[#1454FF] hover:bg-[var(--blue)]/10/10'
                      )}
                    >
                      <div className="flex justify-between items-start w-full">
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-1">
                            <Star size={14} className="text-[var(--blue)]" />
                            Dossier Simple
                          </p>
                          <p className="text-[11px] font-medium text-amber-600 mt-0.5">Sans accompagnement gestionnaire</p>
                          <p className="text-[11px] font-light text-[var(--muted)] mt-1.5 leading-relaxed">
                            Vous devez renseigner vous-même toutes les informations de sinistre et d'assurance.
                          </p>
                        </div>
                        <span className={clsx(
                          'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                          stock.simple > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        )}>
                          Solde : {stock.simple}
                        </span>
                      </div>
                      {selectedType === 'simple' && (
                        <div className="absolute bottom-3 right-3 w-4 h-4 bg-[var(--blue)] text-white rounded-full flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </button>

                    {/* Dossier Prestige */}
                    <button
                      type="button"
                      onClick={() => setSelectedType('prestige')}
                      className={clsx(
                        'p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[140px]',
                        selectedType === 'prestige'
                          ? 'border-[#1454FF] bg-[var(--blue)]/10/30 text-[var(--ink)] shadow-md'
                          : 'border-[var(--stone)] text-[var(--muted)] hover:border-[#1454FF] hover:bg-[var(--blue)]/10/10'
                      )}
                    >
                      <div className="flex justify-between items-start w-full">
                        <div>
                          <p className="font-semibold text-sm flex items-center gap-1">
                            <Crown size={14} className="text-[var(--blue)]" />
                            Dossier Prestige
                          </p>
                          <p className="text-[11px] font-medium text-emerald-600 mt-0.5">Le gestionnaire gère tout</p>
                          <p className="text-[11px] font-light text-[var(--muted)] mt-1.5 leading-relaxed">
                            Le gestionnaire s'occupera de l'étape 2 (infos véhicule & assurance) et des envois de messages ("Démarrer travaux", "Dossier envoyé"). Vous devez obligatoirement fournir l'attestation et la carte grise.
                          </p>
                        </div>
                        <span className={clsx(
                          'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0',
                          stock.prestige > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        )}>
                          Solde : {stock.prestige}
                        </span>
                      </div>
                      {selectedType === 'prestige' && (
                        <div className="absolute bottom-3 right-3 w-4 h-4 bg-[var(--blue)] text-white rounded-full flex items-center justify-center">
                          <Check size={10} />
                        </div>
                      )}
                    </button>
                  </div>

                  {stock[selectedType] === 0 && (
                    <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2 text-rose-700 text-xs font-medium">
                        <AlertCircle size={16} className="flex-shrink-0" />
                        <span>Vous n'avez pas de jeton {selectedType === 'simple' ? 'Simple' : 'Prestige'} disponible.</span>
                      </div>
                      <Link
                        href={`/dashboard/abonnement?type=${selectedType}`}
                        className="text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Euro size={12} />
                        Acheter 1 jeton ({selectedType === 'simple' ? '9.60€ TTC' : '30€ TTC'})
                      </Link>
                    </div>
                  )}
                </div>

                {/* 2. Type de vitrage (Toujours visible) */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Type de vitrage *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-1">
                    {TYPES_VITRAGE.map(t => (
                      <button key={t} type="button" onClick={() => setV('type_vitrage', t)}
                        className={clsx('px-3 py-2 rounded-xl text-xs font-medium transition-all border',
                          vehicule.type_vitrage === t ? 'border-[#1454FF] bg-[var(--blue)]/10 text-[var(--blue)] shadow-md' : 'border-[var(--stone)] text-[var(--muted)] hover:border-[#1454FF] hover:bg-[var(--blue)]/10/50'
                        )}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {errors.type_vitrage && <p className="text-rose-500 text-xs mt-2">Veuillez sélectionner un type de vitrage</p>}
                </div>

                {/* 3. Champs supplémentaires (Uniquement pour Simple ou Pré-remplis en Prestige) */}
                {(selectedType === 'simple' || selectedType === 'prestige') && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Immatriculation {selectedType === 'simple' && '*'}</label>
                        <div className="relative">
                          <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input 
                            className={clsx(inputClass, "pl-10 uppercase", isScanning && 'bg-indigo-50 animate-pulse', errors.immatriculation && 'border-rose-400')} 
                            value={vehicule.immatriculation} 
                            onChange={e => setV('immatriculation', e.target.value.toUpperCase())} 
                            placeholder="AB-123-CD" 
                            readOnly={isScanning}
                          />
                        </div>
                        {errors.immatriculation && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Modèle {selectedType === 'simple' && '*'}</label>
                        <input 
                          className={clsx(inputClass, isScanning && 'bg-indigo-50 animate-pulse', errors.modele && 'border-rose-400')} 
                          value={vehicule.modele} 
                          onChange={e => setV('modele', e.target.value)} 
                          placeholder="Peugeot 208" 
                          readOnly={isScanning}
                        />
                        {errors.modele && <p className="text-rose-500 text-xs mt-1">Champ obligatoire</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Kilométrage</label>
                        <div className="relative">
                          <Gauge size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                          <input type="number" className={clsx(inputClass, "pl-10")} value={vehicule.kilometrage} onChange={e => setV('kilometrage', e.target.value)} placeholder="45000" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">km</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Notes complémentaires</label>
                      <textarea rows="3" className={inputClass} placeholder="Infos pour l'atelier, précisions sur l'impact..." value={vehicule.commentaire} onChange={e => setV('commentaire', e.target.value)} />
                    </div>
                    
                    {/* Les informations assurance (Date, N° Sinistre, Contacts) ne sont requises que pour "Simple" */}
                    {selectedType === 'simple' && (
                      <div className="border-t border-[var(--stone)] pt-5 space-y-5">
                        <div className="bg-[var(--white)]/40 rounded-xl p-4 border border-[var(--stone)]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <ShieldCheck size={16} className="text-[var(--blue)]" />
                          <p className="text-sm font-semibold text-[var(--ink)]">Informations Sinistre & Assurance requises</p>
                        </div>
                        <p className="text-xs text-[var(--muted)]">
                          Puisqu'il s'agit d'un dossier Simple, vous devez obligatoirement remplir ces informations clés pour valider sa création.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Date du sinistre *</label>
                          <input
                            type="date"
                            className={clsx(inputClass, errors.date_sinistre && 'border-rose-400')}
                            value={vehicule.date_sinistre}
                            onChange={e => setV('date_sinistre', e.target.value)}
                          />
                          {errors.date_sinistre && <p className="text-rose-500 text-xs mt-1">Date du sinistre obligatoire</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">N° de sinistre *</label>
                          <input
                            type="text"
                            className={clsx(inputClass, errors.num_sinistre && 'border-rose-400')}
                            placeholder="Ex: 3545081056"
                            value={vehicule.num_sinistre}
                            onChange={e => setV('num_sinistre', e.target.value)}
                          />
                          {errors.num_sinistre && <p className="text-rose-500 text-xs mt-1">Numéro de sinistre obligatoire</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Franchise (€)</label>
                          <input
                            type="number"
                            className={inputClass}
                            placeholder="0"
                            value={vehicule.franchise_montant}
                            onChange={e => setV('franchise_montant', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Téléphone assurance *</label>
                          <input
                            type="tel"
                            className={clsx(inputClass, errors.assurance_telephone && 'border-rose-400')}
                            placeholder="Ex: 09 70 80 82 82"
                            value={vehicule.assurance_telephone}
                            onChange={e => setV('assurance_telephone', e.target.value)}
                          />
                          {errors.assurance_telephone && <p className="text-rose-500 text-xs mt-1">Téléphone de l'assurance obligatoire</p>}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-[var(--ink)] uppercase tracking-wide mb-1.5">Email assurance *</label>
                          <input
                            type="email"
                            className={clsx(inputClass, errors.assurance_email && 'border-rose-400')}
                            placeholder="Ex: contact@assurance.fr"
                            value={vehicule.assurance_email}
                            onChange={e => setV('assurance_email', e.target.value)}
                          />
                          {errors.assurance_email && <p className="text-rose-500 text-xs mt-1">Email de l'assurance obligatoire</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 : DOCUMENTS (optionnels/requis) */}
          {step === 3 && (
              <div className="space-y-5">
                <div className="bg-transparent rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-[var(--blue)]" />
                    <p className="text-sm text-[var(--blue)] font-medium">Documents {selectedType === 'prestige' ? 'requis' : 'facultatifs'}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {selectedType === 'prestige' 
                      ? "Pour un dossier Prestige, l'attestation d'assurance et la carte grise sont obligatoires (votre gestionnaire s'en servira pour traiter le dossier)." 
                      : "Ces documents facultatifs aideront votre gestionnaire à traiter le dossier plus rapidement."}
                  </p>
                </div>
                
                {/* Bloc Documents (Carte Grise / Assurance) pour Simple ET Prestige */}
                <div className="border-t border-[var(--stone)] pt-5 space-y-5">
                  <div className="bg-[var(--white)]/40 rounded-xl p-4 border border-[var(--stone)]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Upload size={16} className="text-[var(--blue)]" />
                      <p className="text-sm font-semibold text-[var(--ink)]">Documents du véhicule</p>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {selectedType === 'prestige' 
                        ? 'Scannez la Carte Grise et l\'Attestation d\'Assurance, notre IA va extraire les données pour vous faire gagner du temps.'
                        : 'Veuillez télécharger les documents obligatoires ci-dessous.'}
                    </p>
                  </div>
                  
                  {isScanning && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-center gap-3 mb-4 shadow-inner shadow-indigo-100">
                      <Loader2 size={18} className="animate-spin text-indigo-600" />
                      <span className="text-sm font-semibold text-indigo-700 animate-pulse">{scanMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Upload Assurance */}
                    <div 
                      className="border-2 border-dashed border-[var(--stone)] hover:border-[#1454FF] rounded-2xl p-4 text-center cursor-pointer transition-all bg-[var(--white)]/40 relative"
                      onClick={() => handleOpenScanner('attestation_assurance')}
                    >
                      <input id="native_camera_fallback_attestation_assurance" type="file" className="hidden" accept="image/*,.pdf" capture="environment" onChange={e => handleFile(e, 'attestation_assurance')} />
                      {docs.attestation_assurance ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                          </div>
                          <span className="text-xs font-semibold text-[var(--ink)]">{docs.attestation_assurance.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-[var(--stone)] rounded-full flex items-center justify-center mb-2">
                            <Upload size={16} className="text-[var(--muted)]" />
                          </div>
                          <span className="text-xs font-semibold text-[var(--ink)]">Attestation Assurance *</span>
                          <span className="text-[10px] text-[var(--muted)] mt-1">Carte verte (PDF, JPG)</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Carte Grise */}
                    <div 
                      className="border-2 border-dashed border-[var(--stone)] hover:border-[#1454FF] rounded-2xl p-4 text-center cursor-pointer transition-all bg-[var(--white)]/40 relative"
                      onClick={() => handleOpenScanner('carte_grise')}
                    >
                      <input id="native_camera_fallback_carte_grise" type="file" className="hidden" accept="image/*,.pdf" capture="environment" onChange={e => handleFile(e, 'carte_grise')} />
                      {docs.carte_grise ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                          </div>
                          <span className="text-xs font-semibold text-[var(--ink)]">{docs.carte_grise.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-[var(--stone)] rounded-full flex items-center justify-center mb-2">
                            <Upload size={16} className="text-[var(--muted)]" />
                          </div>
                          <span className="text-xs font-semibold text-[var(--ink)]">Carte Grise *</span>
                          <span className="text-[10px] text-[var(--muted)] mt-1">Certificat (PDF, JPG)</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Controle Technique */}
                    <div className="border-2 border-dashed border-[var(--stone)] hover:border-[#1454FF] rounded-2xl p-4 text-center cursor-pointer transition-all bg-[var(--white)]/40 relative">
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" onChange={e => handleFile(e, 'controle_technique')} />
                      {docs.controle_technique ? (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 size={18} className="text-emerald-600" />
                          </div>
                          <span className="text-xs font-semibold text-[var(--ink)]">{docs.controle_technique.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-[var(--stone)] rounded-full flex items-center justify-center mb-2">
                            <Upload size={16} className="text-[var(--muted)]" />
                          </div>
                          <span className="text-xs font-semibold text-[var(--ink)]">Contrôle Technique</span>
                          <span className="text-[10px] text-[var(--muted)] mt-1">Optionnel (PDF, JPG)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloc Documents (Photos) */}
                <div className="border-t border-[var(--stone)] pt-5 space-y-5">
                  <div className="bg-[var(--white)]/40 rounded-xl p-4 border border-[var(--stone)]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Camera size={16} className="text-[var(--blue)]" />
                      <p className="text-sm font-semibold text-[var(--ink)]">Photos & Constatations (Optionnel)</p>
                    </div>
                    <p className="text-xs text-[var(--muted)]">Ces photos aident à justifier l'intervention auprès de l'assurance.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <FileUpload 
                      label="Photo du véhicule" 
                      hint="Plaque visible" 
                      accept=".jpg,.jpeg,.png" 
                      file={docs.photo_vehicule} 
                      onChange={f => setDocs(p => ({ ...p, photo_vehicule: f }))} 
                      optional 
                    />
                    <FileUpload 
                      label="Photo de l'impact" 
                      hint="Gros plan sur vitrage" 
                      accept=".jpg,.jpeg,.png" 
                      file={docs.photo_impact} 
                      onChange={f => setDocs(p => ({ ...p, photo_impact: f }))} 
                      optional 
                    />
                    <FileUpload 
                      label="Photo avant pose" 
                      hint="État avant travaux" 
                      accept=".jpg,.jpeg,.png" 
                      file={docs.photo_avant} 
                      onChange={f => setDocs(p => ({ ...p, photo_avant: f }))} 
                      optional 
                    />
                    <FileUpload 
                      label="Photo après pose" 
                      hint="Véhicule avec vitrage neuf" 
                      accept=".jpg,.jpeg,.png" 
                      file={docs.photo_apres} 
                      onChange={f => setDocs(p => ({ ...p, photo_apres: f }))} 
                      optional 
                    />
                  </div>
                </div>
                
                <div className="bg-amber-50 rounded-xl p-3 mt-2">
                  <p className="text-xs text-amber-700 flex items-center gap-2">
                    <AlertCircle size={12} />
                    L'attestation d'assurance permet d'accélérer la validation du dossier par l'assureur
                  </p>
                </div>

                <p className="text-xs text-[var(--muted)] text-center pt-4 border-t border-[var(--stone)]">
                  Ces documents seront accessibles à votre gestionnaire pour compléter le dossier
                </p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button type="button" onClick={prev}
                className="flex-1 md:flex-none md:w-32 py-3 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-xl text-[var(--ink)] font-medium hover:bg-[var(--white)]/40 transition-all">
                Retour
              </button>
            )}
            
            {step < STEPS.length ? (
              <button type="button" onClick={next}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium bg-[var(--blue)] hover:bg-[#0ea5e9] transition-all shadow-md shadow-[#1454FF]/25">
                Continuer <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--blue)] text-white rounded-xl font-medium hover:bg-[#0ea5e9] transition-all disabled:opacity-70 shadow-md shadow-[#1454FF]/25">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                {loading ? 'Création...' : 'Créer le dossier'}
              </button>
            )}
          </div>

          <p className="text-xs text-[var(--muted)] text-center mt-4">
            Le dossier sera créé. Votre gestionnaire complétera les informations assurance et sinistre.
          </p>
        </div>
      </div>
      
      {/* SCANNER MODAL */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <h2 className="text-white font-semibold shadow-black drop-shadow-md">
              Scanner {scannerType === 'carte_grise' ? 'la Carte Grise' : 'l\'Attestation'}
            </h2>
            <button 
              onClick={() => { setShowScanner(false); setScannerType(null); setCameraError(false); }}
              className="p-2 bg-white/20 rounded-full text-white backdrop-blur-md"
            >
              <X size={24} />
            </button>
          </div>

          <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
            {!cameraError ? (
              <>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.85}
                  videoConstraints={{ facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }}
                  className="w-full h-full object-cover"
                  onUserMediaError={() => setCameraError(true)}
                />
                {/* Guide d'alignement */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  <div className="w-full max-w-sm aspect-[1/1.4] border-2 border-white/70 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#1454FF] rounded-tl-xl -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#1454FF] rounded-tr-xl -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#1454FF] rounded-bl-xl -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#1454FF] rounded-br-xl -mb-1 -mr-1"></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-white p-6 text-center space-y-4">
                <AlertCircle size={48} className="text-rose-500 mx-auto" />
                <p>Accès à la caméra refusé ou impossible.</p>
                <p className="text-xs text-white/70">Vérifiez les permissions de votre navigateur ou importez un fichier classiquement ci-dessous.</p>
              </div>
            )}
          </div>

          <div className="p-6 pb-10 bg-black flex flex-col items-center gap-4 z-10">
            <button 
              onClick={captureScanner}
              disabled={cameraError}
              className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <div className="w-16 h-16 bg-white rounded-full border-2 border-slate-200 shadow-inner"></div>
            </button>
            
            <label className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-2 cursor-pointer mt-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 transition-colors rounded-full">
              <Upload size={16} /> Ou importer un fichier
              <input 
                type="file" 
                className="hidden" 
                accept="image/*,.pdf" 
                onChange={(e) => { handleFile(e, scannerType); setShowScanner(false); setScannerType(null); setCameraError(false); }} 
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}