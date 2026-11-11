import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type, Link as LinkIcon, Image, Music, Video, Trash2, Upload, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadMediaFile } from '@/lib/mediaUtils';
import KnowledgeContentRenderer from './KnowledgeContentRenderer';
import type { KnowledgeContentBlock, KnowledgeContentType } from '@/types/types';

interface RichKnowledgeEditorProps {
  blocks: KnowledgeContentBlock[];
  onChange: (blocks: KnowledgeContentBlock[]) => void;
}

function isLocalDataOrBlobUrl(url: string): boolean {
  return url.startsWith('blob:') || url.startsWith('data:');
}

// Normalize URL by adding https:// if no protocol is present
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    isLocalDataOrBlobUrl(trimmed)
  ) {
    return trimmed;
  }
  
  // Add https:// prefix
  return `https://${trimmed}`;
}

export default function RichKnowledgeEditor({ blocks, onChange }: RichKnowledgeEditorProps) {
  const [activeTab, setActiveTab] = useState<KnowledgeContentType>('text');
  const [textValue, setTextValue] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // Media input mode: 'upload' or 'url'
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [audioMode, setAudioMode] = useState<'upload' | 'url'>('upload');
  const [videoMode, setVideoMode] = useState<'upload' | 'url'>('upload');
  
  // File input refs
  const imageFileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  const addBlock = (type: KnowledgeContentType, value: string, label?: string) => {
    if (!value.trim()) return;

    // Normalize URLs for link, image, audio, and video types (only if not a local blob/data URL)
    let normalizedValue = value.trim();
    if (
      (type === 'link' || type === 'image' || type === 'audio' || type === 'video') &&
      !isLocalDataOrBlobUrl(normalizedValue)
    ) {
      normalizedValue = normalizeUrl(normalizedValue);
    }

    const newBlock: KnowledgeContentBlock = {
      id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      value: normalizedValue,
      label: label?.trim(),
      order: blocks.length,
    };

    onChange([...blocks, newBlock]);

    // Reset inputs
    setTextValue('');
    setLinkUrl('');
    setLinkLabel('');
    setImageUrl('');
    setAudioUrl('');
    setVideoUrl('');
    
    // Reset file inputs
    if (imageFileRef.current) imageFileRef.current.value = '';
    if (audioFileRef.current) audioFileRef.current.value = '';
    if (videoFileRef.current) videoFileRef.current.value = '';
  };

  const deleteBlock = (blockId: string) => {
    const updatedBlocks = blocks
      .filter(b => b.id !== blockId)
      .map((b, index) => ({ ...b, order: index }));
    onChange(updatedBlocks);
  };

  const handleMediaFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const { url } = await uploadMediaFile(file);
      setter(url);
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to load media file. Please try a URL or smaller file.';
      toast.error(msg);
      e.target.value = '';
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    void handleMediaFileUpload(e, setImageUrl);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    void handleMediaFileUpload(e, setAudioUrl);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    void handleMediaFileUpload(e, setVideoUrl);

  return (
    <div className="space-y-4">
      {/* Preview existing blocks */}
      {blocks.length > 0 && (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
          <div className="text-xs font-medium text-muted-foreground">Content Preview</div>
          <div className="space-y-2">
            {blocks.map((block) => (
              <div key={block.id} className="group relative rounded border border-border bg-background p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => deleteBlock(block.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <KnowledgeContentRenderer blocks={[block]} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as KnowledgeContentType)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="text" className="text-xs">
            <Type className="mr-1 h-3 w-3" />
            Text
          </TabsTrigger>
          <TabsTrigger value="link" className="text-xs">
            <LinkIcon className="mr-1 h-3 w-3" />
            Link
          </TabsTrigger>
          <TabsTrigger value="image" className="text-xs">
            <Image className="mr-1 h-3 w-3" />
            Image
          </TabsTrigger>
          <TabsTrigger value="audio" className="text-xs">
            <Music className="mr-1 h-3 w-3" />
            Audio
          </TabsTrigger>
          <TabsTrigger value="video" className="text-xs">
            <Video className="mr-1 h-3 w-3" />
            Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-3">
          <Textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Enter text content..."
            className="min-h-[100px]"
          />
          <Button
            onClick={() => addBlock('text', textValue)}
            disabled={!textValue.trim()}
            size="sm"
            className="w-full"
          >
            Add Text
          </Button>
        </TabsContent>

        <TabsContent value="link" className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="link-label">Link Text (optional)</Label>
            <Input
              id="link-label"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              placeholder="e.g., Visit Google"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="google.com or https://example.com"
            />
            {linkUrl && !linkUrl.startsWith('blob:') && (
              <p className="text-xs text-muted-foreground">
                Will be saved as: {normalizeUrl(linkUrl)}
              </p>
            )}
          </div>
          <Button
            onClick={() => addBlock('link', linkUrl, linkLabel)}
            disabled={!linkUrl.trim()}
            size="sm"
            className="w-full"
          >
            Add Link
          </Button>
        </TabsContent>

        <TabsContent value="image" className="space-y-3">
          {/* Mode Toggle */}
          <div className="flex gap-2 rounded-md border border-border p-1">
            <Button
              variant={imageMode === 'upload' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setImageMode('upload')}
              className="flex-1 text-xs"
            >
              <Upload className="mr-1 h-3 w-3" />
              Upload
            </Button>
            <Button
              variant={imageMode === 'url' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setImageMode('url')}
              className="flex-1 text-xs"
            >
              <Link2 className="mr-1 h-3 w-3" />
              URL
            </Button>
          </div>

          {imageMode === 'upload' ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="image-file">Choose Image File</Label>
                <Input
                  id="image-file"
                  ref={imageFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="cursor-pointer"
                />
              </div>
              {imageUrl && (
                <div className="overflow-hidden rounded-md border border-border">
                  <img src={imageUrl} alt="Preview" className="h-auto w-full object-cover" />
                </div>
              )}
              <Button
                onClick={() => addBlock('image', imageUrl)}
                disabled={!imageUrl || uploadingMedia}
                size="sm"
                className="w-full"
              >
                {uploadingMedia ? 'Processing Image…' : 'Add Image'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="example.com/image.jpg or https://..."
                />
                {imageUrl && !isLocalDataOrBlobUrl(imageUrl) && (
                  <p className="text-xs text-muted-foreground">
                    Will be saved as: {normalizeUrl(imageUrl)}
                  </p>
                )}
              </div>
              {imageUrl && (
                <div className="overflow-hidden rounded-md border border-border">
                  <img 
                    src={isLocalDataOrBlobUrl(imageUrl) ? imageUrl : normalizeUrl(imageUrl)} 
                    alt="Preview" 
                    className="h-auto w-full object-cover" 
                  />
                </div>
              )}
              <Button
                onClick={() => addBlock('image', imageUrl)}
                disabled={!imageUrl.trim()}
                size="sm"
                className="w-full"
              >
                Add Image
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="audio" className="space-y-3">
          {/* Mode Toggle */}
          <div className="flex gap-2 rounded-md border border-border p-1">
            <Button
              variant={audioMode === 'upload' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setAudioMode('upload')}
              className="flex-1 text-xs"
            >
              <Upload className="mr-1 h-3 w-3" />
              Upload
            </Button>
            <Button
              variant={audioMode === 'url' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setAudioMode('url')}
              className="flex-1 text-xs"
            >
              <Link2 className="mr-1 h-3 w-3" />
              URL
            </Button>
          </div>

          {audioMode === 'upload' ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="audio-file">Choose Audio File</Label>
                <Input
                  id="audio-file"
                  ref={audioFileRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="cursor-pointer"
                />
              </div>
              {audioUrl && (
                <div className="rounded-md border border-border bg-muted p-3">
                  <audio controls className="w-full">
                    <source src={audioUrl} />
                  </audio>
                </div>
              )}
              <Button
                onClick={() => addBlock('audio', audioUrl)}
                disabled={!audioUrl || uploadingMedia}
                size="sm"
                className="w-full"
              >
                {uploadingMedia ? 'Processing Audio…' : 'Add Audio'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="audio-url">Audio URL</Label>
                <Input
                  id="audio-url"
                  type="text"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="example.com/audio.mp3 or https://..."
                />
                {audioUrl && !isLocalDataOrBlobUrl(audioUrl) && (
                  <p className="text-xs text-muted-foreground">
                    Will be saved as: {normalizeUrl(audioUrl)}
                  </p>
                )}
              </div>
              {audioUrl && (
                <div className="rounded-md border border-border bg-muted p-3">
                  <audio controls className="w-full">
                    <source src={isLocalDataOrBlobUrl(audioUrl) ? audioUrl : normalizeUrl(audioUrl)} />
                  </audio>
                </div>
              )}
              <Button
                onClick={() => addBlock('audio', audioUrl)}
                disabled={!audioUrl.trim()}
                size="sm"
                className="w-full"
              >
                Add Audio
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="video" className="space-y-3">
          {/* Mode Toggle */}
          <div className="flex gap-2 rounded-md border border-border p-1">
            <Button
              variant={videoMode === 'upload' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVideoMode('upload')}
              className="flex-1 text-xs"
            >
              <Upload className="mr-1 h-3 w-3" />
              Upload
            </Button>
            <Button
              variant={videoMode === 'url' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setVideoMode('url')}
              className="flex-1 text-xs"
            >
              <Link2 className="mr-1 h-3 w-3" />
              URL
            </Button>
          </div>

          {videoMode === 'upload' ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="video-file">Choose Video File</Label>
                <Input
                  id="video-file"
                  ref={videoFileRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="cursor-pointer"
                />
              </div>
              {videoUrl && (
                <div className="overflow-hidden rounded-md border border-border">
                  <video controls className="h-auto w-full">
                    <source src={videoUrl} />
                  </video>
                </div>
              )}
              <Button
                onClick={() => addBlock('video', videoUrl)}
                disabled={!videoUrl || uploadingMedia}
                size="sm"
                className="w-full"
              >
                {uploadingMedia ? 'Processing Video…' : 'Add Video'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="video-url">Video URL</Label>
                <Input
                  id="video-url"
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="example.com/video.mp4 or https://..."
                />
                {videoUrl && !isLocalDataOrBlobUrl(videoUrl) && (
                  <p className="text-xs text-muted-foreground">
                    Will be saved as: {normalizeUrl(videoUrl)}
                  </p>
                )}
              </div>
              {videoUrl && (
                <div className="overflow-hidden rounded-md border border-border">
                  <video controls className="h-auto w-full">
                    <source src={isLocalDataOrBlobUrl(videoUrl) ? videoUrl : normalizeUrl(videoUrl)} />
                  </video>
                </div>
              )}
              <Button
                onClick={() => addBlock('video', videoUrl)}
                disabled={!videoUrl.trim()}
                size="sm"
                className="w-full"
              >
                Add Video
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
