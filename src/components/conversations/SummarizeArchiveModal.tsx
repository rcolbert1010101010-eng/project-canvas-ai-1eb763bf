import { useState } from 'react';
import { Archive, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SummarizeArchiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationTitle: string;
  currentPurpose?: string | null;
  onConfirm: (summary: string, purpose?: string) => Promise<void>;
  isPending?: boolean;
}

const MIN_SUMMARY_LENGTH = 20;

export function SummarizeArchiveModal({
  open,
  onOpenChange,
  conversationTitle,
  currentPurpose,
  onConfirm,
  isPending = false,
}: SummarizeArchiveModalProps) {
  const [summary, setSummary] = useState('');
  const [purpose, setPurpose] = useState(currentPurpose || '');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (summary.trim().length < MIN_SUMMARY_LENGTH) {
      setError(`Summary must be at least ${MIN_SUMMARY_LENGTH} characters`);
      return;
    }
    
    setError(null);
    await onConfirm(summary.trim(), purpose.trim() || undefined);
    
    // Reset form
    setSummary('');
    setPurpose('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSummary('');
      setPurpose('');
      setError(null);
    }
    onOpenChange(newOpen);
  };

  const isValid = summary.trim().length >= MIN_SUMMARY_LENGTH;
  const charCount = summary.trim().length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-primary" />
            Summarize & Archive
          </DialogTitle>
          <DialogDescription>
            Archive "{conversationTitle}" with a summary. The summary helps you quickly understand this conversation later without loading all messages.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="summary" className="flex items-center gap-2">
              Summary 
              <span className="text-destructive">*</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {charCount}/{MIN_SUMMARY_LENGTH} min
              </span>
            </Label>
            <Textarea
              id="summary"
              placeholder="Summarize the key outcomes, decisions, and insights from this conversation..."
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                if (error) setError(null);
              }}
              className={cn(
                "min-h-[100px] resize-none",
                error && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-muted-foreground">
              Update Purpose (optional)
            </Label>
            <Input
              id="purpose"
              placeholder={currentPurpose || "Add or update the conversation purpose"}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={!isValid || isPending}
            className="gap-2"
          >
            {isPending ? (
              <>Archiving...</>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                Archive
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
