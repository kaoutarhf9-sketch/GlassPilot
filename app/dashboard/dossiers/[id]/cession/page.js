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

  // ============================================================
  // GÉNÉRATION DU PDF (Architecture Professionnelle)
  // ============================================================
  const generatePDF = (signatureDataUrl) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const marginX = 20;
    const maxW = w - 2 * marginX;

    const client = dossier.clients;
    const garage = dossier.garages;
    const assurance = dossier.assurances;
    const dateSinistre = dossier.date_sinistre ? new Date(dossier.date_sinistre).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
    const dateAuj = new Date().toLocaleDateString('fr-FR');

    // -- HELPER 1 : Paragraphe intelligent --
    const writeText = (text, yPos, font = 'normal', size = 10) => {
      doc.setFont('helvetica', font);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, maxW);
      doc.text(lines, marginX, yPos);
      return yPos + (lines.length * (size * 0.45)) + 4; // Calcule automatiquement l'espacement
    };

    // -- HELPER 2 : Pied de page discret et fixe --
    const printFooter = () => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      const footerText = `${garage?.nom_garage || ''} - ${garage?.adresse || ''} ${garage?.code_postal || ''} ${garage?.ville || ''} - SIRET : ${garage?.siret || ''}`;
      doc.text(footerText, w / 2, pageH - 10, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset couleur
    };

    // -- HELPER 3 : Blocs de signature professionnels fixes en bas --
    const printSignatures = (yPos = 235, showGarage = false) => {
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      
      // Cadre Client
      doc.rect(marginX, yPos, 75, 35);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Signature du client`, marginX + 5, yPos + 6);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Bon pour accord. Fait le ${dateAuj}`, marginX + 5, yPos + 11);
      if (signatureDataUrl) {
        doc.addImage(signatureDataUrl, 'PNG', marginX + 10, yPos + 13, 50, 20);
      }

      // Cadre Garage (Optionnel)
      if (showGarage) {
        doc.rect(w - marginX - 75, yPos, 75, 35);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Le Réparateur`, w - marginX - 70, yPos + 6);
        doc.setFontSize(9);
        doc.text(garage?.nom_garage || '', w - marginX - 70, yPos + 12);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`SIRET: ${garage?.siret || ''}`, w - marginX - 70, yPos + 17);
        doc.text(`Cachet et signature`, w - marginX - 70, yPos + 30);
      }
    };


    // ============================================================
    // PAGE 1 : DÉCLARATION DE SINISTRE
    // ============================================================
    let y = 20;

    // En-tête Client & Assurance
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${client?.prenom || ''} ${client?.nom || ''}`, marginX, y);
    doc.text(`${assurance?.nom?.toUpperCase() || 'ASSURANCE'}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(client?.adresse || '', marginX, y);
    doc.text(`Contrat : ${dossier.num_contrat || 'Non renseigné'}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(`${client?.code_postal || ''} ${client?.ville || ''}`, marginX, y);
    doc.text(`Date du sinistre : ${dateSinistre}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    let notesObj = {};
    try { if (dossier.notes) notesObj = JSON.parse(dossier.notes); } catch(e){}

    doc.text(client?.telephone || '', marginX, y);
    doc.text(`N° Sinistre : ${dossier.num_sinistre || 'Non renseigné'}`, w - marginX, y, { align: 'right' });
    y += 5;

    doc.text(`Tél : ${notesObj.assurance_telephone || 'Non renseigné'}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(`Email : ${notesObj.assurance_email || 'Non renseigné'}`, w - marginX, y, { align: 'right' });
    y += 10;

    // Ligne séparatrice
    doc.setDrawColor(200, 200, 200);
    doc.line(marginX, y, w - marginX, y);
    y += 8;

    // Info Véhicule
    doc.setFont('helvetica', 'bold');
    doc.text('Véhicule', marginX, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Marque / Modèle : ${dossier.modele_vehicule || ''}`, marginX, y);
    y += 5;
    doc.text(`Immatriculation : ${dossier.immatriculation || ''}`, marginX, y);
    y += 12;

    doc.line(marginX, y, w - marginX, y);
    y += 15;

    // Titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('DÉCLARATION DE SINISTRE', w / 2, y, { align: 'center' });
    y += 15;

    // Paragraphes fluides
    y = writeText('Madame, Monsieur,', y, 'normal', 10);
    y += 2;
    y = writeText(`Je soussigné ${client?.prenom} ${client?.nom} demeurant à ${client?.adresse || ''} ${client?.code_postal || ''} ${client?.ville || ''}, déclare que conformément à l'Arrêté du 29 décembre 2014 relatif aux modalités d'information de l'assuré au moment du sinistre et à l'article L.211-5-1 du code des assurances, j'ai la faculté de choisir librement le réparateur professionnel auquel je souhaite recourir.`, y);
    y = writeText(`Je déclare également que mon véhicule ${dossier.modele_vehicule}, immatriculé ${dossier.immatriculation}, assuré auprès de votre compagnie d'assurance (contrat n° ${dossier.num_contrat || '____________'}) a subi un ${dossier.raison_sinistre || 'bris de glace'} le ${dateSinistre}. Vitrage concerné : ${dossier.type_vitrage || 'Pare-brise'}.`, y);
    y = writeText(`Mon vitrage étant endommagé et altérant ma visibilité (R316-1 et R316-3 du code de la route), je suis dans l'obligation de le remplacer en urgence chez mon réparateur ${garage?.nom_garage}.`, y);
    y = writeText(`Une fois la prestation réalisée, je vous prie de procéder au règlement de l'indemnité me revenant directement entre les mains de mon réparateur.`, y);
    y = writeText(`Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`, y);

    printSignatures(235, true);
    printFooter();


    // ============================================================
    // PAGE 2 : NOTIFICATION DE CESSION
    // ============================================================
    doc.addPage();
    y = 20;

    doc.setFont('helvetica', 'bold');
    doc.text(`${client?.prenom || ''} ${client?.nom || ''}`, marginX, y);
    doc.text(garage?.nom_garage || '', w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text(client?.adresse || '', marginX, y);
    doc.text(garage?.adresse || '', w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(`${client?.code_postal || ''} ${client?.ville || ''}`, marginX, y);
    doc.text(`${garage?.code_postal || ''} ${garage?.ville || ''}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(client?.telephone || '', marginX, y);
    doc.text(`SIRET: ${garage?.siret || ''}`, w - marginX, y, { align: 'right' });
    y += 12;

    doc.line(marginX, y, w - marginX, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.text(`${assurance?.nom?.toUpperCase() || 'ASSURANCE'}`, marginX, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Contrat n° ${dossier.num_contrat || 'Non renseigné'}`, marginX, y);
    y += 5;
    doc.text(`Sinistre n° ${dossier.num_sinistre || 'Non renseigné'}`, marginX, y);
    y += 5;
    doc.text(`Accident du ${dateSinistre}`, marginX, y);
    y += 5;
    doc.text(`Nature du sinistre : ${dossier.raison_sinistre || dossier.type_vitrage || 'Bris de glace'}`, marginX, y);
    y += 5;
    
    let notesObj2 = {};
    try { if (dossier.notes) notesObj2 = JSON.parse(dossier.notes); } catch(e){}
    doc.text(`Tél Assurance : ${notesObj2.assurance_telephone || 'Non renseigné'}`, marginX, y);
    y += 5;
    doc.text(`Email Assurance : ${notesObj2.assurance_email || 'Non renseigné'}`, marginX, y);
    y += 12;

    doc.setFont('helvetica', 'italic');
    doc.text(`RECOMMANDÉE avec A/R - Le ${dateAuj}`, w / 2, y, { align: 'center' });
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NOTIFICATION DE CESSION DE CRÉANCE', w / 2, y, { align: 'center' });
    y += 15;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Objet : Notification d'une cession de créance`, marginX, y);
    y += 10;

    y = writeText('Madame, Monsieur,', y, 'normal', 10);
    y += 2;
    y = writeText(`Je vous adresse, ci-joint, une convention de cession de créance que j'ai consentie au garage ${garage?.nom_garage}, conformément aux dispositions du Code civil.`, y);
    y = writeText(`En application de l'ordonnance n°2016-131 du 10 février 2016, la présente lettre recommandée avec accusé de réception vaut notification et suffit à faire valoir la convention de cession de créance annexée. Je vous demande de procéder au règlement du montant des réparations directement entre les mains de mon réparateur professionnel.`, y);
    y = writeText(`N'ayant plus qualité pour percevoir ce paiement, je vous invite à régler la somme due exclusivement auprès du réparateur désigné, à qui j'ai conféré tous pouvoirs nécessaires pour le recouvrement.`, y);
    
    printSignatures(235, false);
    printFooter();


    // ============================================================
    // PAGE 3 : CONVENTION DE CESSION
    // ============================================================
    doc.addPage();
    y = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('CONVENTION DE CESSION DE CRÉANCE', w / 2, y, { align: 'center' });
    y += 7;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('(Article 1321 du Code Civil)', w / 2, y, { align: 'center' });
    y += 15;

    doc.setFont('helvetica', 'normal');
    let notesObj3 = {};
    try { if (dossier.notes) notesObj3 = JSON.parse(dossier.notes); } catch(e){}

    y = writeText(`Entre le Client/Assuré et le Réparateur professionnel — Compagnie d'assurances : ${assurance?.nom?.toUpperCase() || '____________'}`, y, 'bold');
    y = writeText(`N° de contrat : ${dossier.num_contrat || '____________'} — N° de sinistre : ${dossier.num_sinistre || '____________'}`, y);
    y = writeText(`Sinistre du : ${dateSinistre} — Nature : ${dossier.raison_sinistre || dossier.type_vitrage || 'Bris de glace'}`, y);
    y = writeText(`Tél assurance : ${notesObj3.assurance_telephone || '____________'} — Email assurance : ${notesObj3.assurance_email || '____________'}`, y);
    y += 5;

    const articles = [
      { title: "Article 1 : Nature de la cession", text: `L'assuré a subi un sinistre dont les réparations sont couvertes par la police d'assurance émise par la compagnie d'assurance dont les références figurent ci-dessus. L'assuré déclare détenir un droit à indemnisation au titre des garanties souscrites et s'engage par la présente convention à céder à son réparateur l'ensemble de ses droits à indemnisation en guise de paiement de la remise en état de son véhicule.` },
      { title: "Article 2 : Engagement du réparateur", text: "Le réparateur s'engage à effectuer toutes les réparations liées au sinistre et nécessaires à la remise en état du véhicule conformément à l'ordre de réparation établi." },
      { title: "Article 3 : Franchise", text: `L'assuré reste redevable de la franchise contractuelle d'un montant de ${dossier.franchise_montant || 0} €.` },
      { title: "Article 4 : Opposabilité de la cession", text: "Conformément à l'article 1324 du code civil, la présente cession devient opposable à la compagnie d'assurance et aux tiers à compter de sa notification. Dès cette date, seul le réparateur est habilité à percevoir les sommes dues." }
    ];

    for (const art of articles) {
      y = writeText(art.title, y, 'bold');
      y = writeText(art.text, y);
      y += 2;
    }

    printSignatures(235, true);
    printFooter();


    // ============================================================
    // PAGE 4 : ORDRE DE RÉPARATION
    // ============================================================
    doc.addPage();
    y = 25;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ORDRE DE RÉPARATION', w / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10);
    doc.text('LE CLIENT', marginX, y);
    doc.text('LE RÉPARATEUR', w - marginX, y, { align: 'right' });
    y += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${client?.prenom} ${client?.nom}`, marginX, y);
    doc.text(`${garage?.nom_garage}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(`${client?.adresse || ''}`, marginX, y);
    doc.text(`${garage?.adresse || ''}`, w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(`${client?.code_postal || ''} ${client?.ville || ''}`, marginX, y);
    doc.text(`${garage?.code_postal || ''} ${garage?.ville || ''}`, w - marginX, y, { align: 'right' });
    y += 15;

    y = writeText(`Atteste avoir été informé du libre choix de mon réparateur (art. L. 211-5-1) et donne ordre de réparation au réparateur désigné ci-dessus pour l'exécution des travaux suivants :`, y);
    y += 2;
    
    y = writeText(`Intervention : ${dossier.type_vitrage || 'Remplacement Vitrage'}`, y, 'bold', 12);
    y += 5;
    
    y = writeText(`Marque/Modèle : ${dossier.modele_vehicule}`, y, 'normal', 10);
    y = writeText(`Immatriculation : ${dossier.immatriculation}`, y);
    y = writeText(`Km : ${dossier.kilometrage || 'Non renseigné'}`, y);
    y += 10;

    y = writeText(`En cas de non-paiement ou de résiliation anticipée du contrat avant indemnisation par mon assureur, je m'engage à régler l'intégralité des frais engagés.`, y);

    printSignatures(235, true);
    printFooter();

    // ============================================================
    // PAGE 5 : DÉCLARATION D'INTERVENTION
    // ============================================================
    doc.addPage();
    y = 20;

    doc.setFont('helvetica', 'bold');
    doc.text(`${client?.prenom || ''} ${client?.nom || ''}`, marginX, y);
    doc.text(garage?.nom_garage || '', w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.text(client?.adresse || '', marginX, y);
    doc.text(garage?.adresse || '', w - marginX, y, { align: 'right' });
    y += 5;
    
    doc.text(`${client?.code_postal || ''} ${client?.ville || ''}`, marginX, y);
    doc.text(`${garage?.code_postal || ''} ${garage?.ville || ''}`, w - marginX, y, { align: 'right' });
    y += 12;

    doc.line(marginX, y, w - marginX, y);
    y += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Objet : Déclaration d'intervention pour impact ${dossier.type_vitrage || 'Pare-brise'}.`, marginX, y);
    y += 10;

    let notesObj5 = {};
    try { if (dossier.notes) notesObj5 = JSON.parse(dossier.notes); } catch(e){}

    y = writeText('Madame, Monsieur,', y, 'normal', 10);
    y += 2;
    y = writeText(`Je soussigné(e) ${client?.prenom} ${client?.nom} déclare avoir reçu un impact sur le ${dossier.type_vitrage || 'Pare-brise'} de mon véhicule ${dossier.modele_vehicule} immatriculé ${dossier.immatriculation}, assuré auprès de l'assurance ${assurance?.nom || '________'} (n° de police ${dossier.num_contrat || ''}, n° de sinistre ${dossier.num_sinistre || ''}).`, y);
    y = writeText(`Je déclare à ce jour avoir fait intervenir la société ${garage?.nom_garage} pour remplacer ${dossier.type_vitrage || 'Pare-brise'}.`, y);
    y = writeText(`Coordonnées de l'assurance enregistrées : Tél ${notesObj5.assurance_telephone || 'Non renseigné'} / Email ${notesObj5.assurance_email || 'Non renseigné'}.`, y);
    y = writeText(`Adresse d'intervention : ${client?.adresse || ''} , ${client?.code_postal || ''} ${client?.ville || ''} .`, y);
    y = writeText(`En cas de non-paiement ou de résiliation anticipée du contrat avant indemnisation par mon assureur, je m'engage à régler l'intégralité des frais engagés pour le remplacement. Le montant dû me sera communiqué par facture.`, y);
    y = writeText(`Je certifie sur l'honneur avoir signé la cession de créance le ${dateAuj}.`, y);
    y = writeText(`Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`, y);

    printSignatures(235, false);
    printFooter();

    return doc;
  };

  // Preview Generation Effect
  useEffect(() => {
    if (dossier && !isSigned) {
      try {
        const doc = generatePDF(null);
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
      const doc = generatePDF(signatureDataUrl);
      const pdfBlob = doc.output('blob');

      const link = document.createElement('a');
      const blobUrl = URL.createObjectURL(pdfBlob);
      link.href = blobUrl;
      link.download = `dossier_${dossier.numero}_complet.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

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
            <Link href={backUrl} className="px-6 py-3 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-slate-700 rounded-xl font-medium border border-[var(--stone)] hover:bg-[var(--white)]/40 transition-colors">
              Retour au dossier
            </Link>
            <button onClick={handleDownload} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--blue)] hover:bg-[#0ea5e9] text-white rounded-xl font-medium transition-all shadow-md">
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
                  <FileText size={22} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-serif text-[var(--ink)] tracking-tight">Génération des documents</h1>
                <p className="text-[var(--muted)] text-sm mt-1 font-light">Déclaration de sinistre • Cession de créance • Ordre de réparation</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-full border border-[var(--stone)] shadow-md self-start">
              <Sparkles size={14} className="text-[var(--blue)]" />
              <span className="text-xs text-[var(--muted)] font-medium">Documents officiels</span>
            </div>
          </div>
        </div>

        <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl shadow-md border border-[var(--stone)] overflow-hidden">
          
          <div className="p-5 md:p-6 border-b border-[var(--stone)] bg-transparent/50">
            <h3 className="text-sm font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[var(--blue)]" />
              Récapitulatif du dossier
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-400" />
                <span className="text-slate-600">Client :</span>
                <span className="font-medium text-slate-800">{client?.prenom} {client?.nom}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car size={14} className="text-slate-400" />
                <span className="text-slate-600">Véhicule :</span>
                <span className="font-medium text-slate-800">{dossier.modele_vehicule} - {dossier.immatriculation}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-slate-400" />
                <span className="text-slate-600">Assurance :</span>
                <span className="font-medium text-slate-800">{dossier.assurances?.nom || 'Non renseignée'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Euro size={14} className="text-slate-400" />
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

          {userRole !== 'gestionnaire' ? (
            <>
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
                  <div className="bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-[var(--stone)] rounded-xl overflow-hidden shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={150}
                      className="w-full h-[150px] cursor-crosshair bg-[var(--white)] backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
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
                  <p className="text-xs text-slate-400 mt-3 text-center">
                    Signez dans le cadre ci-dessus avec votre souris ou votre doigt
                  </p>
                </div>
              </div>

              <div className="p-5 md:p-6 border-t border-[var(--stone)] bg-transparent/50">
                <button
                  onClick={handleSaveAndGeneratePDF}
                  disabled={saving}
                  className="w-full py-4 bg-[var(--blue)] hover:bg-[#0ea5e9] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all disabled:opacity-70 text-base"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  {saving ? 'Génération des documents en cours...' : 'Générer tous les documents officiels'}
                </button>
                <p className="text-xs text-slate-400 text-center mt-3">
                  Les documents générés seront automatiquement téléchargés et sauvegardés
                </p>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-[var(--muted)] font-medium flex flex-col items-center gap-3 bg-slate-50/50">
              <FileSignature size={32} className="text-slate-300" />
              <p>En attente de la signature par le client / garagiste.</p>
              <p className="text-xs font-normal">Vous ne pouvez pas signer ce document à leur place.</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Les documents générés incluent : Déclaration de sinistre • Notification de cession • Convention de cession • Ordre de réparation • Déclaration d'intervention
          </p>
        </div>
      </div>
    </div>
  );
}