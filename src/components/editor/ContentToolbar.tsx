import { Button } from '@/components/ui/button';
import { Type, Image, Music, Video } from 'lucide-react';

interface ContentToolbarProps {
  onAddText: () => void;
  onAddImage: () => void;
  onAddAudio: () => void;
  onAddVideo: () => void;
}

export default function ContentToolbar({
  onAddText,
  onAddImage,
  onAddAudio,
  onAddVideo,
}: ContentToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-border/65 bg-surface/55 p-1.5 flex-wrap backdrop-blur-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddText}
        className="h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card/80"
      >
        <Type className="h-3.5 w-3.5 text-primary" />
        <span>Add Text</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddImage}
        className="h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card/80"
      >
        <Image className="h-3.5 w-3.5 text-[#8267B8] dark:text-[#D8BAFA]" />
        <span>Add Image</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddAudio}
        className="h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card/80"
      >
        <Music className="h-3.5 w-3.5 text-[#DFA02B] dark:text-[#F5B971]" />
        <span>Add Audio</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAddVideo}
        className="h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card/80"
      >
        <Video className="h-3.5 w-3.5 text-[#429472] dark:text-[#78BFA6]" />
        <span>Add Video</span>
      </Button>
    </div>
  );
}
