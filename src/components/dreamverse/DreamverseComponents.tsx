import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

/* ── 1. Dreamverse Mon Crest Seal ── */
export const DreamverseSeal: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="dreamSealGrad" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F5B971" />
        <stop offset="50%" stopColor="#F4A7C1" />
        <stop offset="100%" stopColor="#B59CE2" />
      </linearGradient>
    </defs>
    {/* Subtle outer Mon ring */}
    <circle cx="18" cy="18" r="15.5" stroke="url(#dreamSealGrad)" strokeWidth="1.4" strokeOpacity="0.85" />
    {/* 5-petal Dreamverse Sakura */}
    {[0, 72, 144, 216, 288].map((deg) => (
      <path
        key={deg}
        d="M18 17.5 C16.2 13 13.8 8.2 16.4 6 C17.3 5.2 17.8 5.9 18 6.8 C18.2 5.9 18.7 5.2 19.6 6 C22.2 8.2 19.8 13 18 17.5 Z"
        fill="url(#dreamSealGrad)"
        fillOpacity="0.92"
        transform={`rotate(${deg} 18 18)`}
      />
    ))}
    <circle cx="18" cy="18" r="2.6" fill="#FFF7EB" stroke="#DFA02B" strokeWidth="1" />
  </svg>
);

/* ── 2. Dreamverse Blossom Accent Icon ── */
export const DreamverseBlossom: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {[0, 72, 144, 216, 288].map((deg) => (
      <path
        key={deg}
        d="M12 12 C10.4 8.6 8.5 4.8 10.6 2.8 C11.4 2.1 11.8 2.6 12 3.4 C12.2 2.6 12.6 2.1 13.4 2.8 C15.5 4.8 13.6 8.6 12 12 Z"
        fill="currentColor"
        fillOpacity="0.88"
        transform={`rotate(${deg} 12 12)`}
      />
    ))}
    <circle cx="12" cy="12" r="2" fill="#F5B971" />
  </svg>
);

/* ── 3. Shoji-Silk Cord Divider ── */
export const DreamverseDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={cn('flex items-center gap-2.5 select-none', className)} aria-hidden="true">
    <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-primary/35" />
    <DreamverseBlossom size={11} className="text-primary/70 shrink-0" />
    <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-border to-primary/35" />
  </div>
);

/* ── 4. Multi-Material Luxury Glass Card ── */
export type DreamverseGlassMaterial = 'lavender' | 'sakura' | 'pearl' | 'night';

export interface DreamverseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  material?: DreamverseGlassMaterial;
  spotlight?: boolean;
  tilt?: boolean;
}

const MATERIAL_CLASS: Record<DreamverseGlassMaterial, string> = {
  lavender: 'glass-lavender',
  sakura: 'glass-sakura',
  pearl: 'glass-pearl',
  night: 'glass-night',
};

export const DreamverseCard: React.FC<DreamverseCardProps> = ({
  elevated = false,
  material,
  spotlight = true,
  tilt = false,
  className = '',
  children,
  onMouseMove,
  onMouseLeave,
  ...rest
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (el && (spotlight || tilt)) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (spotlight) {
        el.style.setProperty('--pointer-x', `${x}px`);
        el.style.setProperty('--pointer-y', `${y}px`);
        el.style.setProperty('--spotlight-opacity', '1');
      }
      if (tilt && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const rx = ((y / rect.height - 0.5) * -3).toFixed(2);
        const ry = ((x / rect.width - 0.5) * 3).toFixed(2);
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
      }
    }
    onMouseMove?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (el) {
      el.style.setProperty('--spotlight-opacity', '0');
      if (tilt) {
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      }
    }
    onMouseLeave?.(e);
  };

  const surfaceClass = material
    ? MATERIAL_CLASS[material]
    : elevated
      ? 'botanical-surface-elevated'
      : 'dreamverse-shoji';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative rounded-2xl transition-all duration-200',
        surfaceClass,
        spotlight && 'botanical-spotlight-card',
        className
      )}
      {...rest}
    >
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
};

