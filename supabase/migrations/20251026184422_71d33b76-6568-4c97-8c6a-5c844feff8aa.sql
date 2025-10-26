-- Créer le bucket pour les images de produits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Politique pour permettre aux utilisateurs authentifiés de lire les images
CREATE POLICY "Tout le monde peut voir les images de produits"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Politique pour permettre aux utilisateurs authentifiés d'uploader des images
CREATE POLICY "Utilisateurs authentifiés peuvent uploader des images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

-- Politique pour permettre aux utilisateurs authentifiés de modifier leurs images
CREATE POLICY "Utilisateurs authentifiés peuvent modifier des images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);

-- Politique pour permettre aux utilisateurs authentifiés de supprimer des images
CREATE POLICY "Utilisateurs authentifiés peuvent supprimer des images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);