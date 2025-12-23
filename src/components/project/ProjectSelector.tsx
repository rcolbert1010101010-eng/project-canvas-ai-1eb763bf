import { useState } from 'react';
import { Plus, FolderOpen, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProjects, useCreateProject } from '@/hooks/useProjects';
import { useAppStore } from '@/stores/appStore';

export function ProjectSelector() {
  const { data: projects } = useProjects();
  const createProject = useCreateProject();
  const { setCurrentProjectId } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    const project = await createProject.mutateAsync({
      name: newProjectName,
      description: newProjectDescription || undefined,
    });
    
    setCurrentProjectId(project.id);
    setShowCreate(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  if (showCreate) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New Project
            </CardTitle>
            <CardDescription>
              Start a new project to organize your AI conversations, tasks, and decisions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Project"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="A brief description of your project"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreate(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="glow"
                onClick={handleCreateProject}
                disabled={!newProjectName.trim() || createProject.isPending}
                className="flex-1"
              >
                {createProject.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Canvas AI</h2>
        <p className="text-muted-foreground max-w-md">
          Select a project to continue or create a new one to get started.
        </p>
      </div>

      {projects && projects.length > 0 ? (
        <div className="w-full max-w-2xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                variant="interactive"
                className="cursor-pointer"
                onClick={() => setCurrentProjectId(project.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{project.name}</h4>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center pt-4">
            <Button variant="outline" onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create New Project
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="glow" size="lg" onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-5 h-5" />
          Create Your First Project
        </Button>
      )}
    </div>
  );
}
