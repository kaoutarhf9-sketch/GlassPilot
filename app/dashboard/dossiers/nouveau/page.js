"use client";

import { useEffect, useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { supabase, getValidSession } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Check, User, Car,
  FileText, Upload, X, Save, AlertCircle,
  Sparkles, Phone, Mail, MapPin, Key, Gauge,
  Building2, Calendar, Gift, Euro, ImageIcon, ShieldCheck,
  Star, Crown, Camera, Loader2, CheckCircle2, Plus, ScanLine,
  AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';

const TYPES_VITRAGE = [
  'Pare-brise', 'Lunette arrière', 'Latérale AV Gauche',
  'Latérale AV Droite', 'Latérale AR Gauche',
  'Latérale AR Droite', 'Toit pano.', 'Optique phare',
];

const RAISONS_SINISTRE = [
  'Bris de glace', 'Impact', 'Fissure', 'Choc', 'Vandalisme', 'Autre'
];

// Styles des champs de saisie - FOND CLAIR sur fond sombre (comme la maquette)
const inputClass = "w-full px-4 py-2.5 bg-[#1a2744] border border-[#2a3a5c] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 transition-all";
const inputWithIconClass = "w-full pl-10 pr-4 py-2.5 bg-[#1a2744] border border-[#2a3a5c] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 transition-all";
const labelClass = "block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5";
const iconClass = "absolute left-3 top-1/2 -translate-y-1/2 text-[#00d4ff]";

function DocUploadRow({ label, hint, accept = '.pdf,.jpg,.jpeg,.png', onChange, file, required, onScanClick }) {
  const ref = useRef();
  return (
    <div className="flex items-center gap-3 p-3 bg-[#111c35] border border-[#1e2d4a] rounded-xl">
      <div className="flex-shrink-0 w-8 h-8 bg-[#1a2744] border border-[#2a3a5c] rounded-lg flex items-center justify-center">
        {file ? <CheckCircle2 size={16} className="text-emerald-400" /> : <FileText size={16} className="text-[#00d4ff]" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-200 truncate">{label}{required && <span className="text-rose-400 ml-1">*</span>}</p>
        {file ? (
          <p className="text-[11px] text-emerald-400 truncate">{file.name}</p>
        ) : (
          <p className="text-[11px] text-slate-500">{hint}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onScanClick && (
          <button type="button" onClick={onScanClick} className="p-1.5 bg-[#1a2744] hover:bg-[#00d4ff]/20 border border-[#2a3a5c] rounded-lg transition-colors" title="Scanner">
            <Camera size={13} className="text-[#00d4ff]" />
          </button>
        )}
        <button type="button" onClick={() => ref.current?.click()} className="p-1.5 bg-[#1454FF]/20 hover:bg-[#1454FF]/30 border border-[#1454FF]/40 rounded-lg transition-colors">
          <Upload size={13} className="text-[#6699ff]" />
        </button>
        {file && (
          <button type="button" onClick={() => onChange(null)} className="p-1.5 hover:bg-rose-500/20 rounded-lg transition-colors">
            <X size={13} className="text-slate-500 hover:text-rose-400" />
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files[0])} />
    </div>
  );
}

export default function NouveauDossier() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [garageId, setGarageId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [stock, setStock] = useState({ simple: 0, prestige: 0 });
  const [selectedType, setSelectedType] = useState('simple');
  const [customVitrageMode, setCustomVitrageMode] = useState(false);
  const [customVitrage, setCustomVitrage] = useState('');

  const [client, setClient] = useState({
    nom_societe: '', prenom: '', email: '', telephone: '',
    adresse: '', code_postal: '', ville: ''
  });

  const [vehicule, setVehicule] = useState({
    immatriculation: '', kilometrage: '', modele: '',
    type_vitrage: '', commentaire: '',
    num_sinistre: '', date_sinistre: new Date().toISOString().split('T')[0],
    franchise_montant: '0', nom_assurance: '', num_contrat: '',
    raison_sinistre: '', cadeau: '',
    assurance_telephone: '', assurance_email: ''
  });

  const [docs, setDocs] = useState({
    attestation_assurance: null,
    carte_grise: null,
    controle_technique: null,
    photo_vehicule: null,
    photo_impact: null,
  });

  // State for AI Scanner
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanDoc, setScanDoc] = useState(null); // current doc in the AI scanner zone
  const scanInputRef = useRef();
  const [isDragging, setIsDragging] = useState(false);

  // State for Camera Modal
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
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        const file = new File([u8arr], `scan_${scannerType}_${Date.now()}.${mime.split('/')[1]}`, { type: mime });
        handleDocFile(file, scannerType);
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

      if (!garage) { router.push('/dashboard/onboarding'); return; }
      setGarageId(garage.id);

      const session = await getValidSession();
      const res = await fetch('/api/get-stock', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const stockData = await res.json();
      if (res.ok) setStock({ simple: stockData.simple, prestige: stockData.prestige });
    } catch (err) {
      console.error("Erreur d'initialisation:", err);
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
          let width = img.width; let height = img.height;
          const MAX_DIM = 1280;
          if (width > height && width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
          else if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.85);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  // Runs OCR on a file and populates form fields
  const runOCR = async (file, docType) => {
    setIsScanning(true);
    setScanSuccess(false);
    setScanMessage(docType === 'carte_grise' ? 'Analyse de la Carte Grise...' : "Analyse de l'Attestation d'assurance...");
    try {
      const fileToUpload = await compressImage(file);
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('type', docType);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch('/api/ocr', { method: 'POST', body: formData, signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.immatriculation || data.modele || data.num_contrat || data.nom_assurance) {
          setVehicule(prev => ({
            ...prev,
            immatriculation: data.immatriculation || prev.immatriculation,
            modele: data.modele || prev.modele,
            num_contrat: data.num_contrat || prev.num_contrat,
            num_sinistre: data.num_contrat || prev.num_sinistre,
            nom_assurance: data.nom_assurance || prev.nom_assurance,
          }));
          setScanSuccess(true);
          setScanMessage('✓ Données extraites avec succès !');
          setTimeout(() => { setScanMessage(''); setScanSuccess(false); }, 3000);
        } else {
          setScanMessage("Aucune donnée lisible détectée. Vérifiez la netteté du document.");
          setTimeout(() => setScanMessage(''), 4000);
        }
      } else {
        setScanMessage("Erreur lors de l'analyse. Veuillez saisir manuellement.");
        setTimeout(() => setScanMessage(''), 4000);
      }
    } catch (err) {
      console.error("Erreur OCR:", err);
      setScanMessage("Impossible de contacter le serveur d'analyse.");
      setTimeout(() => setScanMessage(''), 4000);
    } finally {
      setIsScanning(false);
    }
  };

  // Handles drop into the AI scanner zone
  const handleScanDrop = async (file) => {
    if (!file) return;
    setScanDoc(file);
    // Auto-detect type: si c'est une carte grise ou une attestation
    const nameLC = file.name.toLowerCase();
    const docType = nameLC.includes('grise') ? 'carte_grise' : 'attestation_assurance';
    setDocs(prev => ({ ...prev, [docType]: file }));
    await runOCR(file, docType);
  };

  // Handles file for a specific doc slot
  const handleDocFile = async (file, type) => {
    if (!file) { setDocs(prev => ({ ...prev, [type]: null })); return; }
    setDocs(prev => ({ ...prev, [type]: file }));
    if (type === 'carte_grise' || type === 'attestation_assurance') {
      await runOCR(file, type);
    }
  };

  const setC = (k, v) => { setClient(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };
  const setV = (k, v) => { setVehicule(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!client.nom_societe) e.nom_societe = 'Obligatoire';
    if (!client.telephone) e.telephone = 'Obligatoire';
    if (!client.adresse) e.adresse = 'Obligatoire';
    if (!client.code_postal) e.code_postal = 'Obligatoire';
    if (!client.ville) e.ville = 'Obligatoire';
    if (!vehicule.immatriculation) e.immatriculation = 'Obligatoire';
    if (!vehicule.modele) e.modele = 'Obligatoire';
    if (!vehicule.type_vitrage && !customVitrage) e.type_vitrage = 'Requis';
    if (!vehicule.date_sinistre) e.date_sinistre = 'Obligatoire';
    if (!stock || stock[selectedType] < 1) e.token = 'Solde insuffisant';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!garageId) { alert("Erreur: Impossible d'identifier le garage."); return; }
    if (!stock || stock[selectedType] < 1) {
      alert(`Vous n'avez pas de jeton ${selectedType === 'simple' ? 'Simple' : 'Prestige'} disponible.`);
      return;
    }

    setLoading(true);
    try {
      const session = await getValidSession();
      const deductRes = await fetch('/api/deduct-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ garageId, type: selectedType })
      });
      const deductData = await deductRes.json();
      if (!deductRes.ok) throw new Error(deductData.error || 'Jeton indisponible.');

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert([{
          garage_id: garageId,
          nom: client.nom_societe,
          prenom: client.prenom,
          email: client.email,
          telephone: client.telephone,
          adresse: client.adresse,
          code_postal: client.code_postal,
          ville: client.ville,
        }])
        .select().single();
      if (clientError) throw clientError;

      const numero = `DOS-${Date.now().toString().slice(-6).toUpperCase()}`;
      const finalVitrage = customVitrageMode && customVitrage ? customVitrage : vehicule.type_vitrage;

      const { data: dossierData, error: dossierError } = await supabase
        .from('dossiers')
        .insert([{
          numero,
          garage_id: garageId,
          clients_id: clientData.id,
          immatriculation: vehicule.immatriculation?.toUpperCase(),
          modele_vehicule: vehicule.modele,
          kilometrage: vehicule.kilometrage ? parseInt(vehicule.kilometrage) : null,
          type_vitrage: finalVitrage,
          commentaire: vehicule.commentaire,
          statut: 'en_attente',
          type: selectedType,
          montant: 0,
          num_sinistre: vehicule.num_sinistre || null,
          date_sinistre: vehicule.date_sinistre || null,
          num_contrat: vehicule.num_contrat || null,
          franchise_montant: parseFloat(vehicule.franchise_montant) || 0,
          raison_sinistre: vehicule.raison_sinistre || null,
          cadeau: vehicule.cadeau || null,
          notes: JSON.stringify({
            assurance_telephone: vehicule.assurance_telephone,
            assurance_email: vehicule.assurance_email,
            assurance_nom_ocr: vehicule.nom_assurance || null,
          })
        }])
        .select().single();
      if (dossierError) throw dossierError;

      const uploads = Object.entries(docs).filter(([, file]) => file !== null);
      for (const [key, file] of uploads) {
        const ext = file.name.split('.').pop();
        const path = `dossiers/${dossierData.id}/${key}_${Date.now()}.${ext}`;
        await supabase.storage.from('documents').upload(path, file);
      }

      router.push('/dashboard/dossiers?success=true');
    } catch (err) {
      console.error("Erreur:", err);
      alert('Erreur lors de la création : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1454FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] font-sans">

      {/* Top Bar */}
      <div className="bg-[#0d1428] border-b border-[#1e2d4a] px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-[#00d4ff] text-sm font-medium transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Quitter
        </button>
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#00d4ff]" />
          <span className="font-bold text-white text-sm md:text-base tracking-wide">Nouveau dossier</span>
        </div>
        {/* Stock badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className={clsx('px-2.5 py-1 rounded-full font-semibold border', stock.simple > 0 ? 'bg-blue-900/40 border-blue-700/50 text-blue-300' : 'bg-rose-900/40 border-rose-700/50 text-rose-300')}>
            Simple: {stock.simple}
          </span>
          <span className={clsx('hidden sm:inline-flex px-2.5 py-1 rounded-full font-semibold border', stock.prestige > 0 ? 'bg-purple-900/40 border-purple-700/50 text-purple-300' : 'bg-rose-900/40 border-rose-700/50 text-rose-300')}>
            Prestige: {stock.prestige}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* === AI SCANNER ZONE === */}
        <div className="space-y-3">
          {/* Attention banner */}
          <div className="flex items-start gap-2.5 bg-[#1a0000] border border-[#ff4444]/40 rounded-xl px-4 py-3">
            <AlertTriangle size={15} className="text-[#ff6666] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#ff8888] font-medium leading-relaxed">
              <span className="font-bold text-[#ff4444]">ATTENTION :</span> Veillez à ce que l'attestation d'assurance soit lisible. Auquel cas, le scan IA ne fonctionnera pas.
            </p>
          </div>

          {/* Drop Zone */}
          <div
            className={clsx(
              'border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[120px] relative',
              isDragging ? 'border-[#00d4ff] bg-[#00d4ff]/10' : 'border-[#1e4a6a] hover:border-[#00d4ff]/60 bg-[#0d1e35]',
              isScanning && 'pointer-events-none'
            )}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) handleScanDrop(file); }}
            onClick={() => !isScanning && scanInputRef.current?.click()}
          >
            <input ref={scanInputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={e => { if (e.target.files[0]) handleScanDrop(e.target.files[0]); }} />

            {isScanning ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-[#00d4ff] animate-spin" />
                <p className="text-sm font-semibold text-[#00d4ff]">Analyse IA en cours...</p>
                <p className="text-xs text-slate-400">{scanMessage}</p>
              </div>
            ) : scanSuccess ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 size={32} className="text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-400">{scanMessage}</p>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center mb-3">
                  <Upload size={18} className="text-[#00d4ff]" />
                </div>
                <p className="text-sm font-semibold text-slate-200">Glisser votre document ici</p>
                <p className="text-xs text-slate-500 mt-1">ou cliquer pour importer une image ou un PDF</p>
                {scanDoc && <p className="text-xs text-slate-400 mt-2 truncate max-w-xs">{scanDoc.name}</p>}
              </>
            )}
          </div>

          {/* Scan button + warning */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => scanInputRef.current?.click()}
              disabled={isScanning}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1454FF] hover:bg-[#1060ff] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-60 shadow-lg shadow-[#1454FF]/30"
            >
              <ScanLine size={16} />
              Scanner avec IA
            </button>
            <div className="flex items-start gap-2 bg-[#1a1000] border border-[#ff8800]/40 rounded-xl px-4 py-2.5 flex-1">
              <AlertCircle size={14} className="text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-300 leading-relaxed">
                <span className="font-bold text-orange-400">ATTENTION :</span> L'agent IA peut faire des erreurs. Pensez à vérifier les informations importantes avant de créer le dossier. La confiance n'exclut pas le contrôle.
              </p>
            </div>
          </div>
        </div>

        {/* Error banner if any */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-rose-900/30 border border-rose-500/40 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={15} className="text-rose-400 flex-shrink-0" />
            <p className="text-xs text-rose-300 font-medium">Veuillez corriger les champs obligatoires manquants avant de continuer.</p>
          </div>
        )}

        {/* === MAIN 2-COLUMN GRID === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ===== LEFT COLUMN: Client + Documents ===== */}
          <div className="space-y-5">

            {/* Client Card */}
            <div className="bg-[#0d1428] border border-[#1e2d4a] rounded-2xl p-5">
              <h2 className="text-sm font-extrabold text-[#00d4ff] uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={14} /> Informations du client
              </h2>

              <div className="space-y-4">
                {/* Nom / Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>NOM / SOCIÉTÉ <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <Building2 size={14} className={iconClass} />
                      <input className={clsx(inputWithIconClass, errors.nom_societe && 'border-rose-500')} value={client.nom_societe} onChange={e => setC('nom_societe', e.target.value)} placeholder="Nom / Société" />
                    </div>
                    {errors.nom_societe && <p className="text-rose-400 text-[11px] mt-1">{errors.nom_societe}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>PRÉNOM</label>
                    <div className="relative">
                      <User size={14} className={iconClass} />
                      <input className={inputWithIconClass} value={client.prenom} onChange={e => setC('prenom', e.target.value)} placeholder="Prénom" />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>EMAIL</label>
                  <div className="relative">
                    <Mail size={14} className={iconClass} />
                    <input type="email" className={inputWithIconClass} value={client.email} onChange={e => setC('email', e.target.value)} placeholder="adresse@exemple.com" />
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label className={labelClass}>TÉLÉPHONE <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Phone size={14} className={iconClass} />
                    <input type="tel" className={clsx(inputWithIconClass, errors.telephone && 'border-rose-500')} value={client.telephone} onChange={e => setC('telephone', e.target.value)} placeholder="06 12 34 56 78" />
                  </div>
                  {errors.telephone && <p className="text-rose-400 text-[11px] mt-1">{errors.telephone}</p>}
                </div>

                {/* Adresse */}
                <div>
                  <label className={labelClass}>ADRESSE <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <MapPin size={14} className={clsx(iconClass, 'z-10')} />
                    <AddressAutocomplete
                      name="adresse"
                      value={client.adresse}
                      onChange={e => setC('adresse', e.target.value)}
                      onSelect={(sugg) => {
                        setC('adresse', sugg.nom_rue);
                        setC('code_postal', sugg.code_postal);
                        setC('ville', sugg.ville);
                      }}
                      className={clsx(inputWithIconClass, errors.adresse && 'border-rose-500')}
                      placeholder="Commence à taper l'adresse"
                    />
                  </div>
                  {errors.adresse && <p className="text-rose-400 text-[11px] mt-1">{errors.adresse}</p>}
                </div>

                {/* Code postal + Ville */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>CODE POSTAL <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <MapPin size={14} className={clsx(iconClass, 'z-10')} />
                      <AddressAutocomplete
                        name="code_postal"
                        searchType="municipality"
                        value={client.code_postal}
                        onChange={e => setC('code_postal', e.target.value)}
                        onSelect={(sugg) => {
                          if (sugg.code_postal) setC('code_postal', sugg.code_postal);
                          if (sugg.ville) setC('ville', sugg.ville);
                        }}
                        className={clsx(inputWithIconClass, errors.code_postal && 'border-rose-500')}
                        placeholder="Code Postal"
                      />
                    </div>
                    {errors.code_postal && <p className="text-rose-400 text-[11px] mt-1">{errors.code_postal}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>VILLE <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <Building2 size={14} className={clsx(iconClass, 'z-10')} />
                      <AddressAutocomplete
                        name="ville"
                        searchType="municipality"
                        value={client.ville}
                        onChange={e => setC('ville', e.target.value)}
                        onSelect={(sugg) => {
                          if (sugg.code_postal) setC('code_postal', sugg.code_postal);
                          if (sugg.ville) setC('ville', sugg.ville);
                        }}
                        className={clsx(inputWithIconClass, errors.ville && 'border-rose-500')}
                        placeholder="Ville"
                      />
                    </div>
                    {errors.ville && <p className="text-rose-400 text-[11px] mt-1">{errors.ville}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Card */}
            <div className="bg-[#0d1428] border border-[#1e2d4a] rounded-2xl p-5">
              <h2 className="text-sm font-extrabold text-[#00d4ff] uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={14} /> Documents obligatoires
              </h2>
              <div className="space-y-3">
                <DocUploadRow
                  label="Carte Grise"
                  hint="Formats acceptés : PDF, JPG, PNG (max 5MB)"
                  file={docs.carte_grise}
                  onChange={f => handleDocFile(f, 'carte_grise')}
                  onScanClick={() => handleOpenScanner('carte_grise')}
                />
                <input id="native_camera_fallback_carte_grise" type="file" className="hidden" accept="image/*,.pdf" capture="environment" onChange={e => handleDocFile(e.target.files[0], 'carte_grise')} />

                <DocUploadRow
                  label="Attestation d'assurance"
                  hint="Formats acceptés : PDF, JPG, PNG (max 5MB)"
                  file={docs.attestation_assurance}
                  required
                  onChange={f => handleDocFile(f, 'attestation_assurance')}
                  onScanClick={() => handleOpenScanner('attestation_assurance')}
                />
                <input id="native_camera_fallback_attestation_assurance" type="file" className="hidden" accept="image/*,.pdf" capture="environment" onChange={e => handleDocFile(e.target.files[0], 'attestation_assurance')} />

                <DocUploadRow
                  label="Photo véhicule"
                  hint="Plaque d'immatriculation visible (JPG, PNG max 5MB)"
                  file={docs.photo_vehicule}
                  onChange={f => setDocs(p => ({ ...p, photo_vehicule: f }))}
                />

                <DocUploadRow
                  label="Photo de l'impact"
                  hint="Photo claire de l'impact sur le vitrage (JPG, PNG max 5MB)"
                  file={docs.photo_impact}
                  onChange={f => setDocs(p => ({ ...p, photo_impact: f }))}
                />

                <DocUploadRow
                  label="Contrôle technique (si carte grise barrée)"
                  hint="Formats acceptés : PDF, JPG, PNG (max 5MB)"
                  file={docs.controle_technique}
                  onChange={f => setDocs(p => ({ ...p, controle_technique: f }))}
                />
              </div>
            </div>

          </div>

          {/* ===== RIGHT COLUMN: Véhicule ===== */}
          <div className="space-y-5">
            <div className="bg-[#0d1428] border border-[#1e2d4a] rounded-2xl p-5">
              <h2 className="text-sm font-extrabold text-[#00d4ff] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Car size={14} /> Informations du véhicule
              </h2>

              <div className="space-y-4">

                {/* Immatriculation */}
                <div>
                  <label className={labelClass}>IMMATRICULATION <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Key size={14} className={clsx(iconClass, isScanning && 'text-[#00d4ff] animate-pulse')} />
                    <input
                      className={clsx(inputWithIconClass, 'uppercase font-mono tracking-widest', errors.immatriculation && 'border-rose-500', isScanning && 'animate-pulse')}
                      value={vehicule.immatriculation}
                      onChange={e => setV('immatriculation', e.target.value.toUpperCase())}
                      placeholder="AB-123-CD"
                    />
                  </div>
                  {errors.immatriculation && <p className="text-rose-400 text-[11px] mt-1">{errors.immatriculation}</p>}
                </div>

                {/* Kilométrage */}
                <div>
                  <label className={labelClass}>KILOMÉTRAGE (KM)</label>
                  <div className="relative">
                    <Gauge size={14} className={iconClass} />
                    <input type="number" className={clsx(inputWithIconClass, 'pr-12')} value={vehicule.kilometrage} onChange={e => setV('kilometrage', e.target.value)} placeholder="50000" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">km</span>
                  </div>
                </div>

                {/* Modèle */}
                <div>
                  <label className={labelClass}>MODÈLE DU VÉHICULE <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Car size={14} className={clsx(iconClass, isScanning && 'text-[#00d4ff] animate-pulse')} />
                    <input
                      className={clsx(inputWithIconClass, errors.modele && 'border-rose-500', isScanning && 'animate-pulse')}
                      value={vehicule.modele}
                      onChange={e => setV('modele', e.target.value)}
                      placeholder="Peugeot 308"
                    />
                  </div>
                  {errors.modele && <p className="text-rose-400 text-[11px] mt-1">{errors.modele}</p>}
                </div>

                {/* Assurance */}
                <div>
                  <label className={labelClass}>ASSURANCE <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <ShieldCheck size={14} className={clsx(iconClass, isScanning && 'text-[#00d4ff] animate-pulse')} />
                    <input
                      className={clsx(inputWithIconClass, isScanning && 'animate-pulse')}
                      value={vehicule.nom_assurance}
                      onChange={e => setV('nom_assurance', e.target.value)}
                      placeholder="MAIF, AXA, Allianz..."
                    />
                  </div>
                </div>

                {/* N° contrat */}
                <div>
                  <label className={labelClass}>N° DE CONTRAT D'ASSURANCE <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <FileText size={14} className={clsx(iconClass, isScanning && 'text-[#00d4ff] animate-pulse')} />
                    <input
                      className={clsx(inputWithIconClass, isScanning && 'animate-pulse')}
                      value={vehicule.num_contrat}
                      onChange={e => setV('num_contrat', e.target.value)}
                      placeholder="Numéro de police"
                    />
                  </div>
                </div>

                {/* Date sinistre */}
                <div>
                  <label className={labelClass}>DATE DU SINISTRE <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Calendar size={14} className={iconClass} />
                    <input
                      type="date"
                      className={clsx(inputWithIconClass, errors.date_sinistre && 'border-rose-500')}
                      value={vehicule.date_sinistre}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => setV('date_sinistre', e.target.value)}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">La date doit être antérieure à la date du jour.</p>
                  {errors.date_sinistre && <p className="text-rose-400 text-[11px] mt-1">{errors.date_sinistre}</p>}
                </div>

                {/* Raison du sinistre */}
                <div>
                  <label className={labelClass}>RAISON DU SINISTRE <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <AlertCircle size={14} className={iconClass} />
                    <select className={clsx(inputWithIconClass, 'appearance-none')} value={vehicule.raison_sinistre} onChange={e => setV('raison_sinistre', e.target.value)}>
                      <option value="">Choisir une raison</option>
                      {RAISONS_SINISTRE.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* Type de vitrage */}
                <div>
                  <label className={labelClass}>TYPE DE VITRAGE <span className="text-rose-400">*</span></label>
                  {!customVitrageMode ? (
                    <>
                      <div className="relative">
                        <Car size={14} className={iconClass} />
                        <select
                          className={clsx(inputWithIconClass, 'appearance-none', errors.type_vitrage && 'border-rose-500')}
                          value={vehicule.type_vitrage}
                          onChange={e => setV('type_vitrage', e.target.value)}
                        >
                          <option value="">Choisir un type de vitrage</option>
                          {TYPES_VITRAGE.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomVitrageMode(true)}
                        className="mt-2 flex items-center gap-1.5 text-xs text-[#00d4ff] hover:text-white font-medium transition-colors"
                      >
                        <Plus size={12} /> Ajouter un autre type de vitrage
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        className={clsx(inputClass, 'flex-1')}
                        value={customVitrage}
                        onChange={e => setCustomVitrage(e.target.value)}
                        placeholder="Précisez le type de vitrage..."
                      />
                      <button type="button" onClick={() => { setCustomVitrageMode(false); setCustomVitrage(''); }} className="p-2.5 bg-[#1a2744] border border-[#2a3a5c] rounded-xl text-slate-400 hover:text-rose-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">Choisissez un vitrage, puis cliquez sur « Ajouter un autre type de vitrage » si nécessaire.</p>
                  {errors.type_vitrage && <p className="text-rose-400 text-[11px] mt-1">{errors.type_vitrage}</p>}
                </div>

                {/* N° sinistre */}
                <div>
                  <label className={labelClass}>N° DE SINISTRE (SI EN VOTRE POSSESSION)</label>
                  <div className="relative">
                    <FileText size={14} className={iconClass} />
                    <input className={inputWithIconClass} value={vehicule.num_sinistre} onChange={e => setV('num_sinistre', e.target.value)} placeholder="Numéro de sinistre" />
                  </div>
                </div>

                {/* Franchise */}
                <div>
                  <label className={labelClass}>MONTANT DE LA FRANCHISE (€) (SI EN VOTRE POSSESSION)</label>
                  <div className="relative">
                    <Euro size={14} className={iconClass} />
                    <input type="number" className={clsx(inputWithIconClass, 'pr-10')} value={vehicule.franchise_montant} onChange={e => setV('franchise_montant', e.target.value)} placeholder="0.00" min="0" step="0.01" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">€ / %</span>
                  </div>
                </div>

                {/* Cadeau */}
                <div>
                  <label className={labelClass}>CADEAU (OPTIONNEL)</label>
                  <div className="relative">
                    <Gift size={14} className={iconClass} />
                    <input className={inputWithIconClass} value={vehicule.cadeau} onChange={e => setV('cadeau', e.target.value)} placeholder="Cadeau offert" />
                  </div>
                </div>

                {/* Commentaire */}
                <div>
                  <label className={labelClass}>COMMENTAIRE</label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#1a2744] border border-[#2a3a5c] rounded-xl text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/30 transition-all resize-none"
                      value={vehicule.commentaire}
                      onChange={e => setV('commentaire', e.target.value)}
                      placeholder="Commentaires..."
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Type de dossier */}
            <div className="bg-[#0d1428] border border-[#1e2d4a] rounded-2xl p-5">
              <h2 className="text-sm font-extrabold text-[#00d4ff] uppercase tracking-widest mb-4">Type de dossier</h2>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setSelectedType('simple')} className={clsx('p-4 rounded-xl border text-left transition-all relative', selectedType === 'simple' ? 'border-[#1454FF] bg-[#1454FF]/10' : 'border-[#1e2d4a] hover:border-[#1454FF]/50')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={13} className="text-[#1454FF]" />
                    <p className="text-sm font-bold text-white">Simple</p>
                  </div>
                  <p className="text-[11px] text-amber-400 mb-1">Sans gestionnaire</p>
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', stock.simple > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400')}>
                    Solde: {stock.simple}
                  </span>
                  {selectedType === 'simple' && <div className="absolute top-2 right-2 w-4 h-4 bg-[#1454FF] rounded-full flex items-center justify-center"><Check size={9} className="text-white" /></div>}
                </button>
                <button type="button" onClick={() => setSelectedType('prestige')} className={clsx('p-4 rounded-xl border text-left transition-all relative', selectedType === 'prestige' ? 'border-purple-500 bg-purple-900/20' : 'border-[#1e2d4a] hover:border-purple-500/50')}>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown size={13} className="text-purple-400" />
                    <p className="text-sm font-bold text-white">Prestige</p>
                  </div>
                  <p className="text-[11px] text-emerald-400 mb-1">Gestionnaire inclus</p>
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', stock.prestige > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-rose-900/50 text-rose-400')}>
                    Solde: {stock.prestige}
                  </span>
                  {selectedType === 'prestige' && <div className="absolute top-2 right-2 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center"><Check size={9} className="text-white" /></div>}
                </button>
              </div>
              {stock[selectedType] === 0 && (
                <div className="mt-3 p-3 bg-rose-900/30 border border-rose-500/30 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className="text-rose-400" />
                    <span className="text-xs text-rose-300">Aucun jeton {selectedType} disponible</span>
                  </div>
                  <Link href={`/dashboard/abonnement?type=${selectedType}`} className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                    Acheter
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === SUBMIT BUTTON === */}
        <div className="pb-8">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || stock[selectedType] < 1}
            className="w-full py-4 bg-gradient-to-r from-[#1454FF] to-[#0ea5e9] hover:from-[#1060ff] hover:to-[#0cb8ff] text-white font-extrabold text-base rounded-2xl transition-all disabled:opacity-60 shadow-xl shadow-[#1454FF]/30 flex items-center justify-center gap-3"
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Création en cours...</>
            ) : (
              <><Save size={20} /> Créer le dossier</>
            )}
          </button>
        </div>
      </div>

      {/* === CAMERA MODAL === */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <h2 className="text-white font-semibold drop-shadow-lg">
              Scanner {scannerType === 'carte_grise' ? 'la Carte Grise' : "l'Attestation"}
            </h2>
            <button onClick={() => { setShowScanner(false); setScannerType(null); setCameraError(false); }} className="p-2 bg-white/20 rounded-full text-white">
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
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  <div className="w-full max-w-sm aspect-[1/1.4] border-2 border-white/70 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00d4ff] rounded-tl-xl -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00d4ff] rounded-tr-xl -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00d4ff] rounded-bl-xl -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00d4ff] rounded-br-xl -mb-1 -mr-1"></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-white p-6 text-center space-y-4">
                <AlertCircle size={48} className="text-rose-500 mx-auto" />
                <p>Accès à la caméra refusé.</p>
                <p className="text-xs text-white/60">Vérifiez les permissions ou importez un fichier ci-dessous.</p>
              </div>
            )}
          </div>
          <div className="p-6 pb-10 bg-black flex flex-col items-center gap-4 z-10">
            <button
              onClick={captureScanner}
              disabled={cameraError}
              className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="w-16 h-16 bg-white rounded-full border-2 border-black/10 shadow-inner"></div>
            </button>
            <label className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-2 cursor-pointer mt-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 transition-colors rounded-full">
              <Upload size={16} /> Ou importer un fichier
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => { handleDocFile(e.target.files[0], scannerType); setShowScanner(false); setScannerType(null); setCameraError(false); }} />
            </label>
          </div>
        </div>
      )}

    </div>
  );
}