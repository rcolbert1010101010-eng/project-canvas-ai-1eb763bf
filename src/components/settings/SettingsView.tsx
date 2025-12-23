import { User, Palette, Bot, Bell, Shield, Database, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function SettingsView() {
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
              <Input defaultValue="Canvas AI Project" />
            </div>
            <div className="space-y-2">
              <Label>Project ID</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-secondary/50 rounded-md text-sm font-mono text-muted-foreground">
                  proj_canvas_ai_2024
                </code>
                <Button variant="outline" size="sm">Copy</Button>
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
                <Badge variant="default">GPT-4 Turbo</Badge>
                <Badge variant="secondary">gpt-4-turbo-preview</Badge>
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
              <Shield className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Delete Project</p>
                <p className="text-sm text-muted-foreground">Permanently delete this project and all its data</p>
              </div>
              <Button variant="destructive">Delete</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
