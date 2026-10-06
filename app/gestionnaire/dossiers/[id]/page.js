"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase, getValidUser, getGestionnaire } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';
import {
  ArrowLeft, Save, Loader2, Calendar, ShieldCheck, FileText, FileSignature,
  Clock, CheckCircle, AlertTriangle, User, Car, Building2, Phone, Mail, FileDigit, ReceiptEuro,
  Image as ImageIcon, Maximize2, Download, X, MessageSquare, Send, Minimize2, MoreVertical, Trash2, Check, ChevronRight, Paperclip, Upload, Plus, Pencil, Eye
} from 'lucide-react';
import clsx from 'clsx';
import { REFERENTIEL_ASSURANCES } from '@/lib/referentielAssurances';

const DOCUMENT_SLOTS = [
  { key: 'facture', label: 'Facture / Devis', patterns: ['facture', 'devis'] },
  { key: 'carte_grise', label: 'Carte Grise', patterns: ['carte_grise'] },
  { key: 'assurance', label: 'Assurance', patterns: ['assurance', 'attestation'] },
  { key: 'controle_technique', label: 'Contrôle Technique', patterns: ['controle_technique', 'ct'] },
  { key: 'cession', label: 'Cession de créance', patterns: ['cession', 'documents_complets', 'signature'] },
  { key: 'photo_vehicule', label: 'Photo du véhicule', patterns: ['photo_vehicule', 'vehicule'] },
  { key: 'photo_impact', label: 'Photo de l\'impact', patterns: ['photo_impact', 'impact'] },
  { key: 'photo_avant', label: 'Photo avant pose', patterns: ['photo_avant', 'avant_pose'] },
  { key: 'photo_apres', label: 'Photo après pose', patterns: ['photo_apres', 'apres_pose'] },
];

const STATUTS = [
  { value: 'en_attente', label: 'En attente de vérification' },
  { value: 'signe', label: 'Dossier en attente' },
  { value: 'en_cours', label: 'Démarrer travaux' },
  { value: 'envoi_courrier', label: 'Envoi courrier' },
  { value: 'relance', label: 'Relance' },
  { value: 'reglement_en_cours', label: 'Règlement en cours' },
  { value: 'reglement_recu', label: 'Règlement reçu' },
  { value: 'action_requise', label: 'Action requise' },
  { value: 'termine', label: 'Terminé' },
  { value: 'recouvrement', label: 'Recouvrement' },
  { value: 'desistement', label: 'Désistement' },
];

