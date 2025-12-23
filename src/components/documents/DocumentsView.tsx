import { useState } from 'react';
import { FileText, Pin, Clock, Edit3, Plus, Search, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useDocuments, useCreateDocument, useUpdateDocument, type Document } from '@/hooks/useDocuments';

interface DocumentsViewProps {
  projectId: string;
}

export function DocumentsView({ projectId }: DocumentsViewProps) {
  const { data: documents, isLoading } = useDocuments(projectId);
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const pinnedDocs = documents?.filter(d => d.is_pinned) || [];
  const otherDocs = documents?.filter(d => !d.is_pinned) || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPreview = (content: string) => {
    const lines = content.split('\n').filter(l => !l.startsWith('#') && l.trim());
    return lines.slice(0, 2).join(' ').substring(0, 150) + (content.length > 150 ? '...' : '');
  };

  const handleCreateDocument = async () => {
    if (!newTitle.trim()) return;
    
    const doc = await createDocument.mutateAsync({
      project_id: projectId,
      title: newTitle,
      content: newContent,
    });
    
    setShowNewDialog(false);
    setNewTitle('');
    setNewContent('');
    setSelectedDoc(doc);
  };

  const handleTogglePin = async (doc: Document) => {
    await updateDocument.mutateAsync({ id: doc.id, is_pinned: !doc.is_pinned });
    if (selectedDoc?.id === doc.id) {
      setSelectedDoc({ ...doc, is_pinned: !doc.is_pinned });
    }
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

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading documents...</div>
      </div>
    );
  }

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
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button variant="glow" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Architecture Overview"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content (Markdown)</Label>
                    <Textarea
                      id="content"
                      placeholder="# Document Title&#10;&#10;Write your content here..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  <Button
                    variant="glow"
                    className="w-full"
                    onClick={handleCreateDocument}
                    disabled={!newTitle.trim() || createDocument.isPending}
                  >
                    {createDocument.isPending ? 'Creating...' : 'Create Document'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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

          {documents && documents.length > 0 ? (
            <>
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
              {otherDocs.length > 0 && (
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
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No documents yet</h4>
              <p className="text-muted-foreground mb-4">Create your first document to store project knowledge.</p>
              <Button variant="glow" onClick={() => setShowNewDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Document
              </Button>
            </div>
          )}
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
                      {selectedDoc.content || 'No content'}
                    </pre>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="default" size="sm" className="flex-1">Open Editor</Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleTogglePin(selectedDoc)}
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
