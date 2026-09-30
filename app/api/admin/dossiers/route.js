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

    // 4. Fetch all resources in parallel
    const [
      { data: managersData, error: managersError },
      { data: clientsData, error: clientsError },
      { data: garagesData, error: garagesError },
      { data: dossiersData, error: dossiersError }
    ] = await Promise.all([
      supabaseAdmin.from('gestionnaires').select('*').order('nom', { ascending: true }),
      supabaseAdmin.from('clients').select('id, nom, prenom, telephone'),
      supabaseAdmin.from('garages').select('id, nom_garage'),
      supabaseAdmin.from('dossiers').select('*').order('created_at', { ascending: false })
    ]);

    if (managersError) throw managersError;
    if (clientsError) throw clientsError;
    if (garagesError) throw garagesError;
    if (dossiersError) throw dossiersError;

    return NextResponse.json({
      success: true,
      managers: managersData || [],
      clients: clientsData || [],
      garages: garagesData || [],
      dossiers: dossiersData || []
    });

  } catch (error) {
    console.error("Erreur API Admin dossiers:", error);
    return NextResponse.json(
      { error: "Erreur serveur : " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
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

    // 3. Parse payload
    const { dossierId, gestionnaireId } = await req.json();
    if (!dossierId) {
      return NextResponse.json({ error: "dossierId est requis." }, { status: 400 });
    }

    // 4. Create service role client to bypass RLS
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

    // 5. Update the dossier
    const { error: updateError } = await supabaseAdmin
      .from('dossiers')
      .update({ 
        gestionnaire_id: gestionnaireId || null,
        date_traitement: gestionnaireId ? new Date().toISOString() : null 
      })
      .eq('id', dossierId);

    if (updateError) throw updateError;

    if (gestionnaireId) {
      const { data: dossier } = await supabaseAdmin.from('dossiers').select('numero').eq('id', dossierId).single();
      if (dossier) {
        await supabaseAdmin.from('notifications').insert([{
          gestionnaire_id: gestionnaireId,
          dossier_id: dossierId,
          type: 'assignation',
          title: 'Nouveau dossier assigné',
          message: `Le dossier ${dossier.numero} vous a été assigné.`,
          link: `/gestionnaire/dossiers/${dossierId}`
        }]);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Dossier attribué avec succès !"
    });

  } catch (error) {
    console.error("Erreur API Admin dossiers patch:", error);
    return NextResponse.json(
      { error: "Erreur serveur : " + error.message },
      { status: 500 }
    );
  }
}

