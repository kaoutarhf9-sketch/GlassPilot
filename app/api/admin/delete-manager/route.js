import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante" },
        { status: 500 }
      );
    }

    const payload = await req.json();
    const { userId } = payload;

    if (!userId) {
      return NextResponse.json(
        { error: "L'identifiant de l'utilisateur est requis" },
        { status: 400 }
      );
    }

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

    // D'abord, on supprime de la table gestionnaires (bien que ça puisse être géré par CASCADE)
    const { error: dbError } = await supabaseAdmin
      .from("gestionnaires")
      .delete()
      .eq("user_id", userId);

    if (dbError) {
      console.error("Erreur suppression table:", dbError);
      return NextResponse.json(
        { error: "Impossible de supprimer le profil de la base de données" },
        { status: 500 }
      );
    }

    // Ensuite, on supprime de l'authentification Supabase
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Erreur suppression auth:", authError);
      return NextResponse.json(
        { error: "Impossible de supprimer l'utilisateur du système d'authentification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gestionnaire supprimé avec succès",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur : " + error.message },
      { status: 500 }
    );
  }
}
