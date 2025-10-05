-- Ajouter le champ invoice_status à la table sales
ALTER TABLE public.sales 
ADD COLUMN invoice_status TEXT DEFAULT 'brouillon';

-- Ajouter un commentaire pour expliquer les statuts possibles
COMMENT ON COLUMN public.sales.invoice_status IS 'Statut de la facture: brouillon (modifiable/supprimable), en_attente (non modifiable), paye (payé)';

-- Mettre à jour les factures existantes en "payé" par défaut
UPDATE public.sales 
SET invoice_status = 'paye' 
WHERE is_invoice = true;