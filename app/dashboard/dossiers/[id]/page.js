"use client";

import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, User, Car, ShieldCheck, Calendar, 
  FileText, Loader2, Edit, Printer, MapPin, 
  Phone, Mail, Image as ImageIcon, Download, 
  Maximize2, X, AlertCircle, Gift, Clock, Key, Gauge,
  Sparkles, ChevronRight, Building2, Euro, CheckCircle2,
  Award, Star, FileSignature, MessageSquare, Send, Minimize2,
  Plus, Upload, Paperclip, Crown, Trash2, ReceiptEuro, Save
} from 'lucide-react';
import clsx from 'clsx';

const DOCUMENT_SLOTS = [
  { key: 'facture', label: 'Facture / Devis', patterns: ['facture', 'devis'] },
  { key: 'carte_grise', label: 'Carte Grise', patterns: ['carte_grise'] },
  { key: 'assurance', label: 'Assurance', patterns: ['assurance', 'attestation'] },
  { key: 'controle_technique', label: 'Contrôle Technique', patterns: ['controle_technique', 'ct'] },
  { key: 'cession', label: 'Cession de créance', patterns: ['cession', 'documents_complets', 'signature'] },
  { key: 'photo_vehicule', label: 'Photo du véhicule', patterns: ['photo_vehicule', 'vehicule'] },
  { key: 'photo_impact', label: "Photo de l'impact", patterns: ['photo_impact', 'impact'] },
  { key: 'photo_avant', label: 'Photo avant pose', patterns: ['photo_avant', 'avant_pose'] },
  { key: 'photo_apres', label: 'Photo après pose', patterns: ['photo_apres', 'apres_pose'] },
];

