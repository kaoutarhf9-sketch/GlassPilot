import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import WelcomeManagerEmail from "@/emails/WelcomeManagerEmail";
import { render } from '@react-email/render';
import crypto from "crypto";

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
    const { email, prenom, nom } = payload;

    // Vérification champs
    if (!email || !prenom || !nom) {
      return NextResponse.json(
        { error: "Champs requis manquants (nom, prenom, email)" },
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
      // On s'assure qu'il y a au moins une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial
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

    // Création utilisateur
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          prenom,
          nom,
          role: "gestionnaire",
        },
      });

    if (userError) {
      // Si l'utilisateur existe déjà, on renvoie une erreur propre
      return NextResponse.json(
        { error: "Impossible de créer l'utilisateur : " + userError.message },
        { status: 400 }
      );
    }

    // Insertion table gestionnaires
    const { error: insertError } = await supabaseAdmin
      .from("gestionnaires")
      .insert({
        user_id: userData.user.id,
        email,
        nom,
        prenom,
        role: "gestionnaire",
        is_active: true,
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Erreur lors de l'enregistrement du profil : " + insertError.message },
        { status: 400 }
      );
    }

    // Envoi de l'email via Gmail SMTP
    let emailSent = false;
    let emailError = null;

    try {
      const htmlContent = await render(WelcomeManagerEmail({
        prenom,
        nom,
        email,
        password: generatedPassword
      }));

      await transporter.sendMail({
        from: `"GlassPilot" <${smtpUser}>`,
        to: email,
        subject: 'Vos accès gestionnaire pour GlassPilot',
        html: htmlContent,
      });
      emailSent = true;
    } catch (err) {
      console.error("Erreur d'envoi d'email avec Gmail SMTP:", err);
      emailError = err.message;
    }

    return NextResponse.json({
      success: true,
      message: "Gestionnaire créé avec succès",
      password: generatedPassword, // On renvoie le mot de passe pour l'afficher en UI (utile si l'email échoue)
      emailSent,
      emailError,
      user: {
        id: userData.user.id,
        email,
        prenom,
        nom,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur : " + error.message },
      { status: 500 }
    );
  }
}
