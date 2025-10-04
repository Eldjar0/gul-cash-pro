import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🗑️ Suppression de tous les utilisateurs...');
    
    // Récupérer tous les utilisateurs
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Erreur lors de la récupération des utilisateurs:', listError);
      throw listError;
    }

    console.log(`Trouvé ${users.users.length} utilisateur(s) à supprimer`);

    // Supprimer chaque utilisateur
    for (const user of users.users) {
      console.log(`Suppression de l'utilisateur: ${user.email}`);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`Erreur lors de la suppression de ${user.email}:`, deleteError);
      }
    }

    console.log('✅ Tous les utilisateurs ont été supprimés');

    // Créer le compte admin
    console.log('👤 Création du compte admin...');
    const { data: adminUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@system.local',
      password: '3679',
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrateur'
      }
    });

    if (createError) {
      console.error('Erreur lors de la création du compte admin:', createError);
      throw createError;
    }

    console.log('✅ Compte admin créé avec succès:', adminUser.user.email);

    // Créer le profil admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: adminUser.user.id,
        full_name: 'Administrateur',
        role: 'cashier'
      });

    if (profileError) {
      console.error('Erreur lors de la création du profil:', profileError);
    } else {
      console.log('✅ Profil admin créé');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Compte admin créé avec succès',
        email: 'admin@system.local'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erreur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
