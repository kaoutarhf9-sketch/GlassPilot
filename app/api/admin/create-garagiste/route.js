import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import WelcomeGarageEmail from "@/emails/WelcomeGarageEmail";
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
    // Vérification variables d'environnement
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante" },
        { status: 500 }
      );
    }

    // Lire body
    const payload = await req.json();
    const { email, prenom, nom_garage, responsable, telephone, adresse, siret } = payload;

    // Vérification champs
    if (!email || !prenom || !nom_garage || !responsable || !telephone || !adresse || !siret) {
      return NextResponse.json(
        { error: "Champs requis manquants (nom_garage, responsable, prenom, email, telephone, adresse, siret)" },
        { status: 400 }
      );
    }

    // Génération d'un mot de passe sécurisé : 12 caractères avec majuscules, minuscules, chiffres et symboles
    const generatePassword = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password + "A1!";
    };

    const generatedPassword = generatePassword();

    // Client admin Supabase
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

    // Création de l'utilisateur dans auth.users
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          role: "garagiste",
          prenom,
          nom_garage,
          responsable,
          telephone,
          adresse,
          siret: siret.replace(/\s+/g, ''),
          onboarding_completed: false,
        },
      });

    if (userError) {
      return NextResponse.json(
        { error: "Impossible de créer le compte d'authentification : " + userError.message },
        { status: 400 }
      );
    }

    // 4.5. Créer l'espace garage et initialiser le stock de jetons
    const { data: garageData, error: garageError } = await supabaseAdmin
      .from('garages')
      .insert({
        owner_id: userData.user.id,
        nom_garage: nom_garage,
        responsable: responsable,
        email_contact: email.trim().toLowerCase(),
        telephone: telephone,
        adresse: adresse,
        siret: siret.replace(/\s+/g, ''),
        is_active: true
      })
      .select()
      .maybeSingle();

    if (garageError) {
      console.error("Erreur de création de l'espace garage (admin):", garageError);
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
          prestige: 0
        });

      if (stockError) {
        console.error("Erreur d'initialisation du stock de jetons (admin):", stockError);
      }
    }

    // Envoi de l'email via Gmail SMTP
    let emailSent = false;
    let emailError = null;

    try {
      const htmlContent = await render(WelcomeGarageEmail({
        prenom,
        nom_garage,
        email,
        password: generatedPassword
      }));

      await transporter.sendMail({
        from: `"GlassPilot Pro" <${smtpUser}>`,
        to: email,
        subject: `Vos accès GlassPilot Pro pour votre garage ${nom_garage}`,
        html: htmlContent,
      });
      emailSent = true;
    } catch (err) {
      console.error("Erreur d'envoi d'email avec Gmail SMTP:", err);
      emailError = err.message;
    }

    return NextResponse.json({
      success: true,
      message: "Garagiste créé avec succès",
      password: generatedPassword,
      emailSent,
      emailError,
      user: {
        id: userData.user.id,
        email,
        prenom,
        nom_garage,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur : " + error.message },
      { status: 500 }
    );
  }
}