export default function DetailDossierPremium() {
  const params = useParams();
  const router = useRouter();
  const [dossier, setDossier] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('client');
  
  // États pour la messagerie
  const [user, setUser] = useState(null);
  const [garageId, setGarageId] = useState(null);
  const [garageName, setGarageName] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUploading, setChatUploading] = useState(false);
  const messagesEndRef = useRef(null);

  // États pour les actions rapides
  const [sendingSignature, setSendingSignature] = useState(false);
  const [updatingStatut, setUpdatingStatut] = useState(false);

  // États pour la facturation
  const [invoiceLines, setInvoiceLines] = useState([]);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const addInvoiceLine = () => {
    setInvoiceLines([...invoiceLines, { id: Date.now().toString(), desc: '', qte: 1, prix: 0 }]);
  };
  
  const removeInvoiceLine = (id) => {
    setInvoiceLines(invoiceLines.filter(line => line.id !== id));
  };
  
  const updateInvoiceLine = (id, field, value) => {
    setInvoiceLines(invoiceLines.map(line => line.id === id ? { ...line, [field]: value } : line));
  };

  const calculateTotalHT = () => {
    return invoiceLines.reduce((acc, line) => acc + (parseFloat(line.qte) || 0) * (parseFloat(line.prix) || 0), 0);
  };
  const calculateTVA = () => calculateTotalHT() * 0.20;
  const calculateTotalTTC = () => calculateTotalHT() + calculateTVA();

  const saveInvoiceToDossier = async () => {
    setSavingInvoice(true);
    try {
      const existingNotes = dossier.notes ? (typeof dossier.notes === 'string' ? JSON.parse(dossier.notes) : dossier.notes) : {};
      const newNotes = { ...existingNotes, facture_lignes: invoiceLines };
      const newMontant = calculateTotalTTC();

      const { error: updateError } = await supabase
        .from('dossiers')
        .update({ notes: JSON.stringify(newNotes), montant: newMontant })
        .eq('id', dossier.id);
        
      if (updateError) throw updateError;
      
      setDossier(prev => ({ ...prev, notes: JSON.stringify(newNotes), montant: newMontant }));
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la sauvegarde.");
      throw e;
    } finally {
      setSavingInvoice(false);
    }
  };

  const generateAndSaveInvoicePDF = async () => {
    setGeneratingPDF(true);
    try {
      await saveInvoiceToDossier();
      
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.setTextColor(20, 84, 255);
      doc.text("FACTURE", 14, 20);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Garage: ${garageName || 'Votre Garage'}`, 14, 30);
      doc.text(`Dossier N°: ${dossier.id.substring(0,8)}`, 14, 36);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 42);
      
      doc.setFontSize(14);
      doc.text("CLIENT", 120, 30);
      doc.setFontSize(10);
      doc.text(`${dossier.clients?.nom || ''} ${dossier.clients?.prenom || ''}`, 120, 36);
      doc.text(`${dossier.clients?.adresse || ''}`, 120, 42);
      doc.text(`${dossier.clients?.code_postal || ''} ${dossier.clients?.ville || ''}`, 120, 48);
      
      doc.setDrawColor(200);
      doc.setFillColor(245, 245, 245);
      doc.rect(14, 55, 182, 20, 'F');
      doc.text(`Véhicule: ${dossier.modele_vehicule || 'N/A'} - Immatriculation: ${dossier.immatriculation || 'N/A'}`, 18, 65);
      
      const tableColumn = ["Description", "Quantité", "Prix unitaire HT", "Total HT"];
      const tableRows = invoiceLines.map(line => [
        line.desc || '',
        line.qte || 1,
        `${Number(line.prix || 0).toFixed(2)} €`,
        `${(Number(line.qte || 1) * Number(line.prix || 0)).toFixed(2)} €`
      ]);
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        theme: 'striped',
        headStyles: { fillColor: [20, 84, 255] }
      });
      
      const finalY = doc.lastAutoTable?.finalY || 85;
      
      doc.text(`Total HT: ${calculateTotalHT().toFixed(2)} €`, 140, finalY + 15);
      doc.text(`TVA (20%): ${calculateTVA().toFixed(2)} €`, 140, finalY + 22);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Total TTC: ${calculateTotalTTC().toFixed(2)} €`, 140, finalY + 30);
      
      const pdfBlob = doc.output('blob');
      const fileName = `facture_${dossier.id}_${Date.now()}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(`dossiers/${dossier.id}/${fileName}`, pdfBlob, {
          contentType: 'application/pdf'
        });
        
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(uploadError.message || "Erreur lors de l'upload du fichier dans Supabase.");
      }
      
      await fetchDossierAndDocs(dossier.id);
      doc.save(fileName);
      
      alert("Facture générée, téléchargée et ajoutée au dossier avec succès !");
    } catch (e) {
      console.error(e);
      alert(`Erreur lors de la génération de la facture: ${e.message || e.toString()}`);
    } finally {
      setGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchUserAndGarage();
      fetchDossierAndDocs(params.id);
      fetchMessages(params.id);
    }
  }, [params?.id]);

  // S'abonner aux nouveaux messages en temps réel
  useEffect(() => {
    if (!garageId || !params?.id) return;

    const subscription = supabase
      .channel(`messages-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `dossier_id=eq.${params.id}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            
            const tempIndex = prev.findIndex(m => 
              typeof m.id === 'number' && 
              m.message === newMsg.message && 
              m.sender_role === newMsg.sender_role
            );
            
            if (tempIndex !== -1) {
              const next = [...prev];
              next[tempIndex] = newMsg;
              return next;
            }
            
            return [...prev, newMsg];
          });
          scrollToBottom();
          
          // Si le message vient du gestionnaire et que le chat est fermé, incrémenter le compteur
          if (newMsg.sender_role === 'gestionnaire' && !chatOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [garageId, params?.id, chatOpen]);

  const fetchUserAndGarage = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        
        const { data: garage } = await supabase
          .from('garages')
          .select('id, nom_garage')
          .eq('owner_id', currentUser.id)
          .single();
        
        if (garage) {
          setGarageId(garage.id);
          setGarageName(garage.nom_garage);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDossierAndDocs = async (id) => {
    try {
      const { data: dossierData, error: dossierError } = await supabase
        .from('dossiers')
        .select(`*, clients (*), assurances (nom)`)
        .eq('id', id)
        .single();

      if (dossierError) throw dossierError;
      setDossier(dossierData);
      
      try {
        if (dossierData.notes) {
          const parsedNotes = typeof dossierData.notes === 'string' ? JSON.parse(dossierData.notes) : dossierData.notes;
          if (parsedNotes.facture_lignes && Array.isArray(parsedNotes.facture_lignes) && parsedNotes.facture_lignes.length > 0) {
            setInvoiceLines(parsedNotes.facture_lignes);
          } else {
            setInvoiceLines([{ id: Date.now().toString(), desc: '', qte: 1, prix: 0 }]);
          }
        } else {
          setInvoiceLines([{ id: Date.now().toString(), desc: '', qte: 1, prix: 0 }]);
        }
      } catch (e) {
        setInvoiceLines([{ id: Date.now().toString(), desc: '', qte: 1, prix: 0 }]);
      }

      const { data: files, error: filesError } = await supabase
        .storage
        .from('documents')
        .list(`dossiers/${id}`);

      if (files && files.length > 0) {
        const docsWithUrls = files
          .filter(f => f.name !== '.emptyFolderPlaceholder')
          .map(f => {
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(`dossiers/${id}/${f.name}`);
            
            const fileName = f.name.toLowerCase();
            let label = "Document";
            const matchingSlot = DOCUMENT_SLOTS.find(slot => 
              slot.patterns.some(pattern => fileName.includes(pattern))
            );
            if (matchingSlot) {
              label = matchingSlot.label;
            }
            
            const isImage = fileName.match(/'.(jpg|jpeg|png|gif|webp)$/i) !== null;
            const mayBeImage = !fileName.includes('.') && !fileName.includes('pdf');
            
            return { 
              name: f.name, 
              url: publicUrl, 
              isImage: isImage || mayBeImage, 
              label,
              size: f.metadata?.size
            };
          });
        
        setDocuments(docsWithUrls);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError("Impossible de charger ce dossier.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSlotFile = async (e, slotKey) => {
    const file = e.target.files?.[0];
    if (!file || !dossier) return;

    setUploading(true);
    setUploadingSlot(slotKey);
    setError('');
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${slotKey}_${Date.now()}.${fileExt}`;
      const path = `dossiers/${dossier.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file);

      if (uploadError) throw uploadError;

      // NOTIFY GESTIONNAIRE
      if (dossier.gestionnaire_id) {
        await supabase.from('notifications').insert({
          gestionnaire_id: dossier.gestionnaire_id,
          dossier_id: dossier.id,
          type: 'document',
          title: 'Nouvelle pièce jointe',
          message: `Une pièce jointe a été ajoutée au dossier ${dossier.numero}`,
          link: `/gestionnaire/dossiers/${dossier.id}`
        });
      }

      await fetchDossierAndDocs(dossier.id);
    } catch (err) {
      console.error(err);
      setError("Impossible d'importer le fichier.");
    } finally {
      setUploading(false);
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce document ?")) return;
    setUploading(true);
    try {
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove([`dossiers/${dossier.id}/${fileName}`]);

      if (deleteError) throw deleteError;

      await fetchDossierAndDocs(dossier.id);
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer le document.");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    setError('');
    
    try {
      for (const file of files) {
        let prefix = 'photo_vehicule';
        if (file.type.includes('pdf')) {
          prefix = 'document_assurance';
        } else if (file.name.toLowerCase().includes('grise')) {
          prefix = 'carte_grise';
        } else if (file.name.toLowerCase().includes('impact')) {
          prefix = 'photo_impact';
        }
        
        const path = `dossiers/${params.id}/${prefix}_${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, file);
          
        if (uploadError) throw uploadError;
      }
      
      // NOTIFY GESTIONNAIRE
      if (dossier?.gestionnaire_id) {
        await supabase.from('notifications').insert({
          gestionnaire_id: dossier.gestionnaire_id,
          dossier_id: dossier.id,
          type: 'document',
          title: 'Nouvelle(s) pièce(s) jointe(s)',
          message: `${files.length} pièce(s) jointe(s) ont été ajoutées au dossier ${dossier.numero}`,
          link: `/gestionnaire/dossiers/${dossier.id}`
        });
      }
      
      await fetchDossierAndDocs(params.id);
      
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert("Une erreur est survenue lors de l'envoi des fichiers : " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const fetchMessages = async (dossierId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(data || []);
      
      // Compter les messages non lus du gestionnaire
      const unread = data?.filter(m => m.sender_role === 'gestionnaire' && !m.is_read && m.sender_id !== user?.id).length || 0;
      setUnreadCount(unread);
      
      // Marquer comme lus les messages du gestionnaire
      if (unread > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('dossier_id', dossierId)
          .eq('sender_role', 'gestionnaire')
          .neq('sender_id', user?.id);
      }
      
      scrollToBottom();
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !dossier) return;
    
    if (!garageId) {
      alert("Erreur : impossible d'identifier votre garage. Le message ne peut pas être envoyé.");
      return;
    }
    
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          dossier_id: dossier.id,
          garage_id: garageId,
          sender_id: user?.id,
          sender_name: garageName || user?.email?.split('@')[0] || 'Garagiste',
          sender_role: 'garagiste',
          message: newMessage.trim(),
          is_read: false
        });

      if (error) throw error;
      
      const tempMessage = {
        id: Date.now(),
        dossier_id: dossier.id,
        sender_role: 'garagiste',
        sender_name: garageName || 'Garagiste',
        message: newMessage.trim(),
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      scrollToBottom();
      
      // Ouvrir le chat si fermé
      if (!chatOpen) setChatOpen(true);
      
    } catch (err) {
      console.error('Erreur envoi message:', err);
      alert('Erreur lors de l''envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleChatFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !dossier) return;
    
    if (!garageId) {
      alert("Erreur : impossible d'identifier votre garage.");
      return;
    }
    
    setChatUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const path = `dossiers/${dossier.id}/chat_${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(path);
        
      const messageContent = `📎 Fichier : ${file.name} | ${publicUrl}`;
      
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          dossier_id: dossier.id,
          garage_id: garageId,
          sender_id: user?.id,
          sender_name: garageName || user?.email?.split('@')[0] || 'Garagiste',
          sender_role: 'garagiste',
          message: messageContent,
          is_read: false
        });

      if (msgError) throw msgError;
      
      const tempMessage = {
        id: Date.now(),
        dossier_id: dossier.id,
        sender_role: 'garagiste',
        sender_name: garageName || 'Garagiste',
        message: messageContent,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();
    } catch (err) {
      console.error('Erreur téléversement fichier chat:', err);
      alert('Impossible d''envoyer le fichier : ' + err.message);
    } finally {
      setChatUploading(false);
      e.target.value = '';
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleUpdateStatus = async (newStatut) => {
    if (updatingStatut) return;
    setUpdatingStatut(true);
    try {
      let updatedNotesObj = null;
      if (newStatut === 'termine') {
        const { data: noteData } = await supabase
          .from('dossiers')
          .select('notes')
          .eq('id', dossier.id)
          .single();
        
        const currentNotesObj = JSON.parse(noteData?.notes || '{}');
        updatedNotesObj = {
          ...currentNotesObj,
          previous_status: dossier.statut
        };
      }

      const updatePayload = { statut: newStatut };
      if (updatedNotesObj) {
        updatePayload.notes = JSON.stringify(updatedNotesObj);
      }

      const { error } = await supabase
        .from('dossiers')
        .update(updatePayload)
        .eq('id', dossier.id);

      if (error) throw error;

      const statusLabels = {
        termine: 'Terminé',
        reglement_en_cours: 'Règlement en cours',
        reglement_recu: 'Règlement reçu',
        desistement: 'Désistement'
      };
      const friendlyLabel = statusLabels[newStatut] || newStatut;
      
      // Enregistrer également dans le journal d'activité (tchat)
      await supabase.from('messages').insert({
        dossier_id: dossier.id,
        garage_id: dossier.garage_id,
        sender_id: user.id,
        sender_name: 'Système',
        sender_role: 'system',
        message: `${user.user_metadata?.prenom || user.user_metadata?.first_name || 'Le garagiste'} a changé le statut du dossier en "${friendlyLabel}".`,
        is_read: false
      });

      setDossier(prev => ({ 
        ...prev, 
        statut: newStatut,
        ...(updatedNotesObj ? { notes: JSON.stringify(updatedNotesObj) } : {})
      }));
      alert(`Statut du dossier mis à jour en : "${friendlyLabel}"`);
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      alert('Impossible de mettre à jour le statut.');
    } finally {
      setUpdatingStatut(false);
    }
  };

  const addSystemNote = async (text) => {
    try {
      const newNote = {
        id: Date.now().toString(),
        text: text,
        created_at: new Date().toISOString(),
        isSystem: true
      };
      
      const { data } = await supabase.from('dossiers').select('notes').eq('id', dossier.id).single();
      const currentNotesObj = JSON.parse(data?.notes || '{}');
      const currentRelanceNotes = currentNotesObj.relance_notes || [];
      
      const updatedNotesList = [newNote, ...currentRelanceNotes];
      const updatedNotesObj = {
        ...currentNotesObj,
        relance_notes: updatedNotesList
      };
      
      await supabase
        .from('dossiers')
        .update({ notes: JSON.stringify(updatedNotesObj) })
        .eq('id', dossier.id);
    } catch (err) {
      console.error('Erreur ajout note système:', err);
    }
  };

  const handleDeleteDossier = async () => {
    const confirmDelete = window.confirm(
      "⚠️ Êtes-vous sûr de vouloir supprimer définitivement ce dossier ? Cette action est irréversible et effacera toutes les données associées."
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('dossiers')
        .delete()
        .eq('id', dossier.id);

      if (error) throw error;

      alert("Dossier supprimé avec succès.");
      router.push('/dashboard/dossiers');
    } catch (err) {
      console.error('Erreur suppression dossier:', err);
      alert("Une erreur est survenue lors de la suppression du dossier.");
    }
  };

  const handleSendSignatureLink = async () => {
    if (sendingSignature) return;
    
    const confirmSend = window.confirm(
      `Souhaitez-vous envoyer le lien de signature électronique par e-mail à ${client?.email || "l'adresse email du client"} ?`
    );
    if (!confirmSend) return;

    setSendingSignature(true);
    try {
      const response = await fetch('/api/dossiers/send-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dossierId: dossier.id }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Erreur lors de l'envoi de l'email.");
      }

      alert(resData.message || "Lien de signature envoyé avec succès !");
    } catch (err) {
      console.error("Erreur d'envoi du lien de signature:", err);
      alert(err.message || "Impossible d'envoyer le lien de signature.");
    } finally {
      setSendingSignature(false);
    }
  };

  const getStatutStyle = (statut) => {
    const styles = {
      en_attente: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'En attente', icon: Clock },
      action_requise: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', label: 'Action requise', icon: AlertCircle },
      signe: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', label: 'Signature validée', icon: FileSignature },
      en_cours: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500', label: 'En cours', icon: Car },
      termine: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Terminé', icon: CheckCircle2 },
      reglement_en_cours: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', label: 'Règlement en cours', icon: Euro },
      reglement_recu: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Règlement reçu', icon: CheckCircle2 },
      desistement: { bg: 'bg-transparent', text: 'text-slate-300', border: 'border-white/10', dot: 'bg-transparent0', label: 'Désistement', icon: AlertCircle },
    };
    return styles[statut] || styles.en_attente;
  };

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

  if (error || !dossier) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={40} className="text-rose-500" />
          </div>
          <p className="text-rose-600 font-medium">{error || "Dossier introuvable"}</p>
          <Link href="/dashboard/dossiers" className="inline-flex items-center gap-2 mt-4 text-[var(--blue)] hover:text-[#0ea5e9] transition-colors">
            <ArrowLeft size={16} /> Retour aux dossiers
          </Link>
        </div>
      </div>
    );
  }

  const client = dossier.clients;
  const statutStyle = getStatutStyle(dossier.statut);
  const StatutIcon = statutStyle.icon;

  const matchedDocs = {};
  const otherDocs = [];

  DOCUMENT_SLOTS.forEach(slot => {
    matchedDocs[slot.key] = null;
  });

  documents.forEach(doc => {
    const fileNameLower = doc.name.toLowerCase();
    let matched = false;
    
    for (const slot of DOCUMENT_SLOTS) {
      if (slot.patterns.some(pattern => fileNameLower.includes(pattern))) {
        if (!matchedDocs[slot.key]) {
          matchedDocs[slot.key] = doc;
          matched = true;
          break;
        }
      }
    }
    
    if (!matched) {
      otherDocs.push(doc);
    }
  });

  return (
    <div className="min-h-screen bg-transparent font-sans">
      
      {/* Header */}
      <div className="relative overflow-hidden bg-[var(--white)] border-b border-[var(--stone)]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#1454FF]/5 via-transparent to-transparent rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative z-10">
          <Link 
            href="/dashboard/dossiers" 
            className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--blue)] transition-colors text-sm font-medium mb-6 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Retour aux dossiers
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#18170F] rounded-2xl flex items-center justify-center shadow-md">
                    <FileText size={22} className="text-[var(--ink)]" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-serif text-[var(--ink)] tracking-tight">
                    {dossier.numero}
                  </h1>
                </div>
                <div className={clsx(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border",
                  statutStyle.bg, statutStyle.text, statutStyle.border
                )}>
                  <StatutIcon size={14} />
                  {statutStyle.label}
                </div>
                <div className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border",
                  dossier.type === 'prestige' 
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}>
                  {dossier.type === 'prestige' ? <Crown size={14} /> : <Star size={14} />}
                  Dossier {dossier.type === 'prestige' ? 'Prestige' : 'Simple'}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-[var(--blue)]" />
                  Créé le {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[var(--blue)]" />
                  {new Date(dossier.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                </span>
                <span className="flex items-center gap-1.5">
                  <Car size={14} className="text-[var(--blue)]" />
                  {dossier.immatriculation}
                </span>
              </div>
            </div>
            
            {/* Actions buttons */}
            <div className="flex flex-wrap gap-3 print:hidden">
              <button 
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-[var(--white)] border border-[var(--stone)] hover:border-[#1454FF] hover:bg-[var(--blue)]/10 text-[var(--muted)] hover:text-[var(--blue)] rounded-xl font-medium transition-all flex items-center gap-2 text-sm shadow-md"
              >
                <Printer size={16} /> 
                <span className="hidden sm:inline">Imprimer</span>
              </button>

              <button
                onClick={() => setChatOpen(true)}
                className="relative px-5 py-2.5 bg-[var(--blue)]/10 hover:bg-[var(--blue)] text-[var(--blue)] hover:text-[var(--ink)] rounded-xl font-medium transition-all flex items-center gap-2 text-sm shadow-md"
              >
                <MessageSquare size={16} />
                <span className="hidden sm:inline">Message</span>
                {unreadCount > 0 && !chatOpen && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-[var(--ink)] text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <Link 
                href={`/dashboard/dossiers/${dossier.id}/cession`}
                className={clsx(
                  "px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm shadow-md",
                  dossier.signature_url
                    ? "bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-100"
                    : "bg-[var(--blue)] text-[var(--ink)] hover:bg-[#0ea5e9] shadow-md shadow-[#1454FF]/25"
                )}
              >
                <FileSignature size={16} /> 
                <span className="hidden sm:inline">
                  {dossier.signature_url ? 'Cession signée' : 'Faire signer'}
                </span>
              </Link>

              <Link 
                href={`/dashboard/dossiers/${dossier.id}/modifier`}
                className="px-5 py-2.5 bg-[#18170F] hover:bg-[#2A2820] text-[var(--ink)] rounded-xl font-medium transition-all shadow-md flex items-center gap-2 text-sm"
              >
                <Edit size={16} /> 
                <span className="hidden sm:inline">Modifier</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs mobile */}
      <div className="sticky top-0 z-30 bg-[var(--white)] backdrop-blur-sm border-b border-[var(--stone)] lg:hidden shadow-md">
        <div className="flex justify-around px-4 py-2">
          {[
            { id: 'client', label: 'Client', icon: User },
            { id: 'vehicule', label: 'Véhicule', icon: Car },
            { id: 'facturation', label: 'Facture', icon: ReceiptEuro },
            { id: 'assurance', label: 'Assurance', icon: ShieldCheck },
            { id: 'documents', label: 'Docs', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all",
                activeTab === tab.id 
                  ? "text-[var(--blue)] border-b-2 border-[#1454FF]" 
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              )}
            >
              <tab.icon size={18} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne gauche - 2/3 (contenu existant) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* VÉHICULE & INTERVENTION */}
            <div className={clsx(
              "bg-[#120052] text-white   rounded-2xl shadow-md border-white/10 border-[var(--stone)] overflow-hidden transition-all hover:shadow-md",
              activeTab !== 'vehicule' && "hidden lg:block"
            )}>
              {/* ... contenu existant ... */}
              <div className="p-6 md:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
                      <Car size={18} className="text-[var(--blue)]" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Véhicule & intervention</h2>
                  </div>
                  <div className="px-3 py-1.5 bg-[var(--white)] rounded-lg text-[var(--blue)] font-mono font-semibold text-sm border border-[var(--stone)]">
                    {dossier.immatriculation}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">Modèle</p>
                    <p className="font-semibold text-[var(--ink)]">{dossier.modele_vehicule || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">Vitrage concerné</p>
                    <p className="inline-flex px-2 py-1 bg-[var(--blue)]/10 text-[var(--blue)] font-medium rounded-lg text-sm border border-[var(--stone)]">
                      {dossier.type_vitrage || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">Kilométrage</p>
                    <p className="font-semibold text-[var(--ink)] flex items-center gap-1">
                      <Gauge size={14} className="text-[var(--muted)]" />
                      {dossier.kilometrage ? `${dossier.kilometrage.toLocaleString()} km` : '-'}
                    </p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 pt-5 border-t border-[var(--stone)] mt-2">
                    <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">Raison de l'intervention</p>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-8 bg-[var(--blue)] rounded-full"></div>
                      <p className="text-[var(--ink)] font-medium leading-relaxed">{dossier.raison_sinistre || 'Non spécifiée'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CLIENT */}
            <div className={clsx(
              "bg-[#120052] text-white   rounded-2xl shadow-md border-white/10 border-[var(--stone)] overflow-hidden transition-all hover:shadow-md",
              activeTab !== 'client' && "hidden lg:block"
            )}>
              {/* ... contenu existant ... */}
              <div className="p-6 md:p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
                    <User size={18} className="text-[var(--blue)]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--ink)]">Informations client</h2>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-[#18170F] rounded-full flex items-center justify-center shadow-md">
                        <span className="text-[var(--ink)] font-serif italic text-lg">
                          {client?.prenom?.charAt(0)}{client?.nom?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[var(--ink)]">{client?.prenom} {client?.nom}</p>
                        <p className="text-xs text-[var(--muted)]">Client depuis le {new Date(dossier.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <a href={`tel:${client?.telephone}`} className="flex items-center gap-3 text-[var(--muted)] hover:text-[var(--blue)] transition-colors group p-2 rounded-lg hover:bg-[var(--blue)]/10">
                        <Phone size={16} className="text-white/50 group-hover:text-white" />
                        <span className="font-medium text-sm">{client?.telephone || 'Non renseigné'}</span>
                      </a>
                      <a href={`mailto:${client?.email}`} className="flex items-center gap-3 text-[var(--muted)] hover:text-[var(--blue)] transition-colors group p-2 rounded-lg hover:bg-[var(--blue)]/10">
                        <Mail size={16} className="text-white/50 group-hover:text-white" />
                        <span className="font-medium text-sm truncate">{client?.email || 'Non renseigné'}</span>
                      </a>
                      <div className="flex items-start gap-3 text-[var(--muted)] p-2 rounded-lg sm:col-span-2">
                        <MapPin size={16} className="text-[var(--muted)] mt-0.5 flex-shrink-0" />
                        <span className="font-medium text-sm leading-relaxed">{client?.adresse || 'Non renseignée'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {dossier.date_rdv && (
                    <div className="bg-gradient-to-br from-[#EEF2FF] to-white rounded-xl p-4 border border-[#1454FF]/20 min-w-[160px]">
                      <p className="text-xs text-[var(--blue)] font-semibold mb-2 flex items-center gap-1">
                        <Calendar size={12} /> RDV PROGRAMMÉ
                      </p>
                      <p className="text-base font-bold text-[var(--ink)]">
                        {new Date(dossier.date_rdv).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})}
                      </p>
                      <p className="text-sm text-[var(--muted)] mt-1">
                        {new Date(dossier.date_rdv).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ASSURANCE & SINISTRE */}
            <div className={clsx(
              "bg-[#120052] text-white   rounded-2xl shadow-md border-white/10 border-[var(--stone)] overflow-hidden transition-all hover:shadow-md",
              activeTab !== 'assurance' && "hidden lg:block"
            )}>
              {/* ... contenu existant ... */}
              <div className="p-6 md:p-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={18} className="text-[var(--blue)]" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Sinistre & assurance</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">Compagnie d'assurance</p>
                    <p className="font-semibold text-lg text-[var(--blue)]">
                      {(() => {
                        let notesObj = {};
                        try { if (dossier.notes) notesObj = JSON.parse(dossier.notes); } catch(e) {}
                        return dossier.assurances?.nom || notesObj.assurance_nom_ocr || 'Aucune';
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">N° Contrat</p>
                    <p className="font-mono text-sm text-[var(--ink)] bg-[var(--white)] px-2 py-1 rounded inline-block">{dossier.num_contrat || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">N° Sinistre</p>
                    <p className="font-mono text-sm text-[var(--ink)]">{dossier.num_sinistre || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">Date sinistre</p>
                    <p className="text-[var(--ink)] font-medium">{dossier.date_sinistre ? new Date(dossier.date_sinistre).toLocaleDateString('fr-FR') : '-'}</p>
                  </div>
                  <div className="md:col-span-2 pt-5 border-t border-[var(--stone)] mt-2">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">Franchise restante</p>
                        <p className="text-3xl font-bold text-[var(--blue)]">
                          {dossier.franchise_montant > 0 ? `${dossier.franchise_montant.toLocaleString()} ${dossier.franchise_type === 'euro' ? '€' : '%'}` : '0 €'}
                        </p>
                      </div>
                      {dossier.cadeau && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl px-4 py-2 border border-amber-200">
                          <div className="flex items-center gap-2">
                            <Gift size={16} className="text-amber-600" />
                            <span className="text-amber-700 font-semibold text-sm">Offre : {dossier.cadeau}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FACTURATION */}
            <div className={clsx(
              "bg-[#120052] text-white   rounded-2xl shadow-md border-white/10 border-[var(--stone)] overflow-hidden transition-all hover:shadow-md",
              activeTab !== 'facturation' && "hidden lg:block"
            )}>
              <div className="p-6 md:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--blue)]/10 rounded-xl flex items-center justify-center">
                      <ReceiptEuro size={18} className="text-[var(--blue)]" />
                    </div>
                    <h2 className="text-lg font-semibold text-[var(--ink)]">Facturation & Devis</h2>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={saveInvoiceToDossier}
                      disabled={savingInvoice}
                      className="px-3 py-1.5 bg-[var(--white)] border border-[var(--stone)] hover:bg-[var(--stone)] text-[var(--ink)] rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {savingInvoice ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span className="hidden sm:inline">Sauvegarder</span>
                    </button>
                    <button 
                      onClick={generateAndSaveInvoicePDF}
                      disabled={generatingPDF}
                      className="px-3 py-1.5 bg-[var(--blue)] hover:bg-[#0ea5e9] text-[var(--ink)] rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-md shadow-[#1454FF]/20"
                    >
                      {generatingPDF ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                      <span className="hidden sm:inline">Générer PDF</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 px-2">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Qté</div>
                    <div className="col-span-3 text-right">Prix HT</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  <datalist id="invoice-desc-options">
                    <option value="Remplacement Pare-brise" />
                    <option value="Remplacement Lunette arrière" />
                    <option value="Remplacement Latérale AV Gauche" />
                    <option value="Remplacement Latérale AV Droite" />
                    <option value="Remplacement Latérale AR Gauche" />
                    <option value="Remplacement Latérale AR Droite" />
                    <option value="Remplacement Toit panoramique" />
                    <option value="Remplacement Optique de phare" />
                    <option value="Réparation d'impact" />
                    <option value="Calibrage caméra ADAS" />
                    <option value="Forfait Main d'œuvre" />
                    <option value="Traitement anti-pluie" />
                  </datalist>
                  
                  {invoiceLines.map((line, index) => (
                    <div key={line.id} className="grid grid-cols-12 gap-2 items-center bg-[var(--stone)]/30 p-2 rounded-xl">
                      <div className="col-span-6">
                        <input 
                          type="text" 
                          list="invoice-desc-options"
                          value={line.desc} 
                          onChange={(e) => updateInvoiceLine(line.id, 'desc', e.target.value)}
                          placeholder="Ex: Remplacement pare-brise" 
                          className="w-full bg-[var(--white)] border border-[var(--stone)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--blue)] transition-colors"
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          value={line.qte} 
                          min="1"
                          onChange={(e) => updateInvoiceLine(line.id, 'qte', e.target.value)}
                          className="w-full bg-[var(--white)] border border-[var(--stone)] rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-[var(--blue)] transition-colors"
                        />
                      </div>
                      <div className="col-span-3 relative">
                        <input 
                          type="number" 
                          value={line.prix} 
                          min="0"
                          step="0.01"
                          onChange={(e) => updateInvoiceLine(line.id, 'prix', e.target.value)}
                          className="w-full bg-[var(--white)] border border-[var(--stone)] rounded-lg pl-3 pr-8 py-2 text-sm text-right focus:outline-none focus:border-[var(--blue)] transition-colors"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">€</span>
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button 
                          onClick={() => removeInvoiceLine(line.id)}
                          className="p-2 text-[var(--muted)] hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={addInvoiceLine}
                    className="w-full py-3 mt-2 border-2 border-dashed border-[var(--stone)] hover:border-[var(--blue)] text-[var(--muted)] hover:text-[var(--blue)] rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Plus size={16} /> Ajouter une ligne
                  </button>

                  <div className="flex justify-end mt-6 pt-6 border-t border-[var(--stone)]">
                    <div className="w-full sm:w-64 space-y-3">
                      <div className="flex justify-between text-sm text-[var(--muted)]">
                        <span>Total HT</span>
                        <span>{calculateTotalHT().toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm text-[var(--muted)]">
                        <span>TVA (20%)</span>
                        <span>{calculateTVA().toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-base font-bold text-[var(--ink)] pt-2 border-t border-[var(--stone)]">
                        <span>Total TTC</span>
                        <span>{calculateTotalTTC().toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PIÈCES JOINTES */}
            <div className={clsx(
              "bg-[#120052] text-white   rounded-2xl shadow-md border-white/10 border-[var(--stone)] overflow-hidden transition-all hover:shadow-md",
              activeTab !== 'documents' && "hidden lg:block"
            )}>
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--blue)]/10 rounded-lg flex items-center justify-center">
                    <ImageIcon size={16} className="text-[var(--blue)]" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">Pièces jointes</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-white/20 text-white px-2.5 py-1 rounded-full text-xs font-medium hidden sm:inline-block">
                    {documents.length} fichier(s)
                  </span>
                  
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--blue)] hover:bg-[#0ea5e9] text-[var(--ink)] rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-[#1454FF]/25">
                    {uploading && !uploadingSlot ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Ajouter des photos/docs
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      accept="image/*,application/pdf"
                      onChange={handleUploadFiles} 
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              {uploading && !uploadingSlot && (
                <div className="px-6 py-3 bg-[var(--blue)]/10 border-b border-[var(--stone)] flex items-center gap-2 text-xs text-[var(--blue)] font-semibold animate-pulse">
                  <Loader2 size={14} className="animate-spin" />
                  Téléchargement de vos fichiers en cours...
                </div>
              )}
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Documents requis</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {DOCUMENT_SLOTS.map((slot) => {
                      const doc = matchedDocs[slot.key];
                      const isSlotUploading = uploadingSlot === slot.key;
                      
                      return (
                        <div 
                          key={slot.key}
                          className={clsx(
                            "group relative rounded-xl border overflow-hidden transition-all flex flex-col justify-between aspect-[4/3]",
                            doc 
                              ? "bg-white/10 border-white/20 hover:border-white/40 hover:shadow-md cursor-pointer" 
                              : "bg-white/5 border-dashed border-2 border-white/20 hover:border-white/40 hover:bg-white/10"
                          )}
                          onClick={() => {
                            if (doc && doc.isImage) {
                              setSelectedImage(doc.url);
                            }
                          }}
                        >
                          {doc ? (
                            <>
                              <div className="flex-1 flex items-center justify-center bg-transparent relative overflow-hidden">
                                {doc.isImage ? (
                                  <img 
                                    src={doc.url} 
                                    alt={slot.label} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center w-full h-full">
                                    <FileText size={32} className="text-[var(--muted)]" />
                                    <span className="text-[10px] text-slate-300 mt-1 font-semibold">PDF</span>
                                  </div>
                                )}
                                
                                <div className="absolute inset-0 bg-[#18170F]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  {doc.isImage && (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setSelectedImage(doc.url); }}
                                      className="p-2 bg-[var(--white)] hover:bg-[var(--white)] text-[var(--ink)] rounded-lg transition-colors"
                                    >
                                      <Maximize2 size={16} />
                                    </button>
                                  )}
                                  <a 
                                    href={doc.url} 
                                    download 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 bg-[var(--white)] hover:bg-[var(--white)] text-[var(--ink)] rounded-lg transition-colors"
                                  >
                                    <Download size={16} />
                                  </a>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(doc.name); }}
                                    className="p-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="p-3 bg-white/10 border-t border-white/10">
                                <p className="text-xs font-bold text-white truncate">{slot.label}</p>
                                <p className="text-[10px] text-slate-300 mt-0.5 truncate">{doc.name}</p>
                              </div>
                            </>
                          ) : (
                            <label className="flex-1 flex flex-col items-center justify-center p-4 cursor-pointer text-center select-none w-full h-full">
                              {isSlotUploading ? (
                                <Loader2 size={24} className="animate-spin text-[var(--blue)]" />
                              ) : (
                                <Upload size={24} className="text-white/50 group-hover:text-white transition-colors mb-2" />
                              )}
                              <span className="text-xs font-bold text-white group-hover:text-[var(--blue)] transition-colors">
                                {slot.label}
                              </span>
                              <span className="text-[10px] text-slate-300 mt-1">
                                {isSlotUploading ? 'Importation...' : 'Ajouter le document'}
                              </span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*,application/pdf"
                                onChange={(e) => handleUploadSlotFile(e, slot.key)}
                                disabled={uploading}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {otherDocs.length > 0 && (
                  <div className="pt-4 border-t border-[var(--stone)]">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Autres documents</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {otherDocs.map((doc, idx) => (
                        <div 
                          key={idx} 
                          className="group relative rounded-xl bg-white/5 border border-white/20 overflow-hidden text-white hover:border-[#1454FF] hover:shadow-lg transition-all cursor-pointer"
                          onClick={() => doc.isImage && setSelectedImage(doc.url)}
                        >
                          <div className="aspect-square flex items-center justify-center bg-white/10 relative overflow-hidden">
                            {doc.isImage ? (
                              <img 
                                src={doc.url} 
                                alt={doc.label} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center w-full h-full">
                                <FileText size={32} className="text-slate-300" />
                                <span className="text-[10px] text-slate-300 mt-1">PDF</span>
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-[#18170F]/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {doc.isImage && (
                                <button className="p-1.5 bg-[var(--white)] rounded-lg hover:bg-[var(--white)] transition-colors">
                                  <Maximize2 className="text-[var(--ink)]" size={16} />
                                </button>
                              )}
                              <a 
                                href={doc.url} 
                                download 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 bg-[var(--white)] rounded-lg hover:bg-[var(--white)] transition-colors"
                              >
                                <Download className="text-[var(--ink)]" size={16} />
                              </a>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(doc.name); }}
                                className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="p-3 bg-white/10 border-t border-white/20 text-center">
                            <p className="text-xs font-medium text-white truncate">{doc.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes internes */}
            {dossier.commentaire && (
              <div className="bg-[#120052] text-white rounded-2xl shadow-md border-white/10 border-[var(--stone)] overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                      <FileText size={12} className="text-white" />
                    </div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Notes internes</h3>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <p className="text-white text-sm leading-relaxed">{dossier.commentaire}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite - Widgets */}
          <div className="space-y-6">
            
            {/* Carte récapitulative */}
            <div className="bg-[#120052] text-white rounded-2xl border-white/10 border-[var(--stone)] p-6 shadow-md">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-[var(--blue)]/10 rounded-lg flex items-center justify-center">
                  <Sparkles size={14} className="text-[var(--blue)]" />
                </div>
                <h3 className="text-sm font-bold text-[var(--blue)] uppercase tracking-wider">Récapitulatif</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--stone)]">
                  <span className="text-[var(--muted)] text-sm">N° dossier</span>
                  <span className="text-[var(--ink)] font-mono font-bold text-sm">{dossier.numero}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[var(--stone)]">
                  <span className="text-[var(--muted)] text-sm">Statut</span>
                  <span className={clsx("font-semibold text-sm", statutStyle.text)}>{statutStyle.label}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[var(--stone)]">
                  <span className="text-[var(--muted)] text-sm">Client</span>
                  <span className="text-[var(--ink)] font-medium text-sm">{client?.prenom} {client?.nom}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[var(--stone)]">
                  <span className="text-[var(--muted)] text-sm">Véhicule</span>
                  <span className="text-[var(--ink)] font-medium text-sm">{dossier.modele_vehicule}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--muted)] text-sm">Franchise</span>
                  <span className="text-[var(--blue)] font-bold">
                    {dossier.franchise_montant > 0 ? `${dossier.franchise_montant.toLocaleString()} ${dossier.franchise_type === 'euro' ? '€' : '%'}` : '0 €'}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-[var(--stone)]">
                <Link 
                  href={`/dashboard/dossiers/${dossier.id}/modifier`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--white)] hover:bg-[var(--blue)]/10 rounded-xl text-[var(--blue)] font-semibold transition-all text-sm border border-[var(--stone)] hover:border-[#1454FF]"
                >
                  Modifier le dossier <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Widget: Actions rapides (sans Glassphère) */}
            <div className="bg-[#1C3D4E] rounded-2xl border border-[#2c617a] p-6 shadow-md text-[var(--ink)] space-y-5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
                Actions rapides
              </h3>
              
              <div className="space-y-3">
                {/* Envoyer lien de signature */}
                <button
                  onClick={handleSendSignatureLink}
                  disabled={sendingSignature}
                  className="w-full py-3 px-4 border border-white hover:bg-[var(--white)] text-[var(--ink)] font-semibold rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 active:scale-98"
                >
                  {sendingSignature ? <Loader2 size={16} className="animate-spin text-[var(--ink)]" /> : <Mail size={16} />}
                  Envoyer lien de signature
                </button>

                {/* Cession de créance */}
                <button
                  onClick={() => {
                    if (dossier?.signature_url) {
                      window.open(dossier.signature_url, '_blank');
                    } else {
                      router.push(`/dashboard/dossiers/${dossier.id}/cession`);
                    }
                  }}
                  className="w-full py-3 px-4 border border-[#00bcd4] hover:bg-[#00bcd4]/10 text-[#00bcd4] font-bold rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm active:scale-98"
                >
                  <FileSignature size={16} />
                  Cession de créance
                </button>

                <div className="h-px bg-[var(--white)] my-4" />

                {/* Désistement */}
                <button
                  onClick={() => handleUpdateStatus('desistement')}
                  disabled={updatingStatut}
                  className="w-full py-2.5 px-4 border border-slate-400 hover:bg-slate-400/10 text-[var(--muted)] font-semibold rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm active:scale-98"
                >
                  <AlertCircle size={16} className="text-[var(--muted)]" />
                  Désistement
                </button>

                {/* Supprimer le dossier */}
                <button
                  onClick={handleDeleteDossier}
                  className="w-full py-2.5 px-4 border border-rose-500 hover:bg-rose-500/10 text-rose-400 font-semibold rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm active:scale-98"
                >
                  <Trash2 size={16} className="text-rose-500" />
                  Supprimer le dossier
                </button>
              </div>
            </div>

            {/* Badge satisfaction */}
            <div className="bg-[#120052] text-white rounded-2xl border-white/10 border-[var(--stone)] p-5 shadow-md text-center">
              <div className="flex justify-center gap-1 mb-3">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm font-semibold text-[var(--ink)]">Service client premium</p>
              <p className="text-xs text-[var(--muted)] mt-1">Support prioritaire 24/7</p>
            </div>

            {/* Badge GlassPilot */}
            <div className="bg-[#18170F] rounded-2xl p-5 text-center shadow-md">
              <Award size={24} className="text-[var(--ink)]/80 mx-auto mb-2" />
              <p className="text-[var(--ink)] font-bold text-sm">GlassPilot Pro</p>
              <p className="text-[var(--ink)]/60 text-xs mt-1">Gestion optimisée</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal image */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18170F]/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
             onClick={() => setSelectedImage(null)}>
          <button 
            className="absolute top-4 right-4 text-[var(--ink)] hover:text-rose-400 transition-colors bg-[var(--white)] rounded-full p-2 hover:bg-[var(--white)]"
            onClick={() => setSelectedImage(null)}
          >
            <X size={20} />
          </button>
          <img 
            src={selectedImage} 
            alt="Prévisualisation" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Fenêtre de chat flottante */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 bg-[#120052] text-white rounded-2xl shadow-2xl border-white/10 border-[var(--stone)] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header du chat */}
          <div 
            className="bg-gradient-to-r from-[#1454FF] to-[#0040CC] px-4 py-3 flex items-center justify-between cursor-pointer group"
            onClick={() => setChatOpen(false)}
            title="Cliquez pour fermer la discussion"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--white)] rounded-lg flex items-center justify-center">
                <MessageSquare size={14} className="text-[var(--ink)]" />
              </div>
              <div>
                <span className="text-[var(--ink)] font-semibold text-sm group-hover:underline">Discussion avec le gestionnaire</span>
                <p className="text-[var(--ink)]/70 text-xs">Dossier {dossier.numero}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setChatOpen(false); }}
              className="text-[var(--ink)]/70 hover:text-[var(--ink)] transition-colors p-1 rounded-full hover:bg-white/10"
              title="Fermer la discussion"
            >
              <X size={18} />
            </button>
          </div>

          {/* Corps du chat */}
          <div className="h-96 overflow-y-auto p-4 space-y-3 bg-[var(--white)]">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare size={32} className="text-[var(--muted)] mx-auto mb-2 opacity-50" />
                <p className="text-sm text-[var(--muted)]">Aucun message pour le moment</p>
                <p className="text-xs text-[var(--muted)] mt-1">Soyez le premier à envoyer un message</p>
              </div>
            ) : (
              messages.map((msg, idx) => {

                if (msg.sender_role === 'system') {
                  return (
                    <div key={idx} className="flex justify-center my-3 w-full">
                      <div className="bg-slate-200/30 border border-slate-300/30 text-slate-500 text-[11px] font-medium px-4 py-1.5 rounded-full flex items-center gap-1.5 max-w-[85%] text-center backdrop-blur-sm">
                        <AlertCircle size={12} className="shrink-0" />
                        <span>{msg.message}</span>
                      </div>
                    </div>
                  );
                }
                const isMe = msg.sender_role === 'garagiste';
                return (
                  <div
                    key={idx}
                    className={clsx(
                      "flex flex-col max-w-[80%]",
                      isMe ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={clsx(
                      "px-4 py-2 rounded-2xl text-sm shadow-md",
                      isMe
                        ? "bg-[var(--blue)] text-[var(--ink)] rounded-br-none"
                        : "bg-[var(--white)]   border border-[var(--stone)] text-[var(--ink)] rounded-bl-none"
                    )}>
                      {msg.message.startsWith('📎 Fichier :') ? (
                        (() => {
                          const parts = msg.message.replace('📎 Fichier : ', '').split(' | ');
                          const fileName = parts[0] || 'Fichier';
                          const fileUrl = parts[1] || '#';
                          const isImg = fileName.match(/'.(jpg|jpeg|png|gif|webp)$/i) !== null;
                          return (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <div className="flex items-center gap-2">
                                <FileText size={16} className={isMe ? "text-blue-100 animate-pulse" : "text-[var(--blue)]"} />
                                <span className="font-semibold underline break-all text-xs">{fileName}</span>
                              </div>
                              {isImg && (
                                <img
                                  src={fileUrl}
                                  alt={fileName}
                                  className="max-w-full max-h-48 object-cover rounded-lg border border-white/10 mt-1 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setSelectedImage(fileUrl)}
                                />
                              )}
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={clsx(
                                  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all mt-1",
                                  isMe
                                    ? "bg-[var(--white)]   hover:bg-[var(--white)]   text-[var(--ink)]"
                                    : "bg-blue-50 hover:bg-blue-100 text-[var(--blue)]"
                                )}
                              >
                                <Download size={12} /> Télécharger
                              </a>
                            </div>
                          );
                        })()
                      ) : (
                        <p className="break-words leading-relaxed">{msg.message}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] text-slate-300">
                        {isMe ? 'Vous' : msg.sender_name || 'Gestionnaire'}
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {chatUploading && (
              <div className="flex flex-col items-center justify-center p-3 bg-blue-50/50 border border-blue-100 rounded-2xl animate-pulse text-xs text-blue-600 gap-1.5 self-center">
                <Loader2 size={16} className="animate-spin" />
                <span>Envoi du fichier en cours...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input du chat */}
          <div className="border-t border-[var(--stone)] p-3 bg-[var(--white)]">
            <div className="flex items-end gap-2">
              <input
                type="file"
                id="chat-file-upload-garagiste"
                className="hidden"
                onChange={handleChatFileUpload}
                disabled={chatUploading}
              />
              <label
                htmlFor="chat-file-upload-garagiste"
                className={clsx(
                  "w-10 h-10 bg-transparent hover:bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0 border border-white/10 hover:border-slate-300 active:scale-95",
                  chatUploading && "opacity-50 pointer-events-none"
                )}
              >
                <Paperclip size={18} />
              </label>

              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={chatUploading}
                placeholder="Écrivez votre message..."
                className="flex-1 px-3 py-2 bg-[var(--white)] border border-[var(--stone)] rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#1454FF] focus:ring-2 focus:ring-[#1454FF]/20 transition-all resize-none disabled:opacity-50"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={sendingMessage || !newMessage.trim() || chatUploading}
                className="w-10 h-10 bg-[var(--blue)] hover:bg-[#0ea5e9] disabled:bg-[#E6E4DD] rounded-xl flex items-center justify-center transition-colors shrink-0 cursor-pointer active:scale-95"
              >
                {sendingMessage ? (
                  <Loader2 size={18} className="animate-spin text-[var(--ink)]" />
                ) : (
                  <Send size={18} className="text-[var(--ink)]" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-300 mt-2 text-center">
              Appuyez sur Entrée pour envoyer • Maj+Entrée pour retour à la ligne
            </p>
          </div>
        </div>
      )}
    </div>
  );
}