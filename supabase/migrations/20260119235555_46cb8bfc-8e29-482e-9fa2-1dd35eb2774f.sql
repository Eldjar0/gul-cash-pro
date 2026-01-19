-- Delete credit note items first (foreign key constraint)
DELETE FROM credit_note_items WHERE credit_note_id = (SELECT id FROM credit_notes WHERE credit_note_number = 'NC-2026-0001');

-- Delete the credit note
DELETE FROM credit_notes WHERE credit_note_number = 'NC-2026-0001';