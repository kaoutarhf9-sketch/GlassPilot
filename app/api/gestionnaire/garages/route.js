import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    // Verify gestionnaire
    const { data: gestionnaireData } = await supabase
      .from('gestionnaires')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!gestionnaireData) {
      return NextResponse.json({ error: "Non autorisé (gestionnaire)" }, { status: 403 });
    }

    // Use admin client to get all garages and all users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: garages, error: garagesError } = await supabaseAdmin
      .from('garages')
      .select('*')
      .order('created_at', { ascending: false });

    if (garagesError) throw garagesError;

    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    const users = usersData.users || [];

    // Map garages with onboarding URLs
    const enrichedGarages = garages.map(garage => {
      const owner = users.find(u => u.id === garage.owner_id);
      return {
        ...garage,
        onboarding_kbis_url: owner?.user_metadata?.onboarding_kbis_url || null,
        onboarding_rib_url: owner?.user_metadata?.onboarding_rib_url || null,
      };
    });

    return NextResponse.json({ garages: enrichedGarages });

  } catch (error) {
    console.error("Erreur API garages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
