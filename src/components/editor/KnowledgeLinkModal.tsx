import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Edit2, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import RichKnowledgeEditor from './RichKnowledgeEditor';
import KnowledgeContentRenderer from './KnowledgeContentRenderer';
import type { KnowledgeLink, KnowledgeContentBlock } from '@/types/types';

interface KnowledgeLinkModalProps {
  link: KnowledgeLink;
  onClose: () => void;
  onEdit: (linkId: string, contentBlocks: KnowledgeContentBlock[]) => void;
  onDelete: (linkId: string) => void;
}

export default function KnowledgeLinkModal({ 
  link, 
  onClose,
  onEdit,
  onDelete 
}: KnowledgeLinkModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContentBlocks, setEditContentBlocks] = useState<KnowledgeContentBlock[]>(
    link.contentBlocks || []
  );

  useEffect(() => {
    if (!isEditing) {
      setEditContentBlocks(link.contentBlocks || []);
    }
  }, [link, isEditing]);

  const handleSave = () => {
    if (editContentBlocks.length === 0) {
      toast.error('Please add at least one content block');
      return;
    }
    onEdit(link.id, editContentBlocks);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContentBlocks(link.contentBlocks || []);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this knowledge link? The text will remain but the hidden knowledge will be removed.')) {
      onDelete(link.id);
      onClose();
    }
  };

  // Check if link has rich content or legacy plain text
  const hasRichContent = link.contentBlocks && link.contentBlocks.length > 0;
  const hasLegacyContent = !hasRichContent && link.content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border/90 bg-popover/95 backdrop-blur-xl p-8 shadow-botanical-hover animate-in zoom-in-95 duration-200">
        <div className="absolute right-4 top-4 flex gap-2">
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">{link.text}</h2>
          
          {isEditing ? (
            <div className="space-y-4">
              <RichKnowledgeEditor blocks={editContentBlocks} onChange={setEditContentBlocks} />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleSave}
                  disabled={editContentBlocks.length === 0}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {hasRichContent ? (
                <KnowledgeContentRenderer blocks={link.contentBlocks!} />
              ) : hasLegacyContent ? (
                <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                  {link.content}
                </div>
              ) : (
                <div className="text-base text-muted-foreground">No knowledge content available</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
