import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    // 1. Verify environment variables
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante sur le serveur." },
        { status: 500 }
      );
    }

    // 2. Authorize using user's access token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create connection to verify the user identity
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Session invalide ou expirée." }, { status: 401 });
    }

    // Verify admin role metadata
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: "Accès refusé. Rôle administrateur requis." }, { status: 403 });
    }

    // 3. Create service role client to bypass RLS
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

    // 4. Fetch counts in parallel
    const [
      { count: gestionnairesCount, error: managersError },
      { count: garagesCount, error: garagesError },
      { count: dossiersCount, error: dossiersError }
    ] = await Promise.all([
      supabaseAdmin.from('gestionnaires').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('garages').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('dossiers').select('*', { count: 'exact', head: true })
    ]);

    if (managersError) throw managersError;
    if (garagesError) throw garagesError;
    if (dossiersError) throw dossiersError;

    return NextResponse.json({
      success: true,
      gestionnairesCount: gestionnairesCount || 0,
      garagesCount: garagesCount || 0,
      dossiersCount: dossiersCount || 0
    });

  } catch (error) {
    console.error("Erreur API Admin stats:", error);
    return NextResponse.json(
      { error: "Erreur serveur : " + error.message },
      { status: 500 }
    );
  }
}
