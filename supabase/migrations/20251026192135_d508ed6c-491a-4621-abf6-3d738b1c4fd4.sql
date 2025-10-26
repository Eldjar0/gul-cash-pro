-- Créer la table pour les configurations d'étiquettes
CREATE TABLE label_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  format JSONB NOT NULL,
  template JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE label_configurations ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs authentifiés peuvent gérer les configurations
CREATE POLICY "Authenticated users can manage label configs"
  ON label_configurations
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Index pour améliorer les performances
CREATE INDEX idx_label_configurations_created_at ON label_configurations(created_at DESC);