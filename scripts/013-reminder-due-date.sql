-- Data nos lembretes para avisar quando o prazo estiver perto.

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS due_at date;

NOTIFY pgrst, 'reload schema';
