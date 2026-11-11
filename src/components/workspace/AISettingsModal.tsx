import { useState, useEffect } from 'react';
import { DreamverseSeal } from '@/components/dreamverse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  EyeOff,
  Check,
  Trash2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getPersonalApiKey,
  setPersonalApiKey,
  removePersonalApiKey,
  getMaskedApiKey,
  validateGeminiKeyFormat,
} from '@/lib/aiConfig';

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AISettingsModal({ open, onOpenChange }: AISettingsModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savedMaskedKey, setSavedMaskedKey] = useState<string>('');
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      const activeKey = getPersonalApiKey();
      setHasKey(Boolean(activeKey));
      setSavedMaskedKey(getMaskedApiKey());
      setApiKeyInput('');
      setShowKey(false);
    }
  }, [open]);

  const handleSave = () => {
    if (!apiKeyInput.trim()) {
      toast.error('Please enter a valid Gemini API key.');
      return;
    }

    if (!validateGeminiKeyFormat(apiKeyInput)) {
      toast.error('Key format looks invalid. Gemini keys typically begin with AIzaSy.');
      return;
    }

    setPersonalApiKey(apiKeyInput);
    setHasKey(true);
    setSavedMaskedKey(getMaskedApiKey());
    setApiKeyInput('');
    toast.success('Personal Gemini API key saved successfully.');
  };

  const handleRemove = () => {
    removePersonalApiKey();
    setHasKey(false);
    setSavedMaskedKey('');
    setApiKeyInput('');
    toast.info('Personal key removed. Now using default BlackBook AI.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.08]">
              <DreamverseSeal size={24} />
            </div>
            <div>
              <DialogTitle className="font-heading text-base font-semibold text-foreground">
                AI Brain Configuration
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Use managed BlackBook AI or connect your personal Gemini API key.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Status banner */}
          <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface/65 p-3">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">Active Provider</p>
              <p className="text-xs text-muted-foreground">
                {hasKey ? 'Your personal Gemini API key' : 'BlackBook Managed AI (Default)'}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                hasKey
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-muted/60 text-muted-foreground'
              }
            >
              {hasKey ? 'Personal Key Active' : 'Default Managed'}
            </Badge>
          </div>

          {/* Configured key presentation */}
          {hasKey && (
            <div className="rounded-lg border border-border/60 bg-surface/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Saved Key:</span>
                <span className="font-mono text-xs text-foreground tracking-wider">
                  {savedMaskedKey}
                </span>
              </div>
              <div className="flex justify-end pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove / Clear Key
                </Button>
              </div>
            </div>
          )}

          {/* Input section */}
          <div className="space-y-2">
            <Label htmlFor="gemini-key" className="text-xs font-medium text-foreground">
              {hasKey ? 'Replace API Key' : 'Enter your own Gemini API Key'}
            </Label>
            <div className="relative">
              <Input
                id="gemini-key"
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="pr-10 font-mono text-xs border-border/80 bg-background/50 focus-visible:ring-[#5B5BD6]"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Use your own Gemini API key for AI Brain requests. Get a free key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                Google AI Studio <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
              </a>
              .
            </p>
          </div>

          {/* Security Guarantee Notice */}
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] p-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <div className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Local Security Guarantee: </span>
              Your personal key is stored exclusively in this browser's local storage. It is{' '}
              <strong className="text-foreground">never</strong> saved to database notes, profiles,
              shared links, or server logs.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!apiKeyInput.trim()}
              className="text-xs gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              {hasKey ? 'Update Key' : 'Save Key'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
