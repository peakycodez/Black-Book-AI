import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import RichKnowledgeEditor from './RichKnowledgeEditor';
import type { KnowledgeContentBlock } from '@/types/types';

interface AddKnowledgeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedText: string;
  onSave: (contentBlocks: KnowledgeContentBlock[]) => void;
}

export default function AddKnowledgeModal({
  open,
  onOpenChange,
  selectedText,
  onSave,
}: AddKnowledgeModalProps) {
  const [contentBlocks, setContentBlocks] = useState<KnowledgeContentBlock[]>([]);

  useEffect(() => {
    if (!open) {
      setContentBlocks([]);
    }
  }, [open]);

  const handleSave = () => {
    if (contentBlocks.length === 0) {
      toast.error('Please add at least one content block');
      return;
    }
    onSave(contentBlocks);
    setContentBlocks([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setContentBlocks([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Knowledge</DialogTitle>
          <DialogDescription>
            Add hidden knowledge for: <span className="font-medium text-foreground">{selectedText}</span>
          </DialogDescription>
        </DialogHeader>
        
        <RichKnowledgeEditor blocks={contentBlocks} onChange={setContentBlocks} />
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={contentBlocks.length === 0}>
            Save Knowledge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
