import { User, Palette, Bot, Bell, Shield, Database, Download, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUpdateProject, useDeleteProject } from '@/hooks/useProjects';
import { useAppStore } from '@/stores/appStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SettingsViewProps {
  projectId: string;
  projectName: string;
}

export function SettingsView({ projectId, projectName }: SettingsViewProps) {
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { setCurrentProjectId } = useAppStore();
  const navigate = useNavigate();
  
  const [name, setName] = useState(projectName);
  const [confirmDelete, setConfirmDelete] = useState('');

  const handleUpdateName = async () => {
    if (name.trim() && name !== projectName) {
      await updateProject.mutateAsync({ id: projectId, name });
    }
  };

  const handleDelete = async () => {
    if (confirmDelete === projectName) {
      await deleteProject.mutateAsync(projectId);
      setCurrentProjectId(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl animate-in">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your project preferences</p>
      </div>

      <div className="space-y-6">
        {/* Project Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <CardTitle>Project</CardTitle>
            </div>
            <CardDescription>General project settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <div className="flex gap-2">
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                />
                <Button 
                  variant="outline"
                  onClick={handleUpdateName}
                  disabled={!name.trim() || name === projectName || updateProject.isPending}
                >
                  {updateProject.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Project ID</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-secondary/50 rounded-md text-sm font-mono text-muted-foreground truncate">
                  {projectId}
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(projectId)}
                >
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <CardTitle>AI Configuration</CardTitle>
            </div>
            <CardDescription>Configure AI assistant behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Model</Label>
              <div className="flex items-center gap-2">
                <Badge variant="default">Gemini 2.5 Flash</Badge>
                <Badge variant="secondary">google/gemini-2.5-flash</Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Include pinned documents in context</Label>
                <p className="text-sm text-muted-foreground">Always include pinned documents when chatting with AI</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-extract decisions</Label>
                <p className="text-sm text-muted-foreground">Suggest decision extraction after AI responses</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-extract tasks</Label>
                <p className="text-sm text-muted-foreground">Suggest task extraction after AI responses</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Conversation health warnings</Label>
                <p className="text-sm text-muted-foreground">Warn when conversations get too long</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Blocked task reminders</Label>
                <p className="text-sm text-muted-foreground">Notify about tasks blocked for more than 2 days</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              <CardTitle>Export</CardTitle>
            </div>
            <CardDescription>Export your project data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start gap-2">
                <Download className="w-4 h-4" />
                Export as Markdown
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <Download className="w-4 h-4" />
                Export as README
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <Download className="w-4 h-4" />
                Export ADR Bundle
              </Button>
              <Button variant="outline" className="justify-start gap-2">
                <Download className="w-4 h-4" />
                GitHub-Ready Structure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-destructive/30 rounded-lg space-y-4">
              <div>
                <p className="font-medium text-foreground">Delete Project</p>
                <p className="text-sm text-muted-foreground">Permanently delete this project and all its data</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Type <span className="font-mono text-foreground">{projectName}</span> to confirm
                </Label>
                <Input
                  value={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.value)}
                  placeholder={projectName}
                />
              </div>
              <Button 
                variant="destructive"
                disabled={confirmDelete !== projectName || deleteProject.isPending}
                onClick={handleDelete}
              >
                {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
