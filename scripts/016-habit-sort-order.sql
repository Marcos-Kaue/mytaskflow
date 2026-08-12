-- Ordem manual dos hábitos (arrastar na lista).

ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY created_at ASC, id ASC
    ) - 1)::integer AS next_order
  FROM habits
)
UPDATE habits h
SET sort_order = ranked.next_order
FROM ranked
WHERE h.id = ranked.id;

NOTIFY pgrst, 'reload schema';
