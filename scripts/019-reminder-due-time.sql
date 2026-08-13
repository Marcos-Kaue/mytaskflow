-- Hora opcional nos lembretes, junto da data.

ALTER TABLE reminders
  ADD COLUMN IF NOT EXISTS due_time time;

NOTIFY pgrst, 'reload schema';
