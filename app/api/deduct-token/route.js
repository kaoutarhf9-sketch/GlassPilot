import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialiser le client Admin avec le service role pour contourner les restrictions RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // Récupérer le token d'authentification de l'utilisateur
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Valider le token de l'utilisateur
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

    const { garageId, type } = await request.json();
    if (!garageId || !type) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    if (type !== 'simple' && type !== 'prestige') {
      return NextResponse.json({ error: 'Type de jeton invalide' }, { status: 400 });
    }

    // Vérifier que l'utilisateur est bien le propriétaire du garage
    const { data: garage, error: garageError } = await supabaseAdmin
      .from('garages')
      .select('id')
      .eq('id', garageId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (garageError || !garage) {
      return NextResponse.json({ error: 'Non autorisé pour ce garage' }, { status: 403 });
    }

    // Récupérer le stock actuel
    const { data: stockData, error: stockCheckError } = await supabaseAdmin
      .from('stock_jetons')
      .select('*')
      .eq('garage_id', garageId)
      .maybeSingle();

    if (stockCheckError) {
      return NextResponse.json({ error: 'Impossible de vérifier votre stock de jetons.' }, { status: 500 });
    }

    if (!stockData) {
      return NextResponse.json({ error: `Vous n'avez pas de jeton ${type === 'simple' ? 'Simple' : 'Prestige'} disponible.` }, { status: 400 });
    }

    const currentStock = stockData[type] || 0;
    if (currentStock < 1) {
      return NextResponse.json({ error: `Vous n'avez pas de jeton ${type === 'simple' ? 'Simple' : 'Prestige'} disponible.` }, { status: 400 });
    }

    // Déduire 1 jeton du stock de façon sécurisée (Admin)
    const { error: updateStockError } = await supabaseAdmin
      .from('stock_jetons')
      .update({
        [type]: currentStock - 1,
        updated_at: new Date().toISOString()
      })
      .eq('garage_id', garageId);

    if (updateStockError) {
      return NextResponse.json({ error: 'Erreur lors de la déduction du jeton.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Erreur déduction jeton:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
