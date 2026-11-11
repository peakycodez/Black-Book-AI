import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { DreamverseMicroLoader } from '@/components/dreamverse';
import { uploadMediaFile } from '@/lib/mediaUtils';
import { toast } from 'sonner';

interface MediaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaType: 'image' | 'audio' | 'video';
  onSave: (source: string) => void;
}

export default function MediaUploadModal({
  open,
  onOpenChange,
  mediaType,
  onSave,
}: MediaUploadModalProps) {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (file) {
      setUploading(true);
      try {
        const { url: uploadedUrl } = await uploadMediaFile(file);
        onSave(uploadedUrl);
      } catch (err: unknown) {
        console.error('Media upload failed:', err);
        const msg =
          err instanceof Error && err.message
            ? err.message
            : 'Upload failed. Please try again or use a URL.';
        toast.error(msg);
        return;
      } finally {
        setUploading(false);
      }
    } else if (url.trim()) {
      onSave(url.trim());
    }
    setUrl('');
    setFile(null);
    onOpenChange(false);
  };

  const getAcceptType = () => {
    switch (mediaType) {
      case 'image':
        return 'image/*';
      case 'audio':
        return 'audio/*';
      case 'video':
        return 'video/*';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}</DialogTitle>
          <DialogDescription>
            Upload a file or enter a URL
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Choose file</Label>
              <Input
                id="file"
                type="file"
                accept={getAcceptType()}
                onChange={handleFileChange}
                className="ltr-input"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Enter URL</Label>
              <Input
                id="url"
                type="url"
                placeholder={`https://example.com/${mediaType}.${mediaType === 'image' ? 'jpg' : 'mp4'}`}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="ltr-input"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={(!file && !url) || uploading} className="gap-2">
            {uploading && <DreamverseMicroLoader size={14} />}
            <span>
              {uploading ? 'Uploading…' : `Add ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
