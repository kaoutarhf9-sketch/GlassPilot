"use client";

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, CheckCircle2, Eraser, FileSignature, Loader2, 
  ShieldCheck, Download, FileText, Sparkles, ChevronRight,
  User, Car, Building2, Euro
} from 'lucide-react';
import jsPDF from 'jspdf';
import clsx from 'clsx';
import { generatePDF } from '@/lib/pdfGenerator';

export default function CessionDeCreance() {
  const params = useParams();
  const router = useRouter();
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [isSigned, setIsSigned] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserRole(user.user_metadata?.role);
    };
    checkUser();
    if (params?.id) fetchDossier(params.id);
  }, [params?.id]);

  const fetchDossier = async (id) => {
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('*, clients(*), garages(*), assurances(nom)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setDossier(data);
      if (data.signature_url) setIsSigned(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const hasSignature = () => {
    const canvas = canvasRef.current;
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0) return true;
    }
    return false;
  };

  // Preview Generation Effect
  useEffect(() => {
    if (dossier && !isSigned) {
      try {
        const doc = generatePDF(dossier, null);
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Preview generation error:", err);
      }
    }
  }, [dossier, isSigned]);

  // ============================================================
  // HANDLERS PRINCIPAUX
  // ============================================================
  const handleSaveAndGeneratePDF = async () => {
    if (!hasSignature()) {
      alert('Veuillez signer avant de valider.');
      return;
    }
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      const doc = generatePDF(dossier, signatureDataUrl);
      const pdfBlob = doc.output('blob');

      const link = document.createElement('a');
      const blobUrl = URL.createObjectURL(pdfBlob);
      link.href = blobUrl;
      link.download = `dossier_${dossier.numero}_complet.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

      // Upload raw signature for regeneration later
      const sigRes = await fetch(signatureDataUrl);
      const sigBlob = await sigRes.blob();
      const sigPath = `dossiers/${params.id}/signature_client.png`;
      await supabase.storage.from('documents').upload(sigPath, sigBlob, { contentType: 'image/png', upsert: true });

      // Upload generated PDF
      const fileName = `documents_complets_${dossier.numero}_${Date.now()}.pdf`;
      const filePath = `dossiers/${params.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
        await supabase.from('dossiers').update({
          signature_url: publicUrl,
          date_signature: new Date().toISOString(),
          statut: 'signe'
        }).eq('id', params.id);
      }

      setGeneratedPdfBlob(pdfBlob);
      setIsSigned(true);
    } catch (err) {
      console.error(err);
      alert('Erreur: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (generatedPdfBlob) {
      const url = URL.createObjectURL(generatedPdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dossier_${dossier?.numero}_complet.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-[var(--blue)]/10 rounded-full animate-ping opacity-20"></div>
            <Loader2 size={48} className="animate-spin text-[var(--blue)] mx-auto relative z-10" />
          </div>
          <p className="text-[var(--muted)] font-medium">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

  if (!dossier) return <div className="text-center p-20">Dossier introuvable</div>;

  const client = dossier.clients;

  const backUrl = userRole === 'gestionnaire' ? `/gestionnaire/dossiers/${params.id}` : `/dashboard/dossiers/${params.id}`;

  if (isSigned) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border border-emerald-100">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-[var(--ink)] mb-4">Documents générés !</h1>
          <p className="text-[var(--muted)] mb-8 font-light">Le PDF a été téléchargé automatiquement et le statut du dossier est mis à jour.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={backUrl} className="px-6 py-3 bg-[var(--white)] text-slate-700 rounded-xl font-medium border border-[var(--stone)] hover:bg-[var(--white)] transition-colors">
              Retour au dossier
            </Link>
            <button onClick={handleDownload} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--blue)] hover:bg-[#0ea5e9] text-[var(--ink)] rounded-xl font-medium transition-all shadow-md">
              <Download size={18} /> Télécharger le PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="fixed top-0 -left-48 w-96 h-96 bg-[var(--blue)]/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>
      <div className="fixed bottom-0 -right-48 w-96 h-96 bg-[#00875A]/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        
        <div className="mb-8">
          <Link href={backUrl} className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--blue)] transition-colors text-sm font-medium mb-4 group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Retour au dossier
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--blue)]/25 rounded-xl blur opacity-60"></div>
                <div className="relative w-12 h-12 bg-[var(--blue)] rounded-xl flex items-center justify-center shadow-lg">
                  <FileText size={22} className="text-[var(--ink)]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-serif text-[var(--ink)] tracking-tight">Génération des documents</h1>
                <p className="text-[var(--muted)] text-sm mt-1 font-light">Déclaration de sinistre • Cession de créance • Ordre de réparation</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--white)] rounded-full border border-[var(--stone)] shadow-md self-start">
              <Sparkles size={14} className="text-[var(--blue)]" />
              <span className="text-xs text-[var(--muted)] font-medium">Documents officiels</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--white)] rounded-2xl shadow-md border border-[var(--stone)] overflow-hidden">
          {userRole === 'gestionnaire' ? (
            <div className="p-12 text-center text-[var(--muted)] font-medium flex flex-col items-center gap-6 bg-slate-50/50">
              <div className="w-20 h-20 bg-[var(--blue)]/10 rounded-full flex items-center justify-center">
                <FileSignature size={36} className="text-[var(--blue)]" />
              </div>
              <div>
                <p className="text-xl text-[var(--ink)] font-bold">En attente de signature</p>
                <p className="text-sm mt-2 max-w-md mx-auto">La cession de créance n'a pas encore été signée par le garagiste ou le client. Vous ne pouvez pas signer ce document à leur place.</p>
              </div>
              
              {previewUrl && (
                <a 
                  href={previewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-[var(--blue)] hover:bg-[#0ea5e9] text-[var(--ink)] rounded-xl font-medium transition-all shadow-md shadow-blue-500/20"
                >
                  <FileText size={18} />
                  Prévisualiser le document PDF (Non signé)
                </a>
              )}
            </div>
          ) : (
            <>
              <div className="p-5 md:p-6 border-b border-[var(--stone)] bg-transparent/50">
                <h3 className="text-sm font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[var(--blue)]" />
                  Récapitulatif du dossier
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-[var(--muted)]" />
                    <span className="text-slate-600">Client :</span>
                    <span className="font-medium text-slate-800">{client?.prenom} {client?.nom}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car size={14} className="text-[var(--muted)]" />
                    <span className="text-slate-600">Véhicule :</span>
                    <span className="font-medium text-slate-800">{dossier.modele_vehicule} - {dossier.immatriculation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-[var(--muted)]" />
                    <span className="text-slate-600">Assurance :</span>
                    <span className="font-medium text-slate-800">{dossier.assurances?.nom || 'Non renseignée'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Euro size={14} className="text-[var(--muted)]" />
                    <span className="text-slate-600">Franchise :</span>
                    <span className="font-medium text-slate-800">{dossier.franchise_montant || 0} €</span>
                  </div>
                </div>
              </div>

              {previewUrl && (
                <div className="p-5 md:p-6 border-b border-[var(--stone)] bg-slate-50/30">
                  <h3 className="text-sm font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-[var(--blue)]" />
                    Aperçu du document (Non signé)
                  </h3>
                  <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                    <iframe src={`${previewUrl}#toolbar=0&navpanes=0`} className="w-full h-full" title="Prévisualisation PDF" />
                  </div>
                </div>
              )}

              <div className="p-5 md:p-6 border-b border-[var(--stone)] bg-gradient-to-r from-[#EEF2FF]/50 to-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
                    <FileSignature size={18} className="text-[var(--blue)]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--ink)]">Signature électronique</h2>
                    <p className="text-xs text-[var(--muted)]">Apposez votre signature dans le cadre ci-dessous</p>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <div className="bg-transparent border-2 border-dashed border-[var(--stone)] rounded-xl p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <h3 className="font-bold text-[var(--ink)] flex items-center gap-2">
                      <FileSignature size={18} className="text-[var(--blue)]" />
                      Signature de {client?.prenom} {client?.nom}
                    </h3>
                    <button onClick={clearCanvas} className="text-xs font-medium text-[var(--muted)] hover:text-red-500 flex items-center gap-1 transition-colors">
                      <Eraser size={14} /> Effacer la signature
                    </button>
                  </div>
                  <div className="bg-[var(--white)] border border-[var(--stone)] rounded-xl overflow-hidden shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={150}
                      className="w-full h-[150px] cursor-crosshair bg-[var(--white)]"
                      style={{ touchAction: 'none' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-3 text-center">
                    Signez dans le cadre ci-dessus avec votre souris ou votre doigt
                  </p>
                </div>
              </div>

              <div className="p-5 md:p-6 border-t border-[var(--stone)] bg-transparent/50">
                <button
                  onClick={handleSaveAndGeneratePDF}
                  disabled={saving}
                  className="w-full py-4 bg-[var(--blue)] hover:bg-[#0ea5e9] text-[var(--ink)] font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all disabled:opacity-70 text-base"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  {saving ? 'Génération des documents en cours...' : 'Générer tous les documents officiels'}
                </button>
                <p className="text-xs text-[var(--muted)] text-center mt-3">
                  Les documents générés seront automatiquement téléchargés et sauvegardés
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--muted)]">
            Les documents générés incluent : Déclaration de sinistre • Notification de cession • Convention de cession • Ordre de réparation • Déclaration d'intervention
          </p>
        </div>
      </div>
    </div>
  );
}