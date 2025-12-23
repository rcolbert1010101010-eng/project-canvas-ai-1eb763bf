import { Search, Bell, Plus, FolderOpen, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useProjects } from '@/hooks/useProjects';
import { useAppStore } from '@/stores/appStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
  projectId: string | null;
  onNewConversation?: () => void;
}

export function Header({ title, subtitle, projectId, onNewConversation }: HeaderProps) {
  const { data: projects } = useProjects();
  const { setCurrentProjectId } = useAppStore();
  
  const currentProject = projects?.find(p => p.id === projectId);

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {/* Project Selector */}
        {projects && projects.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-left">
                <FolderOpen className="w-4 h-4 text-primary" />
                <span className="font-medium">{currentProject?.name || 'Select Project'}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => setCurrentProjectId(project.id)}
                  className={project.id === projectId ? 'bg-accent' : ''}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  {project.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentProjectId(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <div className="h-6 w-px bg-border" />
        
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search..."
            className="w-64 pl-9 bg-secondary/50 border-border focus:bg-secondary"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
        </Button>

        {/* New Conversation */}
        {onNewConversation && projectId && (
          <Button variant="glow" onClick={onNewConversation} className="gap-2">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        )}
      </div>
    </header>
  );
}