/* ── 5. Dreamverse Loaders (Micro, Inline, Page, Oracle) ── */
export const DreamverseMicroLoader: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = '',
}) => (
  <span
    className={cn('inline-flex items-center justify-center select-none text-primary', className)}
    role="status"
    aria-label="Loading"
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-spin"
      style={{ animationDuration: '2s', animationTimingFunction: 'cubic-bezier(0.45, 0.05, 0.55, 0.95)' }}
      aria-hidden="true"
    >
      {[0, 72, 144, 216, 288].map((angle, idx) => (
        <path
          key={angle}
          d="M12 12 C10.4 8.6 8.5 4.8 10.6 2.8 C11.4 2.1 11.8 2.6 12 3.4 C12.2 2.6 12.6 2.1 13.4 2.8 C15.5 4.8 13.6 8.6 12 12 Z"
          fill="currentColor"
          fillOpacity={0.3 + idx * 0.16}
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="2" fill="#F5B971" />
    </svg>
  </span>
);

export const DreamverseInlineLoader: React.FC<{
  progress?: number;
  statusText?: string;
  className?: string;
}> = ({ progress, statusText, className = '' }) => {
  const isIndeterminate = progress === undefined;
  const clamped = isIndeterminate ? undefined : Math.min(100, Math.max(0, progress));
  return (
    <div
      className={cn('w-full space-y-2 select-none', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={statusText || 'Loading content'}
    >
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-primary/15">
        {isIndeterminate ? (
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-primary to-[#F5B971] animate-sakura-sweep" />
        ) : (
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-[#B59CE2] to-[#F5B971] transition-[width] duration-300 ease-botanical"
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
      {statusText && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium tracking-wide">{statusText}</span>
          {clamped !== undefined && (
            <span className="font-mono text-[11px] text-primary">{Math.round(clamped)}%</span>
          )}
        </div>
      )}
    </div>
  );
};

export const DreamversePageLoader: React.FC<{
  statusText?: string;
  subText?: string;
  progress?: number;
  className?: string;
}> = ({
  statusText = 'Loading BlackBook',
  subText = 'Preparing your notes & workspace',
  progress,
  className = '',
}) => (
  <div className={cn('flex min-h-[340px] w-full items-center justify-center p-6', className)}>
    <DreamverseCard elevated material="pearl" spotlight className="w-full max-w-sm p-7 text-center">
      <div className="space-y-5">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/[0.08]">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-sakura-breathe" />
          <DreamverseSeal size={40} className="relative" />
        </div>
        <div className="space-y-1.5">
          <p className="font-heading text-base font-semibold text-foreground">{statusText}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{subText}</p>
        </div>
        <DreamverseInlineLoader progress={progress} />
      </div>
    </DreamverseCard>
  </div>
);

export const DreamverseOracleLoader: React.FC<{ label?: string; className?: string }> = ({
  label = 'Analyzing with AI Brain…',
  className = '',
}) => (
  <div
    className={cn(
      'rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-secondary/40 to-[#F5B971]/[0.07] p-4 space-y-3',
      className
    )}
    role="status"
    aria-label={label}
  >
    <div className="flex items-center gap-2.5 text-xs font-medium text-foreground/90">
      <DreamverseMicroLoader size={15} />
      <span>{label}</span>
    </div>
    <DreamverseInlineLoader />
  </div>
);

/* ── 6. Art-Directed Curated Diorama Vignette Components ── */
export const WritingCompanionsVignette: React.FC<{ className?: string; eager?: boolean }> = ({
  className = '',
  eager = false,
}) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl border border-border/75 shadow-lg group',
      className
    )}
  >
    <img
      src="/images/dreamverse/dreamverse-writing-companions.jpg"
      alt="Cozy Sakura wooden writing alcove with woodland bear cub and sakura spirit cat reading a journal"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className="h-full w-full object-cover object-center transition-all duration-500 ease-botanical group-hover:scale-[1.025] dark:brightness-[0.9] dark:contrast-[1.04]"
    />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#191127]/55 via-transparent to-[#191127]/15 dark:shadow-[inset_0_0_42px_rgba(20,16,34,0.72)]" />
  </div>
);

export const SanctuaryAlcoveVignette: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl border border-border/75 shadow-lg group',
      className
    )}
  >
    <img
      src="/images/dreamverse/sakura-reading-alcove.jpg"
      alt="Sakura garden wooden veranda with glowing paper lantern, lacquer writing box, and teacup overlooking pond"
      loading="lazy"
      decoding="async"
      draggable={false}
      className="h-full w-full object-cover object-center transition-transform duration-500 ease-botanical group-hover:scale-[1.025]"
    />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#191127]/45 via-transparent to-transparent" />
  </div>
);

export const OracleShrineVignette: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl border border-primary/30 shadow-lg group',
      className
    )}
  >
    <img
      src="/images/dreamverse/oracle-sakura-shrine.jpg"
      alt="Luminous amethyst Knowledge Oracle crystal hovering above a sakura blossom stone basin"
      loading="lazy"
      decoding="async"
      draggable={false}
      className="h-full w-full object-cover object-center transition-transform duration-500 ease-botanical group-hover:scale-[1.03]"
    />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141022]/60 via-transparent to-transparent" />
  </div>
);
