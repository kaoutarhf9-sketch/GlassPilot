import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    // Vérification variables d'environnement
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuration Supabase manquante",
        },
        { status: 500 }
      );
    }

    // Lire body
    const payload = await req.json();

    const { email, prenom, nom } = payload;

    // Vérification champs
    if (!email || !prenom || !nom) {
      return NextResponse.json(
        {
          success: false,
          error: "Champs requis manquants",
        },
        { status: 400 }
      );
    }

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
        password: "Gestionnaire123!",
        email_confirm: true,
        user_metadata: {
          prenom,
          nom,
          role: "gestionnaire",
        },
      });

    if (userError) {
      return NextResponse.json(
        {
          success: false,
          error: userError.message,
        },
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
        {
          success: false,
          error: insertError.message,
          partial: true,
          userId: userData.user.id,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gestionnaire créé avec succès",
      user: {
        id: userData.user.id,
        email,
        prenom,
        nom,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}