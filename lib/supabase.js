import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Récupère l'utilisateur connecté en garantissant un token JWT valide et rafraîchi.
 * Évite la perte des dossiers lorsque l'utilisateur reste connecté longtemps.
 */
export async function getValidUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return session.user;
    }

    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    if (refreshedSession?.user) {
      return refreshedSession.user;
    }

    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch (err) {
    console.error("Erreur récupération session utilisateur:", err);
    return null;
  }
}

/**
 * Récupère les données du gestionnaire par user_id ou par email,
 * et associe automatiquement le user_id si besoin.
 */
export async function getGestionnaire(user) {
  if (!user) return null;
  
  try {
    // 1. Recherche directe par user_id
    let { data: manager } = await supabase
      .from('gestionnaires')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (manager) return manager;

    // 2. Fallback par email
    if (user.email) {
      let { data: managerByEmail } = await supabase
        .from('gestionnaires')
        .select('*')
        .ilike('email', user.email)
        .maybeSingle();

      if (managerByEmail) {
        // Mettre à jour user_id dans la table gestionnaires pour les requêtes futures
        await supabase
          .from('gestionnaires')
          .update({ user_id: user.id })
          .eq('id', managerByEmail.id);
          
        return { ...managerByEmail, user_id: user.id };
      }
    }
  } catch (err) {
    console.error("Erreur récupération gestionnaire:", err);
  }

  return null;
}