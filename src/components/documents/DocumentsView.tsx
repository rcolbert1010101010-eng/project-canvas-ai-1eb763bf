import { useState } from 'react';
import { FileText, Pin, Clock, Edit3, Plus, Search, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Document } from '@/types';

const mockDocuments: Document[] = [
  { 
    id: '1', 
    project_id: '1', 
    title: 'Architecture Overview', 
    content: '# Architecture Overview\n\nThis document describes the high-level architecture of the system...', 
    is_pinned: true, 
    version: 3, 
    created_at: '2024-01-10', 
    updated_at: '2024-01-15' 
  },
  { 
    id: '2', 
    project_id: '1', 
    title: 'API Specification', 
    content: '# API Specification\n\n## Endpoints\n\n### Users\n- GET /users\n- POST /users...', 
    is_pinned: true, 
    version: 7, 
    created_at: '2024-01-08', 
    updated_at: '2024-01-14' 
  },
  { 
    id: '3', 
    project_id: '1', 
    title: 'Database Schema', 
    content: '# Database Schema\n\n## Tables\n\n### users\n| Column | Type | Description |...', 
    is_pinned: false, 
    version: 2, 
    created_at: '2024-01-12', 
    updated_at: '2024-01-13' 
  },
  { 
    id: '4', 
    project_id: '1', 
    title: 'Deployment Guide', 
    content: '# Deployment Guide\n\n## Prerequisites\n\n- Node.js 18+\n- Docker...', 
    is_pinned: false, 
    version: 1, 
    created_at: '2024-01-11', 
    updated_at: '2024-01-11' 
  },
  { 
    id: '5', 
    project_id: '1', 
    title: 'Testing Strategy', 
    content: '# Testing Strategy\n\n## Unit Tests\n\nWe use Jest for unit testing...', 
    is_pinned: false, 
    version: 4, 
    created_at: '2024-01-09', 
    updated_at: '2024-01-12' 
  },
];

export function DocumentsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const pinnedDocs = mockDocuments.filter(d => d.is_pinned);
  const otherDocs = mockDocuments.filter(d => !d.is_pinned);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPreview = (content: string) => {
    const lines = content.split('\n').filter(l => !l.startsWith('#') && l.trim());
    return lines.slice(0, 2).join(' ').substring(0, 150) + '...';
  };

  const DocumentCard = ({ doc }: { doc: Document }) => (
    <Card 
      variant="interactive"
      className={cn(
        "transition-all duration-200",
        selectedDoc?.id === doc.id && "ring-2 ring-primary/50"
      )}
      onClick={() => setSelectedDoc(doc)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            doc.is_pinned ? "bg-primary/10" : "bg-secondary"
          )}>
            <FileText className={cn(
              "w-5 h-5",
              doc.is_pinned ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-foreground truncate">{doc.title}</h4>
              {doc.is_pinned && (
                <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {getPreview(doc.content)}
            </p>
            
            <div className="flex items-center gap-3 mt-3">
              <Badge variant="secondary" className="text-xs">
                v{doc.version}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(doc.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 animate-in">
      <div className="flex gap-6">
        {/* Documents List */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Documents</h2>
              <p className="text-sm text-muted-foreground">Source of truth for your project</p>
            </div>
            <Button variant="glow" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Document
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Pinned Documents */}
          {pinnedDocs.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Pin className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Pinned</h3>
                <Badge variant="default">{pinnedDocs.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedDocs.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>
            </div>
          )}

          {/* Other Documents */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">All Documents</h3>
              <Badge variant="secondary">{otherDocs.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherDocs.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </div>
        </div>

        {/* Document Preview */}
        {selectedDoc && (
          <div className="w-96 shrink-0">
            <Card className="sticky top-6">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{selectedDoc.title}</h3>
                    {selectedDoc.is_pinned && (
                      <Pin className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Version</span>
                    <Badge variant="secondary">v{selectedDoc.version}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-foreground">{formatDate(selectedDoc.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="text-foreground">{formatDate(selectedDoc.updated_at)}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <pre className="text-xs bg-secondary/50 p-3 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap">
                      {selectedDoc.content}
                    </pre>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="default" size="sm" className="flex-1">Open Editor</Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                  >
                    {selectedDoc.is_pinned ? 'Unpin' : 'Pin'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