export default function GestionnaireDetailDossier() {
  const params = useParams();
  const dossierId = params?.id;

  const [user, setUser] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invoiceLines, setInvoiceLines] = useState([]);

  const calculateTotalHT = () => invoiceLines.reduce((acc, line) => acc + (parseFloat(line.qte) || 0) * (parseFloat(line.prix) || 0), 0);
  const calculateTVA = () => calculateTotalHT() * 0.20;
  const calculateTotalTTC = () => calculateTotalHT() + calculateTVA();

  // Form state
  const [formData, setFormData] = useState({
    statut: 'en_attente',
    date_sinistre: '',
    franchise_montant: 0,
    num_sinistre: '',
    assurance_nom: '',
    assurance_telephone: '',
    assurance_email: '',
    commentaire: '',
    immatriculation: '',
    modele_vehicule: '',
    kilometrage: '',
    type_vitrage: '',
    type: '',
    num_contrat: '',
    client_nom: '',
    client_prenom: '',
    client_telephone: '',
    client_email: '',
    client_adresse: '',
    client_cp: '',
    client_ville: ''
  });

  // Chat states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUploading, setChatUploading] = useState(false);
  const messagesEndRef = useRef(null);

  // Relance & Actions rapides states
  const [relanceNotes, setRelanceNotes] = useState([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedQuickStatus, setSelectedQuickStatus] = useState('envoi_courrier');
  const [showMenuId, setShowMenuId] = useState(null);
  const [sendingClearBus, setSendingClearBus] = useState(false);

  useEffect(() => {
    fetchUser();
    if (dossierId) {
      fetchDossierAndDocs();
      fetchMessages();
    }
  }, [dossierId]);

  // S'abonner aux nouveaux messages en temps réel
  useEffect(() => {
    if (!dossierId) return;

    const subscription = supabase
      .channel(`messages-${dossierId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `dossier_id=eq.${dossierId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages(prev => {
            // Éviter les doublons (si le message existe déjà avec le même ID)
            if (prev.some(m => m.id === newMsg.id)) return prev;
            
            // Chercher le message optimiste (temporaire, qui a un id = Date.now() en millisecondes)
            // On vérifie le même texte et rôle dans les 5 dernières secondes
            const tempIndex = prev.findIndex(m => 
              typeof m.id === 'number' && 
              m.message === newMsg.message && 
              m.sender_role === newMsg.sender_role
            );
            
            if (tempIndex !== -1) {
              const next = [...prev];
              next[tempIndex] = newMsg; // Remplace le temporaire par le vrai
              return next;
            }
            
            return [...prev, newMsg];
          });
          scrollToBottom();
          
          // Si le message vient du garagiste et que le chat est fermé, incrémenter le compteur
          if (newMsg.sender_role === 'garagiste' && !chatOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [dossierId, chatOpen]);

  const fetchUser = async () => {
    const user = await getValidUser();
    setUser(user);
  };

  const fetchDossierAndDocs = async () => {
    try {
      const user = await getValidUser();
      if (!user) return;

      const isAdmin = user.user_metadata?.role === 'admin';
      let gestionnaireId = null;

      if (!isAdmin) {
        const gestionnaireData = await getGestionnaire(user);
        
        if (gestionnaireData) {
          gestionnaireId = gestionnaireData.id;
        } else {
          console.warn("Utilisateur authentifié mais non trouvé dans la table gestionnaires.");
        }
      }

      const { data, error } = await supabase
        .from('dossiers')
        .select('*, clients(*), garages(*), assurances(*)')
        .eq('id', dossierId)
        .single();

      if (error) throw error;

      if (!isAdmin && gestionnaireId && data.gestionnaire_id !== gestionnaireId) {
        setDossier(null);
        setError("Accès refusé. Ce dossier ne vous est pas affecté.");
        return;
      }

      setDossier(data);
      let parsedNotes = {};
      try {
        parsedNotes = JSON.parse(data.notes || '{}');
      } catch (e) {}

      const initialRelanceNotes = (parsedNotes.relance_notes || []).filter(note => !note.text?.includes('Le statut du dossier a été changé'));
      setRelanceNotes(initialRelanceNotes);

      if (parsedNotes.facture_lignes && Array.isArray(parsedNotes.facture_lignes)) {
        setInvoiceLines(parsedNotes.facture_lignes);
      } else {
        setInvoiceLines([]);
      }

      setFormData({
        statut: data.statut || 'en_attente',
        date_sinistre: data.date_sinistre || '',
        franchise_montant: data.franchise_montant || 0,
        num_sinistre: data.num_sinistre || '',
        assurance_nom: data.assurances?.nom || parsedNotes.assurance_nom || parsedNotes.assurance_nom_ocr || data.assurance_nom || '',
        assurance_telephone: data.assurance_telephone || parsedNotes.assurance_telephone || '',
        assurance_email: data.assurance_email || parsedNotes.assurance_email || '',
        commentaire: data.commentaire || '',
        immatriculation: data.immatriculation || '',
        modele_vehicule: data.modele_vehicule || '',
        kilometrage: data.kilometrage || '',
        type_vitrage: data.type_vitrage || '',
        type: data.type || '',
        num_contrat: data.num_contrat || '',
        client_nom: data.clients?.nom || '',
        client_prenom: data.clients?.prenom || '',
        client_telephone: data.clients?.telephone || '',
        client_email: data.clients?.email || '',
        client_adresse: data.clients?.adresse || '',
        client_cp: data.clients?.code_postal || '',
        client_ville: data.clients?.ville || ''
      });

      // Documents (via API to bypass RLS)
      const resDocs = await fetch(`/api/gestionnaire/documents?dossierId=${dossierId}`);
      let files = [];
      if (resDocs.ok) {
        const dataDocs = await resDocs.json();
        files = dataDocs.files || [];
      }

      if (files && files.length > 0) {
        const docsWithUrls = files
          .filter(f => f.name !== '.emptyFolderPlaceholder')
          .map(f => {
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(`dossiers/${dossierId}/${f.name}`);
            
            const fileName = f.name.toLowerCase();
            let label = "Document";
            const matchingSlot = DOCUMENT_SLOTS.find(slot => 
              slot.patterns.some(pattern => fileName.includes(pattern))
            );
            if (matchingSlot) {
              label = matchingSlot.label;
            }
            
            const isImage = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
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
      console.error(err);
      setError('Impossible de charger le dossier.');
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

      await fetchDossierAndDocs();
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

      await fetchDossierAndDocs();
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
        
        const path = `dossiers/${dossier.id}/${prefix}_${Date.now()}_${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, file);
          
        if (uploadError) throw uploadError;
      }
      
      await fetchDossierAndDocs();
      
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert("Une erreur est survenue lors de l'envoi des fichiers : " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(data || []);
      
      // Compter les messages non lus du garagiste
      const unread = data?.filter(m => m.sender_role === 'garagiste' && !m.is_read).length || 0;
      setUnreadCount(unread);
      
      // Marquer comme lus les messages du garagiste
      if (unread > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('dossier_id', dossierId)
          .eq('sender_role', 'garagiste');
      }
      
      scrollToBottom();
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage || !dossier) return;
    
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          dossier_id: dossier.id,
          garage_id: dossier.garage_id,
          sender_id: user?.id,
          sender_name: 'Gestionnaire',
          sender_role: 'gestionnaire',
          message: newMessage.trim(),
          is_read: false
        });

      if (error) throw error;
      
      const tempMessage = {
        id: Date.now(),
        dossier_id: dossier.id,
        sender_role: 'gestionnaire',
        sender_name: 'Gestionnaire',
        message: newMessage.trim(),
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      scrollToBottom();
      
    } catch (err) {
      console.error('Erreur envoi message:', err);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const sendQuickMessage = async (text) => {
    if (sendingMessage || !dossier) return;
    
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          dossier_id: dossier.id,
          garage_id: dossier.garage_id,
          sender_id: user?.id,
          sender_name: 'Gestionnaire',
          sender_role: 'gestionnaire',
          message: text,
          is_read: false
        });

      if (error) throw error;
      
      const tempMessage = {
        id: Date.now(),
        dossier_id: dossier.id,
        sender_role: 'gestionnaire',
        sender_name: 'Gestionnaire',
        message: text,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();
      
    } catch (err) {
      console.error('Erreur envoi message rapide:', err);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleChatFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !dossier) return;
    
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
          garage_id: dossier.garage_id,
          sender_id: user?.id,
          sender_name: 'Gestionnaire',
          sender_role: 'gestionnaire',
          message: messageContent,
          is_read: false
        });

      if (msgError) throw msgError;
      
      const tempMessage = {
        id: Date.now(),
        dossier_id: dossier.id,
        sender_role: 'gestionnaire',
        sender_name: 'Gestionnaire',
        message: messageContent,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();
    } catch (err) {
      console.error('Erreur téléversement fichier chat:', err);
      alert('Impossible d\'envoyer le fichier : ' + err.message);
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

  const handleOpenChat = async () => {
    setChatOpen(true);
    if (unreadCount > 0) {
      setUnreadCount(0);
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('dossier_id', dossierId)
        .eq('sender_role', 'garagiste');
    }
    scrollToBottom();
  };

  const handleSendEmailToAssurance = () => {
    if (!formData.assurance_email) {
      alert("Veuillez renseigner l'email de l'assurance avant d'envoyer.");
      return;
    }

    const clientNom = `${dossier?.clients?.prenom || ''} ${dossier?.clients?.nom || ''}`.trim() || '____________';
    const vitrage = dossier?.type_vitrage || 'Pare-brise';
    const vehicule = `${dossier?.modele_vehicule || ''}`.trim() || '____________';
    const immat = dossier?.immatriculation || '____________';
    const numContrat = dossier?.num_contrat || '_________________';
    const numSinistre = formData.num_sinistre || '_________________';
    const garageNom = dossier?.garages?.nom_garage || '____________';

    const subject = encodeURIComponent(`Dossier Sinistre - ${clientNom} - ${immat}`);
    const body = encodeURIComponent(`Bonjour,

Je vous prie de trouver ci-joint les éléments demandés suite au remplacement du ${vitrage} effectué ce jour pour le sociétaire ${clientNom}, sur le véhicule ${vehicule}, immatriculé ${immat}.

Référence contrat : ${numContrat}
Référence sinistre : ${numSinistre}

- Cession de créance (ordre de réparation)
- Photos des réparations
- Bon de commande du vitrage
- Facture
- Kbis extrait de moins de 3 mois
- Rib

Dans l’attente du traitement, nous vous souhaitons bonne réception.

Cordialement,
GLASS PILOT GESTION
Gestionnaire administratif du garage ${garageNom}
07 56 99 35 83`);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(formData.assurance_email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    try {
      const newNote = {
        id: Date.now().toString(),
        text: newNoteContent.trim(),
        created_at: new Date().toISOString()
      };
      
      const updatedNotesList = [newNote, ...relanceNotes];
      const updatedNotesObj = {
        ...JSON.parse(dossier?.notes || '{}'),
        relance_notes: updatedNotesList
      };
      
      const { error } = await supabase
        .from('dossiers')
        .update({ notes: JSON.stringify(updatedNotesObj) })
        .eq('id', dossierId);
        
      if (error) throw error;
      
      setRelanceNotes(updatedNotesList);
      setNewNoteContent('');
      setDossier(prev => ({ ...prev, notes: JSON.stringify(updatedNotesObj) }));
      setSuccess('Note ajoutée avec succès.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur ajout note:', err);
      setError('Impossible d\'ajouter la note.');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette note ?')) return;
    try {
      const updatedNotesList = relanceNotes.filter(n => n.id !== noteId);
      const updatedNotesObj = {
        ...JSON.parse(dossier?.notes || '{}'),
        relance_notes: updatedNotesList
      };
      
      const { error } = await supabase
        .from('dossiers')
        .update({ notes: JSON.stringify(updatedNotesObj) })
        .eq('id', dossierId);
        
      if (error) throw error;
      
      setRelanceNotes(updatedNotesList);
      setDossier(prev => ({ ...prev, notes: JSON.stringify(updatedNotesObj) }));
      setSuccess('Note supprimée avec succès.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur suppression note:', err);
      setError('Impossible de supprimer la note.');
    }
  };

  const handleUpdateStatus = async (statusValue) => {
    try {
      const { error } = await supabase
        .from('dossiers')
        .update({ statut: statusValue })
        .eq('id', dossierId);
        
      if (error) throw error;
      
      setFormData(prev => ({ ...prev, statut: statusValue }));
      setDossier(prev => ({ ...prev, statut: statusValue }));
      setSuccess('Statut du dossier mis à jour.');
      setTimeout(() => setSuccess(''), 3000);
      
      // Auto-add system note!
      const friendlyLabel = STATUTS.find(s => s.value === statusValue)?.label || statusValue;
      
      // Enregistrer également dans le journal d'activité (tchat)
      await supabase.from('messages').insert({
        dossier_id: dossierId,
        garage_id: dossier.garage_id,
        sender_id: user.id,
        sender_name: 'Système',
        sender_role: 'system',
        message: `${user.user_metadata?.prenom || user.user_metadata?.first_name || 'Le gestionnaire'} a changé le statut du dossier en "${friendlyLabel}".`,
        is_read: false
      });
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      setError('Impossible de mettre à jour le statut.');
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
      
      const { data } = await supabase.from('dossiers').select('notes').eq('id', dossierId).single();
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
        .eq('id', dossierId);
        
      setRelanceNotes(updatedNotesList);
      setDossier(prev => ({ ...prev, notes: JSON.stringify(updatedNotesObj) }));
    } catch (err) {
      console.error('Erreur ajout note système:', err);
    }
  };

  const handleSendClearBus = async () => {
    if (!dossier) return;
    setSendingClearBus(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/gestionnaire/send-clearbus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dossierId: dossier.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue lors de l'envoi.");
      }

      setSuccess(result.message || 'Dossier envoyé avec succès.');
      if (result.notes) {
        setRelanceNotes(result.notes);
        const updatedNotesObj = {
          ...JSON.parse(dossier.notes || '{}'),
          relance_notes: result.notes
        };
        setDossier(prev => ({ ...prev, notes: JSON.stringify(updatedNotesObj) }));
      }
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Erreur envoi ClearBUS:', err);
      alert(err.message || "Impossible d'envoyer le dossier.");
    } finally {
      setSendingClearBus(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // 1. Récupérer les notes actuelles de la base pour ne pas écraser l'historique des relances
      const { data: latestData, error: fetchErr } = await supabase
        .from('dossiers')
        .select('notes')
        .eq('id', dossierId)
        .single();
        
      if (fetchErr) throw fetchErr;

      let currentNotesObj = {};
      try {
        currentNotesObj = JSON.parse(latestData?.notes || '{}');
      } catch (e) {}

      // 2. Fusionner le nom, téléphone et l'email de l'assurance tout en gardant relance_notes
      const updatedNotesObj = {
        ...currentNotesObj,
        assurance_nom: formData.assurance_nom,
        assurance_telephone: formData.assurance_telephone,
        assurance_email: formData.assurance_email
      };

      // 3. Préparer les données de mise à jour pour les colonnes physiques de dossiers
      const updateData = {
        statut: formData.statut,
        date_sinistre: formData.date_sinistre || null,
        franchise_montant: parseFloat(formData.franchise_montant) || 0,
        num_sinistre: formData.num_sinistre,
        commentaire: formData.commentaire,
        notes: JSON.stringify(updatedNotesObj),
        immatriculation: formData.immatriculation,
        modele_vehicule: formData.modele_vehicule,
        kilometrage: formData.kilometrage ? parseInt(formData.kilometrage) : null,
        type_vitrage: formData.type_vitrage,
        type: formData.type,
        num_contrat: formData.num_contrat
      };

      // 4. Mettre à jour dans Supabase
      const { error } = await supabase
        .from('dossiers')
        .update(updateData)
        .eq('id', dossierId);

      if (error) throw error;

      // 4b. Mettre à jour le client si nécessaire
      if (dossier.clients_id) {
        const clientUpdate = {
          nom: formData.client_nom,
          prenom: formData.client_prenom,
          telephone: formData.client_telephone,
          email: formData.client_email,
          adresse: formData.client_adresse,
          code_postal: formData.client_cp,
          ville: formData.client_ville
        };
        const { error: clientErr } = await supabase
          .from('clients')
          .update(clientUpdate)
          .eq('id', dossier.clients_id);
        if (clientErr) throw clientErr;
      }

      // 5. Mettre à jour l'état local
      setDossier(prev => ({ ...prev, statut: formData.statut, notes: JSON.stringify(updatedNotesObj) }));
      setSuccess('Modifications enregistrées avec succès.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erreur de sauvegarde:', err);
      setError(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[var(--blue)]" />
      </div>
    );
  }

  if (error && !dossier) {
    return (
      <div className="p-8 text-center mt-20">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-rose-500" />
        </div>
        <p className="text-rose-600 font-medium mb-4">{error}</p>
        <Link href="/gestionnaire/dossiers" className="text-[var(--blue)] hover:underline font-medium">
          Retour à la liste des dossiers
        </Link>
      </div>
    );
  }

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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/gestionnaire/dossiers" className="p-2 bg-[var(--white)] rounded-xl border border-white/10 text-slate-400 hover:text-[var(--blue)] hover:border-[#1454FF] transition-all shadow-md">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-[var(--ink)]">
                  Dossier {dossier?.numero}
                </h1>
                
                <div className="flex items-center gap-2">
                  {formData.type === 'prestige' ? (
                    <span className="px-2.5 py-1 text-[11px] font-black tracking-widest text-amber-900 bg-gradient-to-r from-amber-200 to-yellow-400 rounded-lg shadow-sm border border-yellow-500/30">
                      PRESTIGE
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-black tracking-widest text-slate-300 bg-slate-100 rounded-lg border border-white/10">
                      SIMPLE
                    </span>
                  )}
                  
                  <span className="px-2.5 py-1 text-xs font-bold text-[var(--blue)] bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-1.5 shadow-sm">
                    <Building2 size={12} />
                    {dossier?.garages?.nom_garage || 'Aucun garage assigné'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Calendar size={14} /> Créé le {new Date(dossier?.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenChat}
            className="relative flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--white)] text-slate-300 font-medium rounded-xl border border-white/10 hover:border-[#1454FF] hover:text-[var(--blue)] hover:bg-blue-50 transition-all shadow-md"
          >
            <MessageSquare size={16} />
            <span className="hidden sm:inline">Message Garagiste</span>
            {unreadCount > 0 && !chatOpen && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-[var(--ink)] text-xs font-bold rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--blue)] text-[var(--ink)] font-medium rounded-xl hover:bg-[var(--blue)] transition-all shadow-md shadow-blue-200 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">Enregistrer</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-700 px-5 py-4 rounded-xl border border-emerald-200 flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={20} className="text-emerald-500" /> 
          <span className="font-medium">{success}</span>
        </div>
      )}
      {error && dossier && (
        <div className="bg-rose-50 text-rose-700 px-5 py-4 rounded-xl border border-rose-200 flex items-center gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={20} className="text-rose-500" /> 
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Principale */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Formulaire */}
          <div className="bg-[#120052] text-white rounded-2xl shadow-md border-white/10 border-white/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 bg-transparent/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText size={16} className="text-[var(--blue)]" />
              </div>
              <h2 className="text-lg font-bold text-white">Informations clés</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Statut du dossier</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                  >
                    {STATUTS.map(s => <option key={s.value} value={s.value} className="bg-[#120052] text-white">{s.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Nom de l'assurance</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                    <input
                      type="text"
                      list="assurances-list-gestionnaire"
                      placeholder="Ex: AXA, ALLIANZ, MACIF..."
                      value={formData.assurance_nom || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const found = REFERENTIEL_ASSURANCES.find(a => a.nom.toLowerCase() === val.toLowerCase());
                        setFormData(prev => ({
                          ...prev,
                          assurance_nom: val,
                          assurance_telephone: prev.assurance_telephone || found?.telephone || prev.assurance_telephone,
                          assurance_email: prev.assurance_email || found?.email || prev.assurance_email,
                        }));
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                    <datalist id="assurances-list-gestionnaire">
                      {REFERENTIEL_ASSURANCES.map(a => <option key={a.id || a.nom} value={a.nom} />)}
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Date du sinistre</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                    <input
                      type="date"
                      value={formData.date_sinistre}
                      onChange={(e) => setFormData({...formData, date_sinistre: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">N° de sinistre</label>
                  <div className="relative">
                    <FileDigit className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                    <input
                      type="text"
                      placeholder="Ex: 3545081056"
                      value={formData.num_sinistre}
                      onChange={(e) => setFormData({...formData, num_sinistre: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Franchise (€)</label>
                  <div className="relative">
                    <ReceiptEuro className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.franchise_montant}
                      onChange={(e) => setFormData({...formData, franchise_montant: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Téléphone assurance</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                    <input
                      type="tel"
                      placeholder="Ex: 09 70 80 82 82"
                      value={formData.assurance_telephone}
                      onChange={(e) => setFormData({...formData, assurance_telephone: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email assurance</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                    <input
                      type="email"
                      placeholder="Ex: contact@assurance.fr"
                      value={formData.assurance_email}
                      onChange={(e) => setFormData({...formData, assurance_email: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">N° de contrat</label>
                  <div className="relative">
                    <FileDigit className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                    <input
                      type="text"
                      placeholder="Numéro de contrat"
                      value={formData.num_contrat}
                      onChange={(e) => setFormData({...formData, num_contrat: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="col-span-1 sm:col-span-2 flex justify-end">
                  <button
                    onClick={handleSendEmailToAssurance}
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-xl text-sm transition-colors border border-indigo-100 shadow-md"
                  >
                    <Send size={16} />
                    Rédiger l'email d'envoi à l'assurance
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARTE CLIENT */}
          <div className="bg-[#120052] text-white rounded-2xl shadow-md border-white/10 border-white/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 bg-transparent/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <User size={16} className="text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-white">Coordonnées Client</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Prénom</label>
                    <input
                      type="text"
                      value={formData.client_prenom}
                      onChange={(e) => setFormData({...formData, client_prenom: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Nom</label>
                    <input
                      type="text"
                      value={formData.client_nom}
                      onChange={(e) => setFormData({...formData, client_nom: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.client_telephone}
                      onChange={(e) => setFormData({...formData, client_telephone: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Adresse (N° et Voie)</label>
                    <AddressAutocomplete
                      name="client_adresse"
                      value={formData.client_adresse}
                      onChange={(e) => setFormData({...formData, client_adresse: e.target.value})}
                      onSelect={(sugg) => {
                        setFormData({
                          ...formData,
                          client_adresse: sugg.nom_rue,
                          client_cp: sugg.code_postal,
                          client_ville: sugg.ville
                        });
                      }}
                      className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Code postal</label>
                    <input
                      type="text"
                      value={formData.client_cp}
                      onChange={(e) => setFormData({...formData, client_cp: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Ville</label>
                    <input
                      type="text"
                      value={formData.client_ville}
                      onChange={(e) => setFormData({...formData, client_ville: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
              </div>
            </div>
          </div>

          {/* CARTE VEHICULE ET JETON */}
          <div className="bg-[#120052] text-white rounded-2xl shadow-md border-white/10 border-white/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 bg-transparent/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <Car size={16} className="text-teal-600" />
              </div>
              <h2 className="text-lg font-bold text-white">Véhicule et Jeton</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Type de jeton utilisé</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm font-medium text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    >
                      <option value="simple">Simple</option>
                      <option value="prestige">Prestige</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Immatriculation</label>
                    <input
                      type="text"
                      value={formData.immatriculation}
                      onChange={(e) => setFormData({...formData, immatriculation: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Modèle du véhicule</label>
                    <input
                      type="text"
                      value={formData.modele_vehicule}
                      onChange={(e) => setFormData({...formData, modele_vehicule: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Kilométrage</label>
                    <input
                      type="number"
                      value={formData.kilometrage}
                      onChange={(e) => setFormData({...formData, kilometrage: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Type de vitrage</label>
                    <input
                      type="text"
                      value={formData.type_vitrage}
                      onChange={(e) => setFormData({...formData, type_vitrage: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-md outline-none transition-all"
                    />
                  </div>
              </div>
            </div>
          </div>
          {/* CARTE NOTE */}
          <div className="bg-[#120052] text-white rounded-2xl shadow-md border-white/10 border-white/10 overflow-hidden">
            <div className="px-6 py-5 border-b border-white/10 bg-transparent/50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <FileText size={16} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-white">Note & Commentaire interne</h2>
            </div>
            <div className="p-6">
              <textarea
                rows={4}
                placeholder="Ajouter une note ou une remarque sur ce dossier..."
                value={formData.commentaire}
                onChange={(e) => setFormData({...formData, commentaire: e.target.value})}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-sm text-slate-300 focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] shadow-inner outline-none transition-all resize-y"
              />
            </div>
          </div>
          {/* Documents / Photos */}
            <div className="bg-[#120052] rounded-2xl shadow-md border border-slate-200 overflow-hidden text-white">
            <div className="px-6 py-5 border-b border-slate-100 bg-transparent/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ImageIcon size={16} className="text-[var(--blue)]" />
                </div>
                <h2 className="text-lg font-bold text-white">Pièces jointes</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold hidden sm:inline-block">
                  {documents.length} fichier{documents.length !== 1 ? 's' : ''}
                </span>

                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--blue)] hover:bg-[var(--blue)] text-[var(--ink)] rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-blue-200">
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
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-xs text-[var(--blue)] font-semibold animate-pulse">
                <Loader2 size={14} className="animate-spin" />
                Téléchargement en cours...
              </div>
            )}

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Documents requis</h3>
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
                                  <span className="text-[10px] text-slate-500 mt-1 font-semibold">PDF</span>
                                </div>
                              )}
                              
                              
                            </div>
                            <div className="p-3 bg-white/10 border-t border-white/20">
                              <p className="text-xs font-bold text-white truncate">{slot.label}</p>
                              <p className="text-[10px] text-slate-300 mt-0.5 mb-2 truncate">{doc.name}</p>
                              <div className="flex items-center justify-between gap-1 pt-2 border-t border-white/10">
                                {doc.isImage && (
                                  <button onClick={(e) => { e.stopPropagation(); setSelectedImage(doc.url); }} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Visualiser">
                                    <Eye size={14} />
                                  </button>
                                )}
                                <a href={doc.url} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Télécharger">
                                  <Download size={14} />
                                </a>
                                <label className="p-1.5 text-blue-300 hover:text-blue-100 hover:bg-blue-500/20 rounded transition-colors cursor-pointer" title="Modifier" onClick={(e) => e.stopPropagation()}>
                                  <Pencil size={14} />
                                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleUploadSlotFile(e, slot.key)} disabled={uploading} />
                                </label>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(doc.name); }} className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded transition-colors" title="Supprimer">
                                  <Trash2 size={14} />
                                </button>
                              </div>
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
                <div className="pt-4 border-t border-white/20">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Autres documents</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {otherDocs.map((doc, idx) => (
                      <div 
                        key={idx} 
                        className="group relative rounded-xl bg-white/5 border border-white/20 overflow-hidden hover:border-[#1454FF] hover:shadow-lg transition-all cursor-pointer"
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
                          
                          
                        </div>
                        <div className="p-3 bg-white/10 border-t border-white/20">
                          <p className="text-[10px] font-medium text-white truncate mb-2">{doc.label}</p>
                          <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10">
                            {doc.isImage && (
                              <button onClick={(e) => { e.stopPropagation(); setSelectedImage(doc.url); }} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Visualiser">
                                <Eye size={14} />
                              </button>
                            )}
                            <a href={doc.url} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Télécharger">
                              <Download size={14} />
                            </a>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(doc.name); }} className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded transition-colors" title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne Latérale (Contexte) */}
        <div className="space-y-6">
          
          {/* Widget 1: RELANCE & INFORMATION */}
          <div className="bg-[#120052] rounded-2xl shadow-md border border-[#120052] p-6 text-white overflow-hidden relative space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
              RELANCE & INFORMATION
            </h3>
            
            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder="Contenu..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 text-white border-white/20 rounded-xl text-sm placeholder-slate-400 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 shadow-inner outline-none transition-all resize-none"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNoteContent.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#f39c12] hover:bg-[#e67e22] text-[var(--ink)] font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-sm"
              >
                <span className="text-base leading-none">+</span> Ajouter la note
              </button>
            </div>

            {/* Note feed */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              {relanceNotes.length === 0 ? (
                <div className="text-center py-6 bg-[var(--white)] rounded-xl border border-white/10">
                  <p className="text-[var(--muted)] text-xs font-medium">Aucune note de relance pour le moment.</p>
                </div>
              ) : (
                relanceNotes.map((note) => {
                  const formattedDate = (() => {
                    try {
                      const d = new Date(note.created_at);
                      const pad = (n) => n.toString().padStart(2, '0');
                      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                    } catch (e) {
                      return '';
                    }
                  })();
                  
                  return (
                    <div
                      key={note.id}
                      className={clsx(
                        "p-4 rounded-2xl relative shadow-md text-[var(--ink)] text-sm border transition-all",
                        note.isSystem
                          ? "bg-sky-50 border-sky-100 text-sky-950 font-semibold"
                          : "bg-[var(--white)]   border-[var(--stone)]"
                      )}
                    >
                      {/* Three dot actions */}
                      {!note.isSystem && (
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={() => setShowMenuId(showMenuId === note.id ? null : note.id)}
                            className="p-1 text-[var(--muted)] hover:text-slate-600 rounded-lg hover:bg-transparent transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {showMenuId === note.id && (
                            <div className="absolute right-0 top-7 z-20 bg-[var(--white)] border border-white/10 rounded-xl shadow-lg py-1 text-xs min-w-[100px] animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() => {
                                  handleDeleteNote(note.id);
                                  setShowMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <Trash2 size={12} />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="pr-6 leading-relaxed whitespace-pre-wrap">
                        {note.text}
                      </div>
                      
                      <div className="text-right text-[10px] text-slate-300 font-semibold mt-3">
                        {formattedDate}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Widget 2: Actions rapides */}
          <div className="bg-[#120052] rounded-2xl shadow-md border border-[#120052] p-6 text-white overflow-hidden space-y-5">
            <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2">
              Actions rapides
            </h3>
            
            <div className="space-y-4">
              {/* Cession de créance button */}
              <button
                onClick={() => {
                  if (dossier?.signature_url) {
                    window.open(dossier.signature_url, '_blank');
                  } else {
                    window.open(`/dashboard/dossiers/${dossier.id}/cession`, '_blank');
                  }
                }}
                className="w-full py-3 px-4 border border-[#00bcd4] hover:bg-[#00bcd4]/10 text-[#00bcd4] font-bold rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm active:scale-98"
              >
                <FileSignature size={16} />
                Cession de créance
              </button>

              {/* Régénérer Cession de créance button */}
              {dossier?.statut !== 'nouveau' && dossier?.signature_url && (
                <button
                  onClick={handleRegenerateCession}
                  disabled={isRegenerating || !formData.assurances_id || !formData.num_contrat}
                  title={(!formData.assurances_id || !formData.num_contrat) ? "Remplissez l'assurance et le numéro de contrat pour régénérer" : ""}
                  className={`w-full py-3 px-4 border border-[#1454FF] hover:bg-[#1454FF]/10 text-[#1454FF] font-bold rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm ${(isRegenerating || !formData.assurances_id || !formData.num_contrat) ? 'opacity-50 cursor-not-allowed' : 'active:scale-98'}`}
                >
                  {isRegenerating ? <Loader2 className="animate-spin" size={16} /> : <FileSignature size={16} />}
                  Régénérer Cession
                </button>
              )}


              {/* Archiver le dossier (uniquement si Règlement reçu) */}
              {dossier?.statut === 'reglement_recu' && (
                <button
                  onClick={() => handleUpdateStatus('termine')}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-[var(--ink)] font-bold rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm shadow-md active:scale-98"
                >
                  <CheckCircle size={16} />
                  Archiver le dossier
                </button>
              )}

              {/* Status dropdown select row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedQuickStatus}
                    onChange={(e) => setSelectedQuickStatus(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white/10 text-white border-white/20 rounded-xl text-sm font-bold appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00bcd4]/30"
                  >
                    <option value="relance">Relance</option>
                    <option value="reglement_en_cours">Règlement en cours</option>
                    <option value="reglement_recu">Règlement reçu</option>
                    <option value="envoi_courrier">Envoi courrier</option>
                    <option value="recouvrement">Recouvrement</option>
                    <option value="desistement">Désistement</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[var(--muted)]">
                    <ChevronRight className="rotate-90" size={16} />
                  </div>
                </div>
                
                <button
                  onClick={() => handleUpdateStatus(selectedQuickStatus)}
                  title="Confirmer le changement de statut"
                  className="w-12 h-12 bg-[#120052] hover:bg-[#2c617a] border border-white/20 text-[var(--ink)] rounded-xl flex items-center justify-center transition-colors shadow-md shrink-0 active:scale-95"
                >
                  <CheckCircle size={20} className="text-teal-400" />
                </button>
              </div>

              {/* ClearBUS button */}
              <button
                onClick={handleSendClearBus}
                disabled={sendingClearBus}
                className="w-full py-3 px-4 border border-[#22C55E] hover:bg-[#22C55E]/10 text-[#22C55E] font-extrabold rounded-xl transition-all flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 active:scale-98"
              >
                {sendingClearBus ? (
                  <Loader2 size={16} className="animate-spin text-[#22C55E]" />
                ) : (
                  <Check size={16} />
                )}
                Envoyer via ClearBUS
              </button>
            </div>
          </div>

        </div>
        
      </div>

      {/* Modal image */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--white)]/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
             onClick={() => setSelectedImage(null)}>
          <button 
            className="absolute top-6 right-6 text-[var(--muted)] hover:text-[var(--ink)] transition-colors bg-[var(--white)] rounded-full p-2.5 hover:bg-[var(--white)]"
            onClick={() => setSelectedImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={selectedImage} 
            alt="Prévisualisation" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* Chat Window */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] bg-[#120052] text-white rounded-2xl shadow-2xl shadow-blue-900/10 border-white/10 border-white/10 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300">
          {/* Chat Header */}
          <div 
            className="bg-gradient-to-r from-[#1454FF] to-blue-600 px-5 py-4 flex items-center justify-between shadow-md cursor-pointer group"
            onClick={() => setChatOpen(false)}
            title="Cliquez pour fermer la discussion"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--white)] rounded-xl flex items-center justify-center border border-white/10">
                <Building2 size={18} className="text-[var(--ink)]" />
              </div>
              <div>
                <p className="text-[var(--ink)] font-bold text-sm leading-tight group-hover:underline">{dossier?.garages?.nom_garage || 'Garagiste'}</p>
                <p className="text-blue-100 text-xs">Chat en direct</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setChatOpen(false); }}
              className="text-blue-100 hover:text-[var(--ink)] hover:bg-[var(--white)] p-1.5 rounded-lg transition-colors"
              title="Fermer la discussion"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-5 space-y-4 bg-transparent/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MessageSquare size={32} className="text-[var(--muted)] mb-3" />
                <p className="text-sm font-medium text-slate-400">Aucun message</p>
                <p className="text-xs text-[var(--muted)] mt-1">Échangez directement avec le garagiste ici.</p>
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
                const isMe = msg.sender_role === 'gestionnaire';
                return (
                  <div
                    key={idx}
                    className={clsx(
                      "flex flex-col max-w-[85%]",
                      isMe ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={clsx(
                      "px-4 py-2.5 rounded-2xl shadow-md text-sm",
                      isMe
                        ? "bg-[var(--blue)] text-[var(--ink)] rounded-br-sm animate-in fade-in slide-in-from-right-4 duration-200"
                        : "bg-[var(--white)]   border border-white/10 text-slate-800 rounded-bl-sm animate-in fade-in slide-in-from-left-4 duration-200"
                    )}>
                      {msg.message.startsWith('📎 Fichier :') ? (
                        (() => {
                          const parts = msg.message.replace('📎 Fichier : ', '').split(' | ');
                          const fileName = parts[0] || 'Fichier';
                          const fileUrl = parts[1] || '#';
                          const isImg = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
                          return (
                            <div className="flex flex-col gap-2 min-w-[200px]">
                              <div className="flex items-center gap-2">
                                <FileText size={18} className={isMe ? "text-blue-100 animate-pulse" : "text-[var(--blue)]"} />
                                <span className="font-semibold underline break-all text-xs sm:text-sm">{fileName}</span>
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
                    <span className="text-[10px] text-slate-300 font-medium mt-1.5 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
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

          {/* Messages suggérés */}
          <div className="flex gap-2 px-4 py-2.5 border-t border-white/10 bg-transparent/50 overflow-x-auto scrollbar-none shrink-0">
            {[
              { label: "D.T", text: "Démarrer travaux" },
              { label: "D.E", text: "Dossier envoyé" },
              { label: "Travaux ?", text: "Où en sont les travaux ?" },
              { label: "Règlement ?", text: "Avez-vous reçu le règlement ?" },
              { label: "Cession ?", text: "Merci de signer la cession de créance." }
            ].map((pill, idx) => (
              <button
                key={idx}
                onClick={() => sendQuickMessage(pill.text)}
                disabled={sendingMessage}
                className="px-3 py-1.5 bg-[#1F4E66] hover:bg-[#15384B] disabled:opacity-50 text-[var(--ink)] border border-white/20 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[var(--white)] border-t border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="chat-file-upload"
                className="hidden"
                onChange={handleChatFileUpload}
                disabled={chatUploading}
              />
              <label
                htmlFor="chat-file-upload"
                className={clsx(
                  "w-11 h-11 bg-transparent hover:bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0 border border-white/10 hover:border-slate-300 active:scale-95",
                  chatUploading && "opacity-50 pointer-events-none"
                )}
              >
                <Paperclip size={18} />
              </label>
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Écrivez un message..."
                disabled={chatUploading}
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1454FF]/20 focus:border-[#1454FF] transition-all disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage || chatUploading}
                className="w-11 h-11 bg-[var(--blue)] text-[var(--ink)] rounded-xl flex items-center justify-center hover:bg-[var(--blue)] disabled:opacity-50 disabled:hover:bg-[var(--blue)] transition-all shadow-md shrink-0 active:scale-95 cursor-pointer"
              >
                {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
