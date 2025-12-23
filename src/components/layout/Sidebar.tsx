import { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  CheckSquare, 
  Lightbulb, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Activity,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useTasks } from '@/hooks/useTasks';
import { useDecisions } from '@/hooks/useDecisions';

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  getBadge?: () => number;
};

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  projectId: string | null;
}

export function Sidebar({ activeView, onViewChange, projectId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  
  const { data: conversations } = useConversations(projectId);
  const { data: tasks } = useTasks(projectId);
  const { data: decisions } = useDecisions(projectId);

  const activeConversations = conversations?.filter(c => !c.is_archived).length || 0;
  const openTasks = tasks?.filter(t => t.status !== 'done').length || 0;
  const activeDecisions = decisions?.filter(d => d.status !== 'deprecated').length || 0;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'conversations', label: 'Conversations', icon: MessageSquare, getBadge: () => activeConversations },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, getBadge: () => openTasks },
    { id: 'decisions', label: 'Decisions', icon: Lightbulb, getBadge: () => activeDecisions },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="slide-in-left">
              <h1 className="font-semibold text-foreground">Canvas AI</h1>
              <p className="text-xs text-muted-foreground">Project Intelligence</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {!projectId && (
          <button
            onClick={() => onViewChange('projects')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
          >
            <FolderOpen className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Select Project</span>}
          </button>
        )}
        
        {projectId && navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const badge = item.getBadge?.();
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                isActive && "text-primary"
              )} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      isActive 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {projectId && (
          <button
            onClick={() => onViewChange('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeView === 'settings'
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>
        )}

        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
