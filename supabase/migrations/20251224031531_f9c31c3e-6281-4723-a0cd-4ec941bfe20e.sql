-- Add message_count column to conversations
ALTER TABLE public.conversations 
ADD COLUMN message_count integer NOT NULL DEFAULT 0;

-- Backfill existing data
UPDATE public.conversations c
SET message_count = COALESCE(m.cnt, 0)
FROM (
  SELECT conversation_id, COUNT(*)::int AS cnt
  FROM public.messages
  GROUP BY conversation_id
) m
WHERE c.id = m.conversation_id;

-- Create trigger function for insert
CREATE OR REPLACE FUNCTION public.increment_conversation_message_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations
  SET message_count = message_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for insert
DROP TRIGGER IF EXISTS trg_increment_message_count ON public.messages;
CREATE TRIGGER trg_increment_message_count
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.increment_conversation_message_count();

-- Create trigger function for delete
CREATE OR REPLACE FUNCTION public.decrement_conversation_message_count()
RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations
  SET message_count = GREATEST(message_count - 1, 0)
  WHERE id = OLD.conversation_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for delete
DROP TRIGGER IF EXISTS trg_decrement_message_count ON public.messages;
CREATE TRIGGER trg_decrement_message_count
AFTER DELETE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.decrement_conversation_message_count();