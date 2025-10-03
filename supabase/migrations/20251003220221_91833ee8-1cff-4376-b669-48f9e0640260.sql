-- Suppression du compte jordanlallemand99@gmail.com
-- Note: Cette migration supprime un utilisateur spécifique et ses données associées

-- Supprimer le profil associé
DELETE FROM public.profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'jordanlallemand99@gmail.com'
);

-- Supprimer l'utilisateur de auth.users
-- Note: Cette opération ne peut pas être faite directement via SQL pour des raisons de sécurité
-- L'utilisateur devra être supprimé manuellement via le dashboard Supabase:
-- https://supabase.com/dashboard/project/htoihjbbwzpnyphcfomq/auth/users

-- Commentaire pour l'admin:
-- Veuillez supprimer manuellement l'utilisateur jordanlallemand99@gmail.com 
-- depuis le dashboard Supabase > Authentication > Users