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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    // Verify gestionnaire
    let { data: gestionnaireData } = await supabase
      .from('gestionnaires')
      .select('id, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!gestionnaireData && user.email) {
      const { data: byEmail } = await supabase
        .from('gestionnaires')
        .select('id, user_id')
        .ilike('email', user.email)
        .maybeSingle();

      if (byEmail) {
        gestionnaireData = byEmail;
        if (!byEmail.user_id || byEmail.user_id !== user.id) {
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
          );
          await supabaseAdmin
            .from('gestionnaires')
            .update({ user_id: user.id })
            .eq('id', byEmail.id);
        }
      }
    }

    const isAdmin = user.user_metadata?.role === 'admin';

    if (!gestionnaireData && !isAdmin) {
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

    // Map garages with onboarding URLs & banking info
    const enrichedGarages = garages.map(garage => {
      const owner = users.find(u => u.id === garage.owner_id);
      const meta = owner?.user_metadata || {};

      const getDocUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        const { data: { publicUrl } } = supabaseAdmin.storage.from('documents').getPublicUrl(path);
        return publicUrl;
      };

      const kbisPath = meta.onboarding_kbis_url || garage.kbis_url || null;
      const ribPath = meta.onboarding_rib_url || garage.rib_url || null;
      const cniPath = meta.onboarding_cni_url || garage.cni_url || null;

      return {
        ...garage,
        siret: garage.siret || meta.onboarding_siret || null,
        iban: meta.onboarding_rib_iban || garage.iban || null,
        bic: meta.onboarding_rib_bic || garage.bic || null,
        kbis_url: getDocUrl(kbisPath),
        rib_url: getDocUrl(ribPath),
        cni_url: getDocUrl(cniPath),
        onboarding_kbis_url: getDocUrl(kbisPath),
        onboarding_rib_url: getDocUrl(ribPath),
        onboarding_cni_url: getDocUrl(cniPath),
      };
    });

    return NextResponse.json({ garages: enrichedGarages });

  } catch (error) {
    console.error("Erreur API garages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
