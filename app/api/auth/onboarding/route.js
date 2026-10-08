import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Client pour vérifier le token de l'utilisateur
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Session invalide ou expirée" }, { status: 401 });
    }

    const payload = await req.json();
    const { siret, iban, bic, kbisPath, ribPath, cniPath, logoPath } = payload;

    if (!siret || !iban || !bic || !kbisPath || !ribPath || !cniPath) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Client admin pour effectuer les modifications en contournant RLS
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

    const userId = user.id;

    // 1. Vérifier si le garage existe
    const { data: existingGarage, error: checkError } = await supabaseAdmin
      .from('garages')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error("Erreur verification garage:", checkError);
    }

    let garageId = existingGarage?.id;

    if (existingGarage) {
      // Mettre à jour le siret
      const { error: updateError } = await supabaseAdmin
        .from('garages')
        .update({ 
          siret: siret.replace(/\s+/g, ''),
          cni_url: cniPath,
          logo_url: logoPath || null
        })
        .eq('owner_id', userId);

      if (updateError) throw updateError;
    } else {
      // Créer le garage
      const { data: newGarage, error: insertError } = await supabaseAdmin
        .from('garages')
        .insert({
          owner_id: userId,
          nom_garage: user.user_metadata?.nom_garage || 'Mon Garage',
          responsable: user.user_metadata?.responsable || (user.user_metadata?.prenom || 'Responsable'),
          email_contact: user.email,
          telephone: user.user_metadata?.telephone || '',
          adresse: user.user_metadata?.adresse || '',
          siret: siret.replace(/\s+/g, ''),
          cni_url: cniPath,
          logo_url: logoPath || null,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;
      garageId = newGarage.id;

      // Créer le stock de jetons (1 prestige offert)
      const { error: stockError } = await supabaseAdmin
        .from('stock_jetons')
        .insert({
          garage_id: garageId,
          simple: 0,
          prestige: 1
        });

      if (stockError) {
        console.error("Erreur creation stock_jetons admin API:", stockError);
      }
    }

    // 2. Mettre à jour les métadonnées de l'utilisateur
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user.user_metadata,
        onboarding_completed: true,
        onboarding_siret: siret.replace(/\s+/g, ''),
        onboarding_rib_iban: iban.replace(/\s+/g, ''),
        onboarding_rib_bic: bic.trim().toUpperCase(),
        onboarding_kbis_url: kbisPath,
        onboarding_rib_url: ribPath,
        onboarding_cni_url: cniPath,
        onboarding_logo_url: logoPath || null,
        onboarding_completed_at: new Date().toISOString()
      }
    });

    if (authUpdateError) throw authUpdateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur dans l'API d'onboarding:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}
