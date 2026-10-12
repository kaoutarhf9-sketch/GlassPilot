import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    // 1. Variables d'environnement
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante sur le serveur." },
        { status: 500 }
      );
    }

    // 2. Autorisation via le jeton de l'utilisateur
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Session invalide ou expirée." },
        { status: 401 }
      );
    }

    // 3. Client service role (contourne la RLS)
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

    // 4. Seuls les administrateurs et les gestionnaires peuvent lire le stock
    const isAdmin = user.user_metadata?.role === "admin";

    if (!isAdmin) {
      const { data: gestionnaire, error: gError } = await supabaseAdmin
        .from("gestionnaires")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (gError) throw gError;

      if (!gestionnaire) {
        return NextResponse.json(
          { error: "Accès refusé. Rôle gestionnaire requis." },
          { status: 403 }
        );
      }
    }

    // 5. Stock de jetons de tous les garages
    const { data: stockData, error: stockError } = await supabaseAdmin
      .from("stock_jetons")
      .select("garage_id, simple, prestige, updated_at");

    if (stockError) throw stockError;

    return NextResponse.json({
      success: true,
      stock: stockData || [],
    });
  } catch (error) {
    console.error("Erreur API Gestionnaire jetons:", error);
    return NextResponse.json(
      { error: "Erreur serveur : " + error.message },
      { status: 500 }
    );
  }
}