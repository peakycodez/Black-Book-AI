import React, { useEffect, useRef } from 'react';

type CursorState = 'default' | 'pointer' | 'grab' | 'text' | 'hidden';

interface TrailPoint {
  x: number;
  y: number;
  age: number;
  maxAge: number;
  width: number;
}

interface BlossomSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  size: number;
  age: number;
  maxAge: number;
  hue: 'sakura' | 'lavender' | 'gold';
}

const INTERACTIVE_SELECTOR =
  'a, button:not(:disabled), [role="button"]:not([aria-disabled="true"]), select, label[for], [data-cursor="pointer"], .knowledge-link, .cursor-pointer';

const TEXT_INPUT_SELECTOR =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="reset"]), textarea, [contenteditable="true"], [contenteditable=""], .block-editor-content, .ProseMirror';

const GRAB_SELECTOR = '[data-cursor="grab"], [draggable="true"]';
const DISABLED_SELECTOR = 'button:disabled, [aria-disabled="true"]';

function resolveCursorState(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return 'default';
  if (target.closest(DISABLED_SELECTOR)) return 'hidden';
  if (target.closest(TEXT_INPUT_SELECTOR)) return 'text';
  if (target.closest(GRAB_SELECTOR)) return 'grab';
  if (target.closest(INTERACTIVE_SELECTOR)) return 'pointer';
  return 'default';
}

/**
 * Draw a miniature 5-petal sakura blossom sparkle onto Canvas 2D.
 */
