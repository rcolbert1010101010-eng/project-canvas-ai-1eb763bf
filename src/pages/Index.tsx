import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ConversationsList } from '@/components/conversations/ConversationsList';
import { TasksView } from '@/components/tasks/TasksView';
import { DecisionsView } from '@/components/decisions/DecisionsView';
import { DocumentsView } from '@/components/documents/DocumentsView';
import { ActivityView } from '@/components/activity/ActivityView';
import { SettingsView } from '@/components/settings/SettingsView';
import { ProjectSelector } from '@/components/project/ProjectSelector';
import { useProjects } from '@/hooks/useProjects';
import { useAppStore } from '@/stores/appStore';

const viewTitles: Record<string, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Project Overview' },
  conversations: { title: 'Conversations', subtitle: 'AI Chat Sessions' },
  tasks: { title: 'Tasks', subtitle: 'Execution Queue' },
  decisions: { title: 'Decisions', subtitle: 'Architectural Memory' },
  documents: { title: 'Documents', subtitle: 'Source of Truth' },
  activity: { title: 'Activity', subtitle: 'Project Timeline' },
  settings: { title: 'Settings', subtitle: 'Project Configuration' },
};

export default function Index() {
  const [activeView, setActiveView] = useState('dashboard');
  const { data: projects, isLoading } = useProjects();
  const { currentProjectId, setCurrentProjectId } = useAppStore();
  
  // Auto-select first project if none selected
  useEffect(() => {
    if (!currentProjectId && projects && projects.length > 0) {
      setCurrentProjectId(projects[0].id);
    }
  }, [projects, currentProjectId, setCurrentProjectId]);

  const currentProject = projects?.find(p => p.id === currentProjectId);

  const renderView = () => {
    if (!currentProjectId) {
      return <ProjectSelector />;
    }

    switch (activeView) {
      case 'dashboard':
        return <Dashboard projectId={currentProjectId} />;
      case 'conversations':
        return <ConversationsList projectId={currentProjectId} />;
      case 'tasks':
        return <TasksView projectId={currentProjectId} />;
      case 'decisions':
        return <DecisionsView projectId={currentProjectId} />;
      case 'documents':
        return <DocumentsView projectId={currentProjectId} />;
      case 'activity':
        return <ActivityView projectId={currentProjectId} />;
      case 'settings':
        return <SettingsView projectId={currentProjectId} projectName={currentProject?.name || ''} />;
      default:
        return <Dashboard projectId={currentProjectId} />;
    }
  };

  const currentView = viewTitles[activeView] || viewTitles.dashboard;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading projects...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{currentProject?.name || 'Project Canvas AI'} - Project Intelligence & Execution OS</title>
        <meta name="description" content="Turn AI conversations into decisions, tasks, and documents. Build complex software projects with structured memory and intelligent execution tracking." />
        <meta name="keywords" content="project management, AI assistant, software development, decision tracking, task management" />
      </Helmet>
      
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar 
          activeView={activeView} 
          onViewChange={setActiveView}
          projectId={currentProjectId}
        />
        
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header 
            title={currentView.title} 
            subtitle={currentProject?.name || currentView.subtitle}
            projectId={currentProjectId}
            onNewConversation={activeView === 'dashboard' || activeView === 'conversations' ? () => setActiveView('conversations') : undefined}
          />
          
          <div className="flex-1 overflow-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </>
  );
}
