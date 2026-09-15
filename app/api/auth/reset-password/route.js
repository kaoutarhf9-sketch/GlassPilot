import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";
import { render } from '@react-email/render';

export const runtime = "nodejs";

const smtpUser = process.env.SMTP_USER || "wiamhanafi21@gmail.com";
const smtpPass = (process.env.SMTP_PASS || "pnceztbhkbnsayle").replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function POST(req) {
  try {
    // 1. Vérification des variables d'environnement
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante sur le serveur." },
        { status: 500 }
      );
    }

    // 2. Récupérer le corps de la requête
    const payload = await req.json();
    const { email } = payload;

    if (!email) {
      return NextResponse.json(
        { error: "L'adresse e-mail est obligatoire." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 3. Initialiser le client admin de Supabase
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 4. Générer le lien de récupération
    // Supabase va s'assurer que l'utilisateur existe dans auth.users
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo: `${origin}/reinitialiser-mot-de-passe`,
      },
    });

    if (linkError) {
      console.error("Erreur generateLink Supabase:", linkError);
      // Pour éviter de divulguer si un utilisateur existe ou non, on peut renvoyer un faux succès ou une erreur propre.
      // Dans le cas d'une application professionnelle interne fermée, renvoyer une erreur explicite est plus ergonomique.
      return NextResponse.json(
        { error: "Aucun compte n'est associé à cette adresse e-mail." },
        { status: 404 }
      );
    }

    const actionLink = linkData?.properties?.action_link || linkData?.action_link;
    if (!actionLink) {
      return NextResponse.json(
        { error: "Impossible de générer le lien de réinitialisation." },
        { status: 500 }
      );
    }

    // 5. Récupérer le prénom de l'utilisateur (depuis metadata ou fallback)
    const userPrenom = linkData?.user?.user_metadata?.prenom || "Partenaire";

    // 6. Rendre le modèle HTML et envoyer l'e-mail via Nodemailer (Gmail)
    let emailSent = false;
    let emailError = null;

    try {
      const htmlContent = await render(
        ResetPasswordEmail({
          prenom: userPrenom,
          resetLink: actionLink,
        })
      );

      await transporter.sendMail({
        from: `"GlassPilot" <${smtpUser}>`,
        to: cleanEmail,
        subject: "Réinitialisation de votre mot de passe GlassPilot",
        html: htmlContent,
      });
      emailSent = true;
    } catch (err) {
      console.error("Erreur d'envoi d'e-mail via Gmail SMTP:", err);
      emailError = err.message;
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'e-mail de réinitialisation : " + err.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "L'e-mail de récupération a été envoyé avec succès.",
      emailSent,
    });
  } catch (error) {
    console.error("Erreur interne du serveur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur : " + error.message },
      { status: 500 }
    );
  }
}