function drawMiniBlossom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rot: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  for (let p = 0; p < 5; p++) {
    ctx.save();
    ctx.rotate((p * Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-size * 0.45, -size * 0.72, 0, -size);
    ctx.quadraticCurveTo(size * 0.45, -size * 0.72, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, Math.max(0.6, size * 0.22), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 244, 214, 0.95)';
  ctx.fill();
  ctx.restore();
}

/**
 * Dreamverse Kawaii Pastel Sakura Stylus & Watercolor Brush Trail
 * - Miniature illustrated pastel mechanical pencil / sakura marker whose precision
 *   nib aligns directly at the pointer hotspot `(x, y)`.
 * - Smooth quadratic-Bezier tapered watercolor brush stroke trail with soft rose,
 *   lavender, and warm cream-gold translucency plus subtle occasional blossom sparks.
 * - Switches cleanly to a distinct grab badge on `[data-cursor="grab"]`.
 * - Restores crisp native `text` I-beam over inputs & ProseMirror editors.
 * - Disabled on touch screens, viewports < 768px, and `prefers-reduced-motion`.
 */
export const DreamverseCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const markerRef = useRef<HTMLDivElement | null>(null);
  const nibGlowRef = useRef<HTMLDivElement | null>(null);
  const stylusSvgRef = useRef<SVGSVGElement | null>(null);
  const grabBadgeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fineMedia = window.matchMedia('(pointer: fine) and (hover: hover)');
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    const canActivate = () =>
      fineMedia.matches && !motionMedia.matches && window.innerWidth >= 768;

    let enabled = false;
    let rafId: number | null = null;
    let lastTs = performance.now();
    let lastSparkTs = 0;

    let px = -240;
    let py = -240;
    let gx = -240;
    let gy = -240;
    let lastTrailX = -240;
    let lastTrailY = -240;
    let glowScale = 1;
    let targetGlowScale = 1;
    let visible = false;
    let pressed = false;
    let state: CursorState = 'default';

    const trail: TrailPoint[] = [];
    const sparks: BlossomSpark[] = [];

    const syncStyles = () => {
      const showCustom = visible && state !== 'text' && state !== 'hidden';
      const marker = markerRef.current;
      const glow = nibGlowRef.current;
      const stylusSvg = stylusSvgRef.current;
      const grabSvg = grabBadgeRef.current;

      if (marker) {
        marker.dataset.state = state;
        marker.dataset.pressed = pressed ? 'true' : 'false';
        marker.style.opacity = showCustom ? '1' : '0';

        // Hotspot Alignment: nib point inside 32x32 SVG sits at (3, 3) from top-left
        const tiltDeg = state === 'pointer' ? -9 : state === 'grab' ? -4 : 0;
        const pressOffset = pressed ? 1.5 : 0;
        const pressScale = pressed ? 0.91 : state === 'pointer' ? 1.07 : 1;

        marker.style.transform = `translate3d(${px + pressOffset}px, ${py + pressOffset}px, 0) translate(-3px, -3px) rotate(${tiltDeg}deg) scale(${pressScale})`;
      }

      if (stylusSvg && grabSvg) {
        const isGrab = state === 'grab';
        stylusSvg.style.display = isGrab ? 'none' : 'block';
        grabSvg.style.display = isGrab ? 'block' : 'none';
      }

      if (glow) {
        glow.dataset.state = state;
        glow.style.opacity = showCustom ? (state === 'pointer' || pressed ? '0.95' : '0.58') : '0';
      }
    };

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawTrailAndSparks = (ctx: CanvasRenderingContext2D, isDark: boolean) => {
      if (trail.length > 1) {
        // Multi-stop watercolor palette tuned gently for dark & daylight environments
        const roseOuter = isDark ? 'rgba(244, 167, 193,' : 'rgba(218, 92, 138,';
        const lavCore = isDark ? 'rgba(198, 174, 245,' : 'rgba(148, 108, 210,';
        const goldTip = isDark ? 'rgba(248, 198, 128,' : 'rgba(232, 138, 164,';

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Render smoothed quadratic Bezier segments with tapered ink thickness
        for (let i = 1; i < trail.length; i++) {
          const prev = trail[i - 1];
          const curr = trail[i];
          const next = trail[Math.min(i + 1, trail.length - 1)];

          const midX0 = i === 1 ? prev.x : (prev.x + curr.x) * 0.5;
          const midY0 = i === 1 ? prev.y : (prev.y + curr.y) * 0.5;
          const midX1 = i === trail.length - 1 ? curr.x : (curr.x + next.x) * 0.5;
          const midY1 = i === trail.length - 1 ? curr.y : (curr.y + next.y) * 0.5;

          const t = i / Math.max(1, trail.length - 1); // 0 = oldest tail, 1 = active nib
          const life = Math.max(0, 1 - curr.age / curr.maxAge);
          const taper = Math.sin(Math.min(1, t * 0.85 + 0.15) * Math.PI * 0.88);
          const coreWidth = Math.max(0.75, curr.width * taper * (0.4 + 0.6 * life));

          // Pass 1: Soft watercolor outer wash glow
          ctx.beginPath();
          ctx.moveTo(midX0, midY0);
          ctx.quadraticCurveTo(curr.x, curr.y, midX1, midY1);
          ctx.strokeStyle =
            t > 0.65
              ? `${goldTip} ${(life * 0.18).toFixed(3)})`
              : `${roseOuter} ${(life * 0.15).toFixed(3)})`;
          ctx.lineWidth = coreWidth * 2.9;
          ctx.stroke();

          // Pass 2: Calligraphic translucent ink ribbon
          ctx.beginPath();
          ctx.moveTo(midX0, midY0);
          ctx.quadraticCurveTo(curr.x, curr.y, midX1, midY1);
          ctx.strokeStyle =
            t > 0.72
              ? `${goldTip} ${(life * 0.44).toFixed(3)})`
              : t > 0.32
                ? `${roseOuter} ${(life * 0.46).toFixed(3)})`
                : `${lavCore} ${(life * 0.36).toFixed(3)})`;
          ctx.lineWidth = coreWidth;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Render micro-blossom glint sparks spawned on curved motion
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        const life = Math.max(0, 1 - s.age / s.maxAge);
        const color =
          s.hue === 'sakura'
            ? isDark
              ? 'rgba(248, 184, 212, 0.92)'
              : 'rgba(218, 92, 138, 0.78)'
            : s.hue === 'lavender'
              ? isDark
                ? 'rgba(208, 188, 250, 0.88)'
                : 'rgba(136, 102, 204, 0.72)'
              : isDark
                ? 'rgba(248, 206, 138, 0.9)'
                : 'rgba(218, 146, 56, 0.74)';

        drawMiniBlossom(ctx, s.x, s.y, s.size * (0.7 + 0.3 * life), s.rot, color, life * 0.75);
      }
    };

    const tick = (now: number) => {
      if (!enabled) {
        rafId = null;
        return;
      }

      if (document.hidden) {
        lastTs = now;
        rafId = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min(34, now - lastTs);
      lastTs = now;

      gx += (px - gx) * 0.25;
      gy += (py - gy) * 0.25;
      glowScale += (targetGlowScale - glowScale) * 0.22;

      if (nibGlowRef.current) {
        const s = pressed ? glowScale * 0.84 : glowScale;
        nibGlowRef.current.style.transform = `translate3d(${gx}px, ${gy}px, 0) translate(-50%, -50%) scale(${s})`;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = trail.length - 1; i >= 0; i--) {
          trail[i].age += dt;
          if (trail[i].age >= trail[i].maxAge) {
            trail.splice(i, 1);
          }
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.age += dt;
          if (s.age >= s.maxAge) {
            sparks.splice(i, 1);
          } else {
            s.x += s.vx * (dt * 0.06);
            s.y += s.vy * (dt * 0.06);
            s.vy += 0.015 * (dt * 0.06);
            s.rot += s.vRot * (dt * 0.04);
          }
        }

        const isDark = document.documentElement.classList.contains('dark');
        drawTrailAndSparks(ctx, isDark);
      }

      if (
        trail.length > 0 ||
        sparks.length > 0 ||
        Math.abs(gx - px) > 0.2 ||
        Math.abs(gy - py) > 0.2
      ) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    };

    const ensureRunning = () => {
      if (enabled && rafId === null) {
        lastTs = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!enabled) return;
      px = e.clientX;
      py = e.clientY;
      visible = true;
      state = resolveCursorState(e.target);
      targetGlowScale = state === 'pointer' ? 1.45 : state === 'grab' ? 1.25 : 1;

      if (state === 'text' || state === 'hidden') {
        lastTrailX = px;
        lastTrailY = py;
      } else {
        const dx = px - lastTrailX;
        const dy = py - lastTrailY;
        const dist = Math.hypot(dx, dy);

        if (dist > 4.5 && dist < 240) {
          const clampedWidth = Math.min(4.8, Math.max(2.0, 4.6 - dist * 0.032));
          trail.push({
            x: px,
            y: py,
            age: 0,
            maxAge: 360,
            width: clampedWidth,
          });
          if (trail.length > 26) trail.shift();

          // Spawn restrained delicate 5-petal glint only on brisk sweeping strokes
          const now = performance.now();
          if (dist > 14 && now - lastSparkTs > 62 && sparks.length < 14) {
            lastSparkTs = now;
            const hues: BlossomSpark['hue'][] = ['sakura', 'lavender', 'gold'];
            sparks.push({
              x: px + (Math.random() - 0.5) * 6,
              y: py + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 0.65 - dx * 0.015,
              vy: (Math.random() - 0.5) * 0.5 - 0.25,
              rot: Math.random() * Math.PI * 2,
              vRot: (Math.random() - 0.5) * 0.09,
              size: 2.3 + Math.random() * 1.4,
              age: 0,
              maxAge: 420,
              hue: hues[Math.floor(Math.random() * hues.length)],
            });
          }

          lastTrailX = px;
          lastTrailY = py;
        } else if (dist >= 240) {
          lastTrailX = px;
          lastTrailY = py;
        }
      }

      syncStyles();
      ensureRunning();
    };

    const onMouseDown = () => {
      if (!enabled) return;
      pressed = true;
      syncStyles();
      ensureRunning();
    };

    const onMouseUp = () => {
      if (!enabled) return;
      pressed = false;
      syncStyles();
      ensureRunning();
    };

    const onMouseLeave = () => {
      visible = false;
      syncStyles();
    };

    const updateActivation = () => {
      const next = canActivate();
      if (next === enabled) return;
      enabled = next;
      if (enabled) {
        document.body.classList.add('sakura-cursor-active');
        resizeCanvas();
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mousedown', onMouseDown, { passive: true });
        window.addEventListener('mouseup', onMouseUp, { passive: true });
        document.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener('resize', resizeCanvas, { passive: true });
      } else {
        document.body.classList.remove('sakura-cursor-active');
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        trail.length = 0;
        sparks.length = 0;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mouseleave', onMouseLeave);
        window.removeEventListener('resize', resizeCanvas);
        visible = false;
        syncStyles();
      }
    };

    updateActivation();
    fineMedia.addEventListener('change', updateActivation);
    motionMedia.addEventListener('change', updateActivation);
    window.addEventListener('resize', updateActivation, { passive: true });

    return () => {
      enabled = false;
      document.body.classList.remove('sakura-cursor-active');
      if (rafId !== null) cancelAnimationFrame(rafId);
      fineMedia.removeEventListener('change', updateActivation);
      motionMedia.removeEventListener('change', updateActivation);
      window.removeEventListener('resize', updateActivation);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] hidden md:block select-none"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 block" />

      {/* Soft Pastel Watercolor Halo at Nib Contact */}
      <div
        ref={nibGlowRef}
        data-state="default"
        className="pointer-events-none fixed top-0 left-0 h-6 w-6 rounded-full bg-[radial-gradient(circle,rgba(244,167,193,0.42)_0%,rgba(181,156,226,0.18)_55%,transparent_75%)] dark:bg-[radial-gradient(circle,rgba(245,185,113,0.38)_0%,rgba(244,167,193,0.2)_55%,transparent_75%)] transition-opacity duration-150 will-change-transform"
        style={{ opacity: 0 }}
      />

      {/* Kawaii Pastel Sakura Mechanical Pencil / Brush Marker Container */}
      <div
        ref={markerRef}
        data-state="default"
        data-pressed="false"
        className="pointer-events-none fixed top-0 left-0 origin-[3px_3px] drop-shadow-[0_4px_10px_rgba(32,16,44,0.34)] transition-opacity duration-100 ease-out will-change-transform"
        style={{ opacity: 0 }}
      >
        {/* Mode 1 & 2: Miniature Kawaii Pastel Mechanical Pencil / Brush Marker */}
        <svg
          ref={stylusSvgRef}
          width="30"
          height="30"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bbMarkerBarrel" x1="8" y1="8" x2="26" y2="26" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FBE6F0" />
              <stop offset="48%" stopColor="#F4A7C1" />
              <stop offset="100%" stopColor="#B59CE2" />
            </linearGradient>
            <linearGradient id="bbMarkerGold" x1="16" y1="14" x2="22" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFE8B5" />
              <stop offset="100%" stopColor="#E69E45" />
            </linearGradient>
          </defs>

          {/* Outer Contrast Rim so marker pops in both light cloud sky & night garden */}
          <path
            d="M3 3 L10.2 5.4 L26.6 21.8 C27.8 23 27.8 25 26.6 26.2 L26.2 26.6 C25 27.8 23 27.8 21.8 26.6 L5.4 10.2 Z"
            fill="rgba(255,255,255,0.88)"
            stroke="rgba(51,31,36,0.52)"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />

          {/* Warm Cream Wood / Ivory Cone */}
          <path d="M3.2 3.2 L10.3 5.7 L5.7 10.3 Z" fill="#FFF7EE" />

          {/* Precision Rose-Sakura Nib Tip anchored right at (3, 3) */}
          <path d="M2.6 2.6 L6.2 4.1 L4.1 6.2 Z" fill="#C93B6B" />
          <circle cx="3.1" cy="3.1" r="1.15" fill="#F4A7C1" />

          {/* Pastel Sakura-to-Lavender Marker Barrel */}
          <path
            d="M10.2 5.6 L25.6 21 C26.6 22 26.6 23.6 25.6 24.6 L24.6 25.6 C23.6 26.6 22 26.6 21 25.6 L5.6 10.2 Z"
            fill="url(#bbMarkerBarrel)"
          />

          {/* Gloss Specular Reflection Strip along Barrel */}
          <path
            d="M10.6 7.1 L22.2 18.7"
            stroke="rgba(255,255,255,0.68)"
            strokeWidth="1.35"
            strokeLinecap="round"
          />

          {/* Champagne Gold Collar & Delicate Pocket Clip */}
          <path
            d="M17.4 12.8 L12.8 17.4 L14.1 18.7 L18.7 14.1 Z"
            fill="url(#bbMarkerGold)"
          />
          <path
            d="M18.4 14.8 L22.5 18.9"
            stroke="url(#bbMarkerGold)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Tiny 5-Petal Sakura Jewel Charm Cap */}
          <circle cx="24.5" cy="24.5" r="2.6" fill="#FFE6EF" stroke="#D15482" strokeWidth="0.7" />
          <circle cx="24.5" cy="24.5" r="0.95" fill="#F5B971" />
        </svg>

        {/* Mode 3: Distinct Kawaii Draggable / Grab Mode Emblem */}
        <svg
          ref={grabBadgeRef}
          width="30"
          height="30"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'none' }}
        >
          <circle
            cx="14"
            cy="14"
            r="9.5"
            fill="rgba(255, 248, 252, 0.9)"
            stroke="#B59CE2"
            strokeWidth="1.6"
          />
          {/* Subtle 4-way drag chevrons + central blossom dot */}
          <path
            d="M14 7.5 L12.2 9.5 M14 7.5 L15.8 9.5 M14 20.5 L12.2 18.5 M14 20.5 L15.8 18.5 M7.5 14 L9.5 12.2 M7.5 14 L9.5 15.8 M20.5 14 L18.5 12.2 M20.5 14 L18.5 15.8"
            stroke="#C93B6B"
            strokeWidth="1.55"
            strokeLinecap="round"
          />
          <circle cx="14" cy="14" r="2.2" fill="#F5B971" stroke="#C93B6B" strokeWidth="0.8" />
        </svg>
      </div>
    </div>
  );
};

export default DreamverseCursor;
