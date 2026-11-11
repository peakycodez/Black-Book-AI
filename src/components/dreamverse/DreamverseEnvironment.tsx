import React, { Component, Suspense, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsDarkTheme } from '@/hooks/useIsDarkTheme';

const DreamverseWebGLCanvas = React.lazy(() => import('./DreamverseWebGLCanvas'));

class WebGLSafeBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * SAKURA DREAMVERSE ENVIRONMENTAL WORLDSTAGE
 *
 * Layered 2.5D/3D visual atmosphere:
 * - Layer 0: Art-directed Daylight Sakura Sanctuary & Yozakura Night Garden paintings
 *            with silky crossfade and damped mouse parallax depth separation.
 * - Layer 1: Calibrated atmospheric mist & lantern illumination veil (stronger clarity
 *            around quiet workspace manuscripts, richer vista on Landing/404).
 * - Layer 2: Lazy-loaded Three.js 3D curved blossoms + floating lantern firefly motes
 *            (with visibility pause, WebGL fallback, and reduced-motion compliance).
 */
export const DreamverseEnvironment: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  const isDark = useIsDarkTheme();
  const location = useLocation();
  const isLandingOrVista =
    location.pathname === '/' ||
    location.pathname === '' ||
    location.pathname.startsWith('/share');

  const backdropRef = useRef<HTMLDivElement | null>(null);
  const mistRef = useRef<HTMLDivElement | null>(null);

  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Subtle hardware-accelerated 2.5D parallax separation on pointer movement
  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let rafId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      tx = (e.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      ty = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
    };

    const tick = () => {
      if (document.hidden) {
        rafId = 0;
        return;
      }
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;

      if (backdropRef.current) {
        const bx = (-cx * 10).toFixed(2);
        const by = (-cy * 7).toFixed(2);
        backdropRef.current.style.transform = `translate3d(${bx}px, ${by}px, 0) scale(1.045)`;
      }
      if (mistRef.current) {
        const mx = (cx * 16).toFixed(2);
        const my = (cy * 10).toFixed(2);
        mistRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      }
      rafId = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      } else if (!document.hidden && !rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reducedMotion]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none select-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* ── Layer 0: Base Horizon Tint + Cohesive Daylight/Yozakura World Paintings ── */}
      <div
        ref={backdropRef}
        className="absolute inset-0 will-change-transform"
        style={{ transform: 'scale(1.045)' }}
      >
        <img
          src="/images/dreamverse/sakura-daylight-sanctuary.jpg"
          alt=""
          loading="eager"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
        />
        <img
          src="/images/dreamverse/yozakura-night-garden.jpg"
          alt=""
          loading="eager"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-out ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* ── Layer 1: Calibrated Atmospheric Contrast Veil & Soft Sun/Moon Glows ── */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isLandingOrVista
            ? isDark
              ? 'bg-gradient-to-b from-[#130E22]/28 via-[#18122B]/14 to-[#120D1F]/38'
              : 'bg-gradient-to-b from-[#FAF5EE]/30 via-[#FAF5EE]/14 to-[#F5ECF2]/34'
            : isDark
              ? 'bg-[#141022]/30'
              : 'bg-[#FAF5EE]/28'
        }`}
      />

      {/* Atmospheric Horizon Depth Mist Layer */}
      <div ref={mistRef} className="absolute inset-0 will-change-transform">
        <div
          className="absolute -top-32 left-1/4 h-[34rem] w-[54rem] rounded-full blur-[110px] transition-opacity duration-700"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(216,186,250,0.16) 0%, rgba(239,149,180,0.08) 45%, transparent 72%)'
              : 'radial-gradient(circle, rgba(255,244,228,0.45) 0%, rgba(244,167,193,0.16) 48%, transparent 72%)',
          }}
        />
        <div
          className="absolute bottom-[-8rem] right-[-6%] h-[28rem] w-[42rem] rounded-full blur-[100px] transition-opacity duration-700"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(245,185,113,0.12) 0%, rgba(181,156,226,0.08) 50%, transparent 72%)'
              : 'radial-gradient(circle, rgba(195,225,245,0.34) 0%, rgba(235,214,245,0.2) 50%, transparent 72%)',
          }}
        />
      </div>

      {/* ── Layer 2: Lazy-loaded Three.js 3D Volumetric Petals & Lantern Spirit Motes ── */}
      <WebGLSafeBoundary>
        <Suspense fallback={null}>
          <DreamverseWebGLCanvas
            isDark={isDark}
            density={isLandingOrVista ? 'landing' : 'workspace'}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </WebGLSafeBoundary>
    </div>
  );
};

export default DreamverseEnvironment;
