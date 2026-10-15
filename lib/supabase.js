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
 * Supprime physiquement toutes les clés de session Supabase du localStorage
 */
export function purgeSupabaseStorage() {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase.auth') || key.includes('-auth-token'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });
  } catch (_) {}
}

/**
 * Nettoie la session locale si le refresh token est corrompu ou révoqué.
 */
export async function clearStaleSession() {
  try {
    if (typeof window !== 'undefined') {
      purgeSupabaseStorage();
      await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  } catch (_) {}
}

/**
 * Récupère l'utilisateur connecté en garantissant un token JWT valide et rafraîchi.
 * Évite la perte des dossiers lorsque l'utilisateur reste connecté longtemps.
 */
export async function getValidUser() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      if (sessionError.message?.includes('Refresh Token') || sessionError.status === 400) {
        await clearStaleSession();
      }
      return null;
    }

    const session = sessionData?.session;
    if (!session) return null;

    // Vérifier si le token est expiré ou sur le point d'expirer (dans les 60 secondes)
    const isExpired = session.expires_at ? (session.expires_at * 1000) < (Date.now() + 60000) : false;

    if (!isExpired && session.user) {
      return session.user;
    }

    // Le token est expiré, on force le rafraîchissement
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      if (refreshError.message?.includes('Refresh Token') || refreshError.status === 400) {
        await clearStaleSession();
      }
      return null;
    }

    if (refreshData?.session?.user) {
      return refreshData.session.user;
    }

    // En dernier recours, getUser() vérifiera côté serveur
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      if (userError.message?.includes('Refresh Token') || userError.status === 400) {
        await clearStaleSession();
      }
      return null;
    }
    return userData?.user || null;
  } catch (err) {
    if (err?.message?.includes('Refresh Token') || err?.status === 400) {
      await clearStaleSession();
    } else {
      console.error("Erreur récupération session utilisateur:", err);
    }
    return null;
  }
}

export async function getValidSession() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      if (sessionError.message?.includes('Refresh Token') || sessionError.status === 400) {
        await clearStaleSession();
      }
      return null;
    }

    const session = sessionData?.session;
    if (!session) return null;

    const isExpired = session.expires_at ? (session.expires_at * 1000) < (Date.now() + 60000) : false;

    if (!isExpired) {
      return session;
    }

    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      if (refreshError.message?.includes('Refresh Token') || refreshError.status === 400) {
        await clearStaleSession();
      }
      return null;
    }

    if (refreshData?.session) {
      return refreshData.session;
    }

    return null;
  } catch (err) {
    if (err?.message?.includes('Refresh Token') || err?.status === 400) {
      await clearStaleSession();
    } else {
      console.error("Erreur récupération session:", err);
    }
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
