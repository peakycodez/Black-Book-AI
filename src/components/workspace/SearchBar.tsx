import { useState, useEffect, type RefObject } from 'react';
import { Search, SearchX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Note } from '@/types/types';

interface SearchBarProps {
  query?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  onSearch: (query: string) => void;
  searchResults: Note[];
  onSelectNote: (noteId: string) => void;
}

export default function SearchBar({
  query: controlledQuery,
  inputRef,
  onSearch,
  searchResults,
  onSelectNote,
}: SearchBarProps) {
  const [query, setQuery] = useState(controlledQuery ?? '');

  useEffect(() => {
    if (controlledQuery !== undefined) {
      setQuery(controlledQuery);
    }
  }, [controlledQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search notes (Ctrl+K)..."
          value={query}
          className="ltr-input pl-9 rounded-xl bg-card/50 focus:bg-card/75 border-white/45 dark:border-white/15 text-xs h-9"
          onChange={handleChange}
        />
      </div>
      {query.trim().length > 0 && searchResults.length === 0 && (
        <div className="glass-sakura flex flex-col items-center justify-center p-4 text-center rounded-xl space-y-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/[0.08] text-primary">
            <SearchX className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-foreground">No matching notes</p>
          <p className="text-[11px] text-muted-foreground">
            No notes matched “{query}”
          </p>
        </div>
      )}
      {searchResults.length > 0 && (
        <div className="glass-night max-h-64 space-y-1 overflow-y-auto rounded-xl p-1.5 shadow-botanical">
          {searchResults.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => onSelectNote(note.id)}
              className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-hover"
            >
              <div className="font-medium text-foreground truncate">{note.title}</div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
