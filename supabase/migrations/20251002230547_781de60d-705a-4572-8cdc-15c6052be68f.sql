-- Rendre closing_amount nullable pour permettre l'ouverture de journée
ALTER TABLE daily_reports ALTER COLUMN closing_amount DROP NOT NULL;

-- Mettre à jour les politiques RLS pour daily_reports
DROP POLICY IF EXISTS "Allow authenticated read daily reports" ON daily_reports;
DROP POLICY IF EXISTS "Allow authenticated write daily reports" ON daily_reports;

-- Politique de lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to read daily reports"
ON daily_reports
FOR SELECT
TO authenticated
USING (true);

-- Politique d'insertion pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to insert daily reports"
ON daily_reports
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Politique de mise à jour pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to update daily reports"
ON daily_reports
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Politique de suppression pour tous les utilisateurs authentifiés
CREATE POLICY "Allow authenticated users to delete daily reports"
ON daily_reports
FOR DELETE
TO authenticated
USING (true);