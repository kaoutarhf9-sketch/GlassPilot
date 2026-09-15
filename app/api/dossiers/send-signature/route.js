import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

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
      return NextResponse.json({ error: 'Dossier introuvable.' }, { status: 404 });
    }

    const clientEmail = dossier.clients?.email;
    const clientNom = `${dossier.clients?.prenom || ''} ${dossier.clients?.nom || ''}`.trim() || 'Client';
    const garageNom = dossier.garages?.nom_garage || 'Votre garagiste';
    
    if (!clientEmail) {
      return NextResponse.json({ 
        error: "L'adresse email du client n'est pas renseignée dans ce dossier." 
      }, { status: 400 });
    }

    // 2. Générer le lien de signature
    const origin = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000';
    const signatureLink = `${origin}/dashboard/dossiers/${dossierId}/cession`;

    // 3. Corps de l'email premium
    const htmlBody = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        <div style="background-color: #18170F; padding: 32px 24px; text-align: center; border-bottom: 4px solid #1454FF;">
          <h2 style="margin: 0; font-size: 22px; font-weight: bold; color: #ffffff; letter-spacing: 0.03em;">SIGNATURE ÉLECTRONIQUE SECURE</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.05em;">Cession de créance · Sans avance de frais</p>
        </div>
        
        <div style="padding: 32px 24px; background-color: #ffffff;">
          <p style="font-size: 16px; margin-top: 0;">Bonjour <strong>${clientNom}</strong>,</p>
          
          <p style="font-size: 15px; color: #334155; leading: 24px;">
            Votre garagiste <strong>${garageNom}</strong> vous invite à procéder à la signature électronique de votre document de <strong>cession de créance</strong> pour le dossier de vitrage automobile <strong>N°${dossier.numero}</strong> (Véhicule immatriculé : <strong>${dossier.immatriculation || 'Non renseigné'}</strong>).
          </p>

          <div style="background-color: #F8FAFC; border-left: 4px solid #1454FF; border-radius: 8px; padding: 18px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b;">Pourquoi cette signature est nécessaire ?</p>
            <p style="margin: 6px 0 0 0; font-size: 13.5px; color: #64748b;">
              Elle permet à votre garage de gérer directement le remboursement avec votre assurance. Grâce à cela, <strong>vous n'avez aucun frais à avancer</strong> pour votre intervention vitrage.
            </p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${signatureLink}" target="_blank" style="background-color: #1454FF; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 10px rgba(20, 84, 255, 0.25); transition: background-color 0.2s;">
              ✍️ Signer ma cession de créance
            </a>
          </div>

          <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 24px;">
            Si le bouton ci-dessus ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :<br/>
            <a href="${signatureLink}" style="color: #1454FF; word-break: break-all;">${signatureLink}</a>
          </p>

          <p style="font-size: 14px; color: #334155; margin-bottom: 0;">
            En vous souhaitant bonne réception,<br/>
            L'équipe administrative de <strong>${garageNom}</strong>
          </p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;">Cet e-mail est sécurisé et a été généré automatiquement par la plateforme GlassPilot.</p>
        </div>
      </div>
    `;

    // 4. Envoyer l'email
    await transporter.sendMail({
      from: `"${garageNom} via GlassPilot" <${smtpUser}>`,
      to: clientEmail,
      subject: `✍️ Signature requise : Cession de créance pour votre véhicule ${dossier.immatriculation || ''}`,
      html: htmlBody,
    });

    // 5. Ajouter une note système dans le dossier
    const newNote = {
      id: Date.now().toString(),
      text: `📨 Lien de signature électronique de cession de créance envoyé au client (${clientEmail}).`,
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
      message: `Le lien de signature a été envoyé par email à ${clientEmail}.`,
      notes: updatedNotesList
    });

  } catch (error) {
    console.error('Erreur API envoi lien signature:', error);
    return NextResponse.json({ error: "Une erreur est survenue lors de l'envoi de l'email : " + error.message }, { status: 500 });
  }
}
