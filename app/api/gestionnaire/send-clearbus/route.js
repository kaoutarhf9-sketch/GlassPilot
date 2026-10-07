import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Initialiser le client Admin Supabase pour contourner les RLS sur le stockage et la table dossiers
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const smtpUser = process.env.SMTP_USER || "wiamhanafi21@gmail.com";
const smtpPass = (process.env.SMTP_PASS || "pnceztbhkbnsayle").replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function POST(request) {
  try {
    const { dossierId } = await request.json();

    if (!dossierId) {
      return NextResponse.json({ error: 'Identifiant du dossier manquant.' }, { status: 400 });
    }

    // 1. Récupérer les détails du dossier, client, garage
    const { data: dossier, error: dossierError } = await supabaseAdmin
      .from('dossiers')
      .select('*, clients(*), garages(*)')
      .eq('id', dossierId)
      .single();

    if (dossierError || !dossier) {
      return NextResponse.json({ error: 'Impossible de trouver le dossier demandé.' }, { status: 404 });
    }

    // Extraction de l'email de l'assurance (depuis la colonne ou depuis les notes de replance)
    let parsedNotes = {};
    try {
      parsedNotes = JSON.parse(dossier.notes || '{}');
    } catch (e) {}

    const assuranceEmail = dossier.assurance_email || parsedNotes.assurance_email;
    const assuranceTel = dossier.assurance_telephone || parsedNotes.assurance_telephone || 'Non renseigné';

    if (!assuranceEmail) {
      return NextResponse.json({ 
        error: "Veuillez d'abord renseigner l'adresse email de l'assurance dans les informations clés du dossier." 
      }, { status: 400 });
    }

    const clientNom = `${dossier.clients?.prenom || ''} ${dossier.clients?.nom || ''}`.trim() || 'Sociétaire Inconnu';
    const garageNom = dossier.garages?.nom_garage || 'GLASS PILOT GESTION';
    const immat = dossier.immatriculation || 'Non renseignée';
    const numSinistre = dossier.num_sinistre || 'En attente';
    const typeVitrage = dossier.type_vitrage || 'Vitrage';

    // 2. Lister les documents du dossier dans Supabase Storage
    const { data: storageFiles, error: storageError } = await supabaseAdmin
      .storage
      .from('documents')
      .list(`dossiers/${dossierId}`);

    const attachments = [];

    if (storageFiles && storageFiles.length > 0) {
      // Filtrer les placeholders vides
      const filesToDownload = storageFiles.filter(f => f.name !== '.emptyFolderPlaceholder');

      for (const file of filesToDownload) {
        try {
          const { data: fileBlob, error: downloadError } = await supabaseAdmin
            .storage
            .from('documents')
            .download(`dossiers/${dossierId}/${file.name}`);

          if (downloadError) {
            console.error(`Erreur téléchargement fichier ${file.name}:`, downloadError);
            continue;
          }

          // Convertir le Blob en Buffer Node.js pour nodemailer
          const arrayBuffer = await fileBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          let friendlyLabel = file.name;
          const lowerName = file.name.toLowerCase();
          if (lowerName.includes('carte_grise')) friendlyLabel = `Carte_Grise_${immat.replace(/\s+/g, '_')}.pdf`;
          else if (lowerName.includes('attestation') || lowerName.includes('assurance')) friendlyLabel = `Attestation_Assurance_${immat.replace(/\s+/g, '_')}.pdf`;
          else if (lowerName.includes('bon_commande') || lowerName.includes('commande') || lowerName.includes('bdc')) friendlyLabel = `Bon_De_Commande_${immat.replace(/\s+/g, '_')}.pdf`;
          else if (lowerName.includes('photo_vehicule') || lowerName.includes('vehicule')) friendlyLabel = `Photo_Vehicule_${immat.replace(/\s+/g, '_')}.jpg`;
          else if (lowerName.includes('photo_impact') || lowerName.includes('impact')) friendlyLabel = `Photo_Impact_${immat.replace(/\s+/g, '_')}.jpg`;
          else if (lowerName.includes('cession')) friendlyLabel = `Contrat_Signe_Cession_${immat.replace(/\s+/g, '_')}.pdf`;

          attachments.push({
            content: buffer,
            filename: friendlyLabel
          });
        } catch (downloadErr) {
          console.error(`Exception téléchargement fichier ${file.name}:`, downloadErr);
        }
      }
    }

    // 3. Envoi de l'e-mail via Gmail SMTP
    let emailSent = false;
    let messageResult = '';

    const subject = `[Transmission Sécurisée ClearBUS] Dossier N°${dossier.numero} - Sociétaire ${clientNom} - Immatriculation ${immat}`;
    
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #1e293b; padding: 24px; color: #fff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.05em; color: #38bdf8;">TRANSMISSION SÉCURISÉE CLEARBUS</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Plateforme d'envoi administratif dématérialisé</p>
        </div>
        <div style="padding: 24px; background-color: #fff;">
          <p>Bonjour,</p>
          
          <p>Dans le cadre du protocole de <strong>Cession de Créance</strong> (loi Hamon), nous vous prions de trouver ci-joint les pièces justificatives relatives au remplacement de <strong>${typeVitrage}</strong> effectué ce jour pour le sociétaire désigné ci-dessous :</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Informations Sociétaire & Sinistre</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: bold; width: 40%;">Nom du Sociétaire :</td>
                <td style="padding: 4px 0; color: #0f172a; font-weight: 500;">${clientNom}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: bold;">Immatriculation :</td>
                <td style="padding: 4px 0; color: #0f172a; font-weight: 500; font-family: monospace; font-size: 14px;">${immat}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: bold;">Numéro de sinistre :</td>
                <td style="padding: 4px 0; color: #0f172a; font-weight: 500;">${numSinistre}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-weight: bold;">Type de vitrage :</td>
                <td style="padding: 4px 0; color: #0f172a; font-weight: 500;">${typeVitrage}</td>
              </tr>
            </table>
          </div>

          <p><strong>Documents joints à cet envoi sécurisé :</strong></p>
          <ul style="padding-left: 20px; font-size: 13px; color: #475569; margin: 10px 0;">
            <li>Contrat de Cession de Créance (ordre de réparation) signé électroniquement</li>
            <li>Photos du véhicule et des impacts</li>
            <li>Bon de commande et Facture acquittée</li>
            <li>Kbis du réparateur</li>
            <li>Relevé d'Identité Bancaire (RIB) pour règlement direct</li>
          </ul>

          <p style="margin-top: 24px;">Nous vous remercions de bien vouloir procéder à l'enregistrement et au règlement de cette facture sous un délai de 15 jours conformément à la réglementation.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-t: 1px solid #cbd5e1; font-size: 12px; color: #64748b;">
            <p style="margin: 0; font-weight: bold; color: #334155;">${garageNom}</p>
            <p style="margin: 2px 0;">Service Gestion Administrative</p>
            <p style="margin: 2px 0;">Téléphone Assistance : ${assuranceTel}</p>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 12px; text-align: center; font-size: 11px; color: #64748b; border-t: 1px solid #e2e8f0;">
          <p style="margin: 0;">Cet email a été envoyé de manière automatisée via l'intégration sécurisée ClearBUS.</p>
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"GlassPilot Transmission" <${smtpUser}>`,
        to: assuranceEmail,
        // Si le garage a un email, on le met en CC pour archivage
        cc: dossier.garages?.email || undefined,
        subject: subject,
        html: htmlBody,
        attachments: attachments
      });
      emailSent = true;
      messageResult = `Dossier envoyé avec succès à l'assurance (${assuranceEmail}) avec ${attachments.length} pièce(s) jointe(s).`;
    } catch (sendErr) {
      console.error("Erreur d'envoi d'email avec Gmail SMTP:", sendErr);
      emailSent = false;
      messageResult = `Erreur d'envoi SMTP : ${sendErr.message}.`;
      return NextResponse.json({
        success: false,
        emailSent: false,
        error: `Impossible d'envoyer l'email via Gmail : ${sendErr.message}`
      }, { status: 500 });
    }

    // 4. Ajouter une note système dans le dossier
    const newNote = {
      id: Date.now().toString(),
      text: `📨 Dossier envoyé à l'assurance (${assuranceEmail}) via ClearBUS avec ${attachments.length} document(s) joint(s).`,
      created_at: new Date().toISOString(),
      isSystem: true
    };

    const currentNotesObj = JSON.parse(dossier.notes || '{}');
    const currentRelanceNotes = currentNotesObj.relance_notes || [];
    const updatedNotesList = [newNote, ...currentRelanceNotes];
    
    const updatedNotesObj = {
      ...currentNotesObj,
      relance_notes: updatedNotesList
    };

    await supabaseAdmin
      .from('dossiers')
      .update({ notes: JSON.stringify(updatedNotesObj) })
      .eq('id', dossierId);

    return NextResponse.json({
      success: true,
      emailSent,
      message: messageResult,
      notes: updatedNotesList
    });

  } catch (error) {
    console.error('Erreur API ClearBUS:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de la transmission ClearBUS: ' + error.message }, { status: 500 });
  }
}
