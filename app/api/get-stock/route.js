import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialiser le client Admin avec le service role pour contourner les restrictions RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // Récupérer le token d'authentification de l'utilisateur depuis les headers
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Valider le token en initialisant un client Supabase temporaire
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: authHeader } }
      }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Session invalide ou expirée' }, { status: 401 });
    }

    // Récupérer le garage lié à cet utilisateur
    const { data: garage, error: garageError } = await supabaseAdmin
      .from('garages')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (garageError || !garage) {
      return NextResponse.json({ error: 'Garage non trouvé pour cet utilisateur' }, { status: 404 });
    }

    // Récupérer le stock de jetons via le client Admin (bypasse RLS)
    const { data: stockData, error: stockError } = await supabaseAdmin
      .from('stock_jetons')
      .select('*')
      .eq('garage_id', garage.id)
      .maybeSingle();

    if (stockError) {
      return NextResponse.json({ error: stockError.message }, { status: 500 });
    }

    return NextResponse.json({
      simple: stockData?.simple || 0,
      prestige: stockData?.prestige || 0
    });

  } catch (err) {
    console.error('Erreur API get-stock:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
