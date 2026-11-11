import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Check, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { DreamverseMicroLoader } from '@/components/dreamverse';
import { shareNote } from '@/lib/unifiedStorage';

interface ShareModalProps {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBeforeShare?: () => Promise<boolean>;
}

export default function ShareModal({ noteId, open, onOpenChange, onBeforeShare }: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      if (onBeforeShare) {
        const saved = await onBeforeShare();
        if (!saved) {
          return;
        }
      }
      const shareId = await shareNote(noteId);
      const url = `${window.location.origin}/share/${shareId}`;
      setShareUrl(url);

      navigator.clipboard?.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // Clipboard permission may be restricted; link input remains visible
      });
    } catch (error) {
      console.error('Failed to generate share link:', error);
      toast.error('Failed to generate share link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard?.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        toast.error('Could not copy automatically. Copy the link from the box.');
      });
    }
  };

  const handleClose = () => {
    setShareUrl('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.08] text-primary">
              <Share2 className="h-4 w-4" />
            </div>
            <DialogTitle className="font-heading text-base font-semibold">
              Share this note
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Generate a read-only public link for anyone with the URL.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-1">
          {!shareUrl ? (
            <Button onClick={handleGenerateLink} className="w-full rounded-xl gap-2" disabled={loading}>
              {loading && <DreamverseMicroLoader size={15} />}
              <span>{loading ? 'Generating link…' : 'Generate Shareable Link'}</span>
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="ltr-input flex-1 rounded-xl"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl shrink-0"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-primary font-medium">Link copied to clipboard!</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
