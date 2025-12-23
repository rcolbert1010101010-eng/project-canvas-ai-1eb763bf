-- Create enum types for the application
CREATE TYPE public.ai_mode AS ENUM ('design', 'debug', 'planning', 'implementation', 'review');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.decision_status AS ENUM ('proposed', 'accepted', 'deprecated');
CREATE TYPE public.impact_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.activity_type AS ENUM ('decision_created', 'task_status_changed', 'document_edited', 'conversation_archived');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  purpose TEXT,
  summary TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  mode public.ai_mode NOT NULL DEFAULT 'design',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  next_action TEXT,
  status public.task_status NOT NULL DEFAULT 'todo',
  blocked_reason TEXT,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create decisions table
CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT,
  status public.decision_status NOT NULL DEFAULT 'proposed',
  impact public.impact_level NOT NULL DEFAULT 'medium',
  supersedes_decision_id UUID REFERENCES public.decisions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create activity_logs table for project timeline
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type public.activity_type NOT NULL,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create helper function to check project ownership
CREATE OR REPLACE FUNCTION public.is_project_owner(project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_id AND owner_id = auth.uid()
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects RLS policies
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (owner_id = auth.uid());

-- Conversations RLS policies
CREATE POLICY "Users can view conversations in their projects"
  ON public.conversations FOR SELECT
  USING (public.is_project_owner(project_id));

CREATE POLICY "Users can create conversations in their projects"
  ON public.conversations FOR INSERT
  WITH CHECK (public.is_project_owner(project_id));

CREATE POLICY "Users can update conversations in their projects"
  ON public.conversations FOR UPDATE
  USING (public.is_project_owner(project_id));

CREATE POLICY "Users can delete conversations in their projects"
  ON public.conversations FOR DELETE
  USING (public.is_project_owner(project_id));

-- Messages RLS policies (through conversation ownership)
CREATE OR REPLACE FUNCTION public.is_conversation_owner(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.projects p ON c.project_id = p.id
    WHERE c.id = conv_id AND p.owner_id = auth.uid()
  )
$$;

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (public.is_conversation_owner(conversation_id));

CREATE POLICY "Users can create messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (public.is_conversation_owner(conversation_id));

CREATE POLICY "Users can delete messages in their conversations"
  ON public.messages FOR DELETE
  USING (public.is_conversation_owner(conversation_id));

-- Tasks RLS policies
CREATE POLICY "Users can view tasks in their projects"
  ON public.tasks FOR SELECT
  USING (public.is_project_owner(project_id));

CREATE POLICY "Users can create tasks in their projects"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_project_owner(project_id));

CREATE POLICY "Users can update tasks in their projects"
  ON public.tasks FOR UPDATE
  USING (public.is_project_owner(project_id));

CREATE POLICY "Users can delete tasks in their projects"
  ON public.tasks FOR DELETE
  USING (public.is_project_owner(project_id));

-- Decisions RLS policies
CREATE POLICY "Users can view decisions in their projects"
  ON public.decisions FOR SELECT
  USING (public.is_project_owner(project_id));

CREATE POLICY "Users can create decisions in their projects"
  ON public.decisions FOR INSERT
  WITH CHECK (public.is_project_owner(project_id));

CREATE POLICY "Users can update decisions in their projects"
  ON public.decisions FOR UPDATE
  USING (public.is_project_owner(project_id));

CREATE POLICY "Users can delete decisions in their projects"
  ON public.decisions FOR DELETE
  USING (public.is_project_owner(project_id));

-- Documents RLS policies
CREATE POLICY "Users can view documents in their projects"
  ON public.documents FOR SELECT
  USING (public.is_project_owner(project_id));

CREATE POLICY "Users can create documents in their projects"
  ON public.documents FOR INSERT
  WITH CHECK (public.is_project_owner(project_id));

CREATE POLICY "Users can update documents in their projects"
  ON public.documents FOR UPDATE
  USING (public.is_project_owner(project_id));

CREATE POLICY "Users can delete documents in their projects"
  ON public.documents FOR DELETE
  USING (public.is_project_owner(project_id));

-- Activity logs RLS policies
CREATE POLICY "Users can view activity logs in their projects"
  ON public.activity_logs FOR SELECT
  USING (public.is_project_owner(project_id));

CREATE POLICY "Users can create activity logs in their projects"
  ON public.activity_logs FOR INSERT
  WITH CHECK (public.is_project_owner(project_id));

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at
  BEFORE UPDATE ON public.decisions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for messages (for live chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create indexes for performance
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_conversations_project ON public.conversations(project_id);
CREATE INDEX idx_conversations_archived ON public.conversations(is_archived);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_decisions_project ON public.decisions(project_id);
CREATE INDEX idx_decisions_status ON public.decisions(status);
CREATE INDEX idx_documents_project ON public.documents(project_id);
CREATE INDEX idx_documents_pinned ON public.documents(is_pinned);
CREATE INDEX idx_activity_logs_project ON public.activity_logs(project_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at);