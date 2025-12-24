-- Enforce: if a conversation is archived, it must have a non-empty summary
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_archived_requires_summary;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_archived_requires_summary
CHECK (
  (is_archived = false)
  OR (summary IS NOT NULL AND length(btrim(summary)) >= 20)
);
