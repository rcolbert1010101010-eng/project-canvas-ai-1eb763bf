import { Sparkles, Bug, Map, Code, Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type AIMode = Database['public']['Enums']['ai_mode'];

interface ModeSelectorProps {
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
}

const modes: { value: AIMode; label: string; icon: React.ComponentType<{ className?: string }>; description: string; color: string }[] = [
  { value: 'design', label: 'Design', icon: Sparkles, description: 'UI/UX and visual design', color: 'text-primary' },
  { value: 'debug', label: 'Debug', icon: Bug, description: 'Find and fix issues', color: 'text-destructive' },
  { value: 'planning', label: 'Planning', icon: Map, description: 'Break down and organize', color: 'text-warning' },
  { value: 'implementation', label: 'Implementation', icon: Code, description: 'Write and review code', color: 'text-info' },
  { value: 'review', label: 'Review', icon: Eye, description: 'Analyze and improve', color: 'text-success' },
];

export function ModeSelector({ currentMode, onModeChange }: ModeSelectorProps) {
  const currentModeConfig = modes.find(m => m.value === currentMode) || modes[0];
  const Icon = currentModeConfig.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 h-9">
          <Icon className={cn("w-4 h-4", currentModeConfig.color)} />
          <span className="font-medium">{currentModeConfig.label}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {modes.map((mode) => {
          const ModeIcon = mode.icon;
          return (
            <DropdownMenuItem
              key={mode.value}
              onClick={() => onModeChange(mode.value)}
              className={cn(
                "flex items-center gap-3 py-2",
                currentMode === mode.value && "bg-accent"
              )}
            >
              <ModeIcon className={cn("w-4 h-4", mode.color)} />
              <div>
                <div className="font-medium">{mode.label}</div>
                <div className="text-xs text-muted-foreground">{mode.description}</div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
