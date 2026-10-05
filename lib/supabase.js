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
    
    if (!session) return null;

    // Vérifier si le token est expiré ou sur le point d'expirer (dans les 60 secondes)
    const isExpired = session.expires_at ? (session.expires_at * 1000) < (Date.now() + 60000) : false;

    if (!isExpired && session.user) {
      return session.user;
    }

    // Le token est expiré, on force le rafraîchissement
    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    if (refreshedSession?.user) {
      return refreshedSession.user;
    }

    // En dernier recours, getUser() vérifiera côté serveur
    const { data: { user } } = await supabase.auth.getUser();
    return user || null;
  } catch (err) {
    console.error("Erreur récupération session utilisateur:", err);
    return null;
  }
}

export async function getValidSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;

    const isExpired = session.expires_at ? (session.expires_at * 1000) < (Date.now() + 60000) : false;

    if (!isExpired) {
      return session;
    }

    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
    if (refreshedSession) {
      return refreshedSession;
    }

    return null;
  } catch (err) {
    console.error("Erreur récupération session:", err);
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