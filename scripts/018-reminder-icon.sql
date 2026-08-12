-- Emoji/ícone opcional nos lembretes.

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS icon text DEFAULT '📝';

UPDATE reminders
SET icon = '📝'
WHERE icon IS NULL OR icon = '';

NOTIFY pgrst, 'reload schema';
