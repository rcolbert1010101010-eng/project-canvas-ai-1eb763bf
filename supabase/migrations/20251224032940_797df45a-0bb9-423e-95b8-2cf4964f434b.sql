-- Ensure message_count column exists (safe if already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations' 
    AND column_name = 'message_count'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN message_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Backfill existing data
UPDATE public.conversations c
SET message_count = COALESCE(m.cnt, 0)
FROM (
  SELECT conversation_id, COUNT(*)::int AS cnt
  FROM public.messages
  GROUP BY conversation_id
) m
WHERE c.id = m.conversation_id;

-- Ensure conversations with no messages are set to 0
UPDATE public.conversations
SET message_count = 0
WHERE message_count IS NULL OR id NOT IN (SELECT DISTINCT conversation_id FROM public.messages);

-- Create or replace trigger function for insert
CREATE OR REPLACE FUNCTION public.increment_conversation_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET message_count = message_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- Create or replace trigger function for delete
CREATE OR REPLACE FUNCTION public.decrement_conversation_message_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET message_count = GREATEST(message_count - 1, 0)
  WHERE id = OLD.conversation_id;
  RETURN OLD;
END;
$$;

-- Drop and recreate insert trigger
DROP TRIGGER IF EXISTS trg_increment_message_count ON public.messages;
CREATE TRIGGER trg_increment_message_count
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.increment_conversation_message_count();

-- Drop and recreate delete trigger
DROP TRIGGER IF EXISTS trg_decrement_message_count ON public.messages;
CREATE TRIGGER trg_decrement_message_count
AFTER DELETE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.decrement_conversation_message_count();