import { Search, Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNewConversation?: () => void;
}

export function Header({ title, subtitle, onNewConversation }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
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
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>

        {/* New Conversation */}
        {onNewConversation && (
          <Button variant="glow" onClick={onNewConversation} className="gap-2">
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        )}
      </div>
    </header>
  );
}
