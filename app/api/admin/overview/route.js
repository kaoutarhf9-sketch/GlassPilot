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

    // Rôle administrateur obligatoire
    if (user.user_metadata?.role !== "admin") {
      return NextResponse.json(
        { error: "Accès refusé. Rôle administrateur requis." },
        { status: 403 }
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

    // 4. Données nécessaires aux graphiques et aux notifications
    const [
      { data: garagesData, error: garagesError },
      { data: dossiersData, error: dossiersError },
      { data: managersData, error: managersError },
    ] = await Promise.all([
      supabaseAdmin
        .from("garages")
        .select("id, nom_garage, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("dossiers")
        .select("id, numero, statut, created_at, gestionnaire_id, garage_id")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("gestionnaires").select("id"),
    ]);

    if (garagesError) throw garagesError;
    if (dossiersError) throw dossiersError;
    if (managersError) throw managersError;

    return NextResponse.json({
      success: true,
      garages: garagesData || [],
      dossiers: dossiersData || [],
      gestionnairesCount: (managersData || []).length,
    });
  } catch (error) {
    console.error("Erreur API Admin overview:", error);
    return NextResponse.json(
      { error: "Erreur serveur : " + error.message },
      { status: 500 }
    );
  }
}