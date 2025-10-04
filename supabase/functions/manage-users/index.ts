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
    // Verify user is authenticated
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Non autorisé - authentification requise');
    }

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

    // Get authenticated user and verify admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentification invalide');
    }

    // Check if user is admin
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roles) {
      throw new Error('Accès refusé - droits administrateur requis');
    }

    const { action, userId, email, password, fullName } = await req.json();
    console.log(`Action: ${action}`, { userId, email, adminUser: user.email });

    switch (action) {
      case 'list': {
        const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        console.log(`✅ ${users.users.length} utilisateurs récupérés`);
        return new Response(
          JSON.stringify({ success: true, users: users.users }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create': {
        if (!email || !password) {
          throw new Error('Email et mot de passe requis');
        }
        
        console.log(`👤 Création du compte: ${email}`);
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || 'Utilisateur'
          }
        });

        if (createError) throw createError;

        // Créer le profil (without role)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: newUser.user.id,
            full_name: fullName || 'Utilisateur'
          });

        if (profileError) {
          console.error('Erreur création profil:', profileError);
          throw profileError;
        }

        // Assign default cashier role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({
            user_id: newUser.user.id,
            role: 'cashier'
          });

        if (roleError) {
          console.error('Erreur assignation rôle:', roleError);
          throw roleError;
        }

        console.log(`✅ Compte créé: ${email}`);
        return new Response(
          JSON.stringify({ success: true, user: newUser.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!userId) {
          throw new Error('userId requis');
        }

        console.log(`✏️ Mise à jour du compte: ${userId}`);
        const updateData: any = {};
        
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (fullName) updateData.user_metadata = { full_name: fullName };

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          updateData
        );

        if (updateError) throw updateError;

        // Mettre à jour le profil
        if (fullName) {
          await supabaseAdmin
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', userId);
        }

        console.log(`✅ Compte mis à jour: ${userId}`);
        return new Response(
          JSON.stringify({ success: true, user: updatedUser.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!userId) {
          throw new Error('userId requis');
        }

        console.log(`🗑️ Suppression du compte: ${userId}`);
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (deleteError) throw deleteError;

        console.log(`✅ Compte supprimé: ${userId}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Action inconnue: ${action}`);
    }

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
