import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import ConfirmSignupEmail from "@/emails/ConfirmSignupEmail";
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
    const { email, password, prenom, nom_garage, responsable, telephone, adresse, siret } = payload;

    if (!email || !password || !prenom || !nom_garage || !responsable || !telephone || !adresse || !siret) {
      return NextResponse.json(
        { error: "Champs requis manquants." },
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

    // 4. Générer le lien de confirmation de type 'signup'
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://glass-pilot-894m.vercel.app";
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: cleanEmail,
      password: password,
      options: {
        data: {
          role: 'garagiste',
          prenom,
          nom_garage,
          responsable,
          telephone,
          adresse,
          siret: siret.replace(/\s+/g, ''),
          onboarding_completed: false,
        },
        redirectTo: `${origin}/connexion`,
      },
    });

    if (linkError) {
      console.error("Erreur generateLink Supabase (signup):", linkError);
      return NextResponse.json(
        { error: "Impossible de créer le compte : " + linkError.message },
        { status: 400 }
      );
    }

    const user = linkData?.user;
    if (!user) {
      return NextResponse.json(
        { error: "Impossible de créer le compte : utilisateur non généré." },
        { status: 500 }
      );
    }

    // 4.5. Créer l'espace garage et initialiser le stock de jetons
    const { data: garageData, error: garageError } = await supabaseAdmin
      .from('garages')
      .insert({
        owner_id: user.id,
        nom_garage: nom_garage,
        responsable: responsable,
        email_contact: cleanEmail,
        telephone: telephone,
        adresse: adresse,
        siret: siret.replace(/\s+/g, ''),
        is_active: true
      })
      .select()
      .maybeSingle();

    if (garageError) {
      console.error("Erreur de création de l'espace garage:", garageError);
      return NextResponse.json(
        { error: "Erreur de création de l'espace garage : " + garageError.message },
        { status: 500 }
      );
    }

    if (garageData) {
      const { error: stockError } = await supabaseAdmin
        .from('stock_jetons')
        .insert({
          garage_id: garageData.id,
          simple: 0,
          prestige: 1
        });

      if (stockError) {
        console.error("Erreur d'initialisation du stock de jetons:", stockError);
      }
    }

    let actionLink = linkData?.properties?.action_link || linkData?.action_link;
    if (!actionLink) {
      return NextResponse.json(
        { error: "Impossible de générer le lien de confirmation." },
        { status: 500 }
      );
    }
    
    // CORRECTION BUG VERCEL: Supabase génère parfois le lien avec le Site URL par défaut (localhost:3000)
    // On force l'utilisation du vrai domaine (origin) si on n'est pas en local
    const siteUrl = "https://glass-pilot-894m.vercel.app";
    if (origin && !origin.includes("localhost")) {
      actionLink = actionLink.replace("http://localhost:3000", siteUrl);
      actionLink = actionLink.replace("http://127.0.0.1:3000", siteUrl);
    }

    // 5. Envoyer l'email via Gmail SMTP avec Nodemailer
    let emailSent = false;
    let emailError = null;

    try {
      const htmlContent = await render(
        ConfirmSignupEmail({
          prenom,
          nom_garage,
          confirmLink: actionLink,
        })
      );

      await transporter.sendMail({
        from: `"GlassPilot" <${smtpUser}>`,
        to: cleanEmail,
        subject: "Confirmez votre inscription sur GlassPilot",
        html: htmlContent,
      });
      emailSent = true;
    } catch (err) {
      console.error("Erreur d'envoi d'e-mail via Gmail SMTP:", err);
      emailError = err.message;
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'e-mail de confirmation : " + err.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "L'e-mail de confirmation a été envoyé avec succès.",
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
