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
        { error: "L'identifiant du propriétaire du garage est requis" },
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

    // 1. Supprimer le garage associé de la table garages
    const { error: dbError } = await supabaseAdmin
      .from("garages")
      .delete()
      .eq("owner_id", userId);

    if (dbError) {
      console.error("Erreur suppression table garages:", dbError);
      return NextResponse.json(
        { error: "Impossible de supprimer le profil du garage de la base de données : " + dbError.message },
        { status: 500 }
      );
    }

    // 2. Supprimer l'utilisateur de l'authentification Supabase
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Erreur suppression auth:", authError);
      return NextResponse.json(
        { error: "Impossible de supprimer le compte d'authentification : " + authError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Garage et son propriétaire supprimés avec succès",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur serveur : " + error.message },
      { status: 500 }
    );
  }
}
