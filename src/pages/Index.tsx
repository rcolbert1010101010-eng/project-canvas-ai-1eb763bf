import { useState } from 'react';
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

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'conversations':
        return <ConversationsList />;
      case 'tasks':
        return <TasksView />;
      case 'decisions':
        return <DecisionsView />;
      case 'documents':
        return <DocumentsView />;
      case 'activity':
        return <ActivityView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  const currentView = viewTitles[activeView] || viewTitles.dashboard;

  return (
    <>
      <Helmet>
        <title>Project Canvas AI - Project Intelligence & Execution OS</title>
        <meta name="description" content="Turn AI conversations into decisions, tasks, and documents. Build complex software projects with structured memory and intelligent execution tracking." />
        <meta name="keywords" content="project management, AI assistant, software development, decision tracking, task management" />
      </Helmet>
      
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header 
            title={currentView.title} 
            subtitle={currentView.subtitle}
            onNewConversation={activeView === 'dashboard' || activeView === 'conversations' ? () => {} : undefined}
          />
          
          <div className="flex-1 overflow-auto">
            {renderView()}
          </div>
        </main>
      </div>
    </>
  );
}
