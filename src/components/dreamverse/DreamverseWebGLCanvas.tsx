import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface DreamverseWebGLCanvasProps {
  isDark: boolean;
  density: 'landing' | 'workspace';
  reducedMotion: boolean;
}

interface PetalKinematics {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  vrx: number;
  vry: number;
  vrz: number;
  scale: number;
  phase: number;
  swayFreq: number;
}

interface FireflyKinematics {
  baseX: number;
  baseY: number;
  baseZ: number;
  speedY: number;
  phase: number;
  radius: number;
}

/**
 * Generates a sculptural 5-petal notched cherry blossom petal BufferGeometry
 * with realistic subtle curvature in 3D space.
 */
function createSakuraPetalGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.45);
  shape.bezierCurveTo(-0.36, -0.22, -0.44, 0.24, -0.15, 0.48);
  shape.bezierCurveTo(-0.04, 0.54, -0.01, 0.42, 0, 0.34);
  shape.bezierCurveTo(0.01, 0.42, 0.04, 0.54, 0.15, 0.48);
  shape.bezierCurveTo(0.44, 0.24, 0.36, -0.22, 0, -0.45);

  const geom = new THREE.ShapeGeometry(shape, 5);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    // Slight parabolic cup so light hits 3D petal naturally
    const cupZ = (px * px + py * py) * 0.28;
    pos.setZ(i, cupZ);
  }
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds an in-memory radial glow sprite texture for floating Yozakura lanterns / sunlight pollen motes.
 */
function createGlowSpriteTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.28, 'rgba(255, 232, 186, 0.85)');
    grad.addColorStop(0.65, 'rgba(244, 167, 193, 0.25)');
    grad.addColorStop(1, 'rgba(244, 167, 193, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Lazy-loaded Three.js 3D Dreamverse Layer.
 * - Renders instanced 3D curved sakura petals drifting through depth (`z` separation).
 * - Renders warm firefly / sunlit mote light particles rising slowly around the scene.
 * - Camera tracks pointer subtly with smooth damping (no jitter, no re-renders).
 * - Pauses automatically on hidden tab (`visibilitychange`), skips loop under reduced motion,
 *   falls back cleanly if WebGL is unavailable, and disposes every GPU resource on unmount.
 */
const DreamverseWebGLCanvas: React.FC<DreamverseWebGLCanvasProps> = ({
  isDark,
  density,
  reducedMotion,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch {
      return;
    }

    const activeRenderer = renderer;
    activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    activeRenderer.setSize(window.innerWidth, window.innerHeight);
    activeRenderer.setClearColor(0x000000, 0);
    activeRenderer.domElement.style.display = 'block';
    activeRenderer.domElement.style.width = '100%';
    activeRenderer.domElement.style.height = '100%';
    container.appendChild(activeRenderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / Math.max(window.innerHeight, 1),
      0.1,
      40
    );
    camera.position.set(0, 0, 12);

    // Subtle Dreamverse lighting so instanced 3D petals shimmer naturally
    const ambientLight = new THREE.AmbientLight(0xfff1f5, 0.9);
    const keyLight = new THREE.DirectionalLight(0xffe0c2, 1.15);
    keyLight.position.set(5, 8, 9);
    const rimLight = new THREE.DirectionalLight(0xc7aef6, 0.65);
    rimLight.position.set(-6, -3, 4);
    scene.add(ambientLight, keyLight, rimLight);

    // ── 1. Instanced 3D Sakura Petals ──
    const isCompactViewport = window.innerWidth < 768;
    const petalCount =
      density === 'landing' ? (isCompactViewport ? 32 : 68) : isCompactViewport ? 14 : 26;

    const petalGeometry = createSakuraPetalGeometry();
    const petalMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: density === 'landing' ? 0.88 : 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const petalMesh = new THREE.InstancedMesh(petalGeometry, petalMaterial, petalCount);
    const petals: PetalKinematics[] = [];
    const dummy = new THREE.Object3D();

    const lightPalette = [
      new THREE.Color('#FAD2DF'),
      new THREE.Color('#FFF5F8'),
      new THREE.Color('#F4A7C1'),
      new THREE.Color('#E3D8FA'),
    ];
    const darkPalette = [
      new THREE.Color('#F6ACC6'),
      new THREE.Color('#E7C6FA'),
      new THREE.Color('#FFDCE8'),
      new THREE.Color('#F5B971').lerp(new THREE.Color('#F6ACC6'), 0.72),
    ];

    const spreadX = 18;
    const spreadY = 11;

    for (let i = 0; i < petalCount; i++) {
      const k: PetalKinematics = {
        x: (Math.random() - 0.5) * spreadX,
        y: (Math.random() - 0.5) * spreadY,
        z: -4.5 + Math.random() * 8.5,
        vx: 0.008 + Math.random() * 0.014,
        vy: -(0.012 + Math.random() * 0.016),
        vz: (Math.random() - 0.5) * 0.004,
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,
        vrx: 0.008 + Math.random() * 0.014,
        vry: 0.01 + Math.random() * 0.018,
        vrz: (Math.random() - 0.5) * 0.012,
        scale: 0.14 + (i % 5) * 0.036,
        phase: Math.random() * Math.PI * 2,
        swayFreq: 0.015 + Math.random() * 0.018,
      };
      petals.push(k);
      dummy.position.set(k.x, k.y, k.z);
      dummy.rotation.set(k.rx, k.ry, k.rz);
      dummy.scale.setScalar(k.scale);
      dummy.updateMatrix();
      petalMesh.setMatrixAt(i, dummy.matrix);
      petalMesh.setColorAt(
        i,
        (isDarkRef.current ? darkPalette : lightPalette)[i % lightPalette.length]
      );
    }
    petalMesh.instanceMatrix.needsUpdate = true;
    if (petalMesh.instanceColor) petalMesh.instanceColor.needsUpdate = true;
    scene.add(petalMesh);

    // ── 2. 3D Spirit Fireflies & Sunlight Motes ──
    const fireflyCount = density === 'landing' ? (isCompactViewport ? 22 : 44) : 16;
    const fireflies: FireflyKinematics[] = [];
    const fireflyPositions = new Float32Array(fireflyCount * 3);

    for (let i = 0; i < fireflyCount; i++) {
      const ff: FireflyKinematics = {
        baseX: (Math.random() - 0.5) * 17,
        baseY: (Math.random() - 0.5) * 10,
        baseZ: -3 + Math.random() * 6.5,
        speedY: 0.006 + Math.random() * 0.01,
        phase: Math.random() * Math.PI * 2,
        radius: 0.25 + Math.random() * 0.55,
      };
      fireflies.push(ff);
      fireflyPositions[i * 3] = ff.baseX;
      fireflyPositions[i * 3 + 1] = ff.baseY;
      fireflyPositions[i * 3 + 2] = ff.baseZ;
    }

    const fireflyGeometry = new THREE.BufferGeometry();
    fireflyGeometry.setAttribute('position', new THREE.BufferAttribute(fireflyPositions, 3));
    const spriteTex = createGlowSpriteTexture();
    const fireflyMaterial = new THREE.PointsMaterial({
      size: density === 'landing' ? 0.34 : 0.24,
      map: spriteTex,
      transparent: true,
      opacity: isDarkRef.current ? 0.78 : 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: isDarkRef.current ? 0xf5b971 : 0xffe9ba,
    });
    const fireflyPoints = new THREE.Points(fireflyGeometry, fireflyMaterial);
    scene.add(fireflyPoints);

    // Camera pointer parallax targets
    const pointer = { tx: 0, ty: 0, cx: 0, cy: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return;
      pointer.tx = ((e.clientX / Math.max(window.innerWidth, 1)) - 0.5) * 0.7;
      pointer.ty = -((e.clientY / Math.max(window.innerHeight, 1)) - 0.5) * 0.42;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!activeRenderer) return;
      const w = window.innerWidth;
      const h = Math.max(window.innerHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      activeRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      activeRenderer.setSize(w, h);
      if (reducedMotion) {
        activeRenderer.render(scene, camera);
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Theme recolor sync without tearing down GPU buffers
    let lastDark = isDarkRef.current;
    const syncThemeColors = () => {
      const dark = isDarkRef.current;
      if (dark === lastDark) return;
      lastDark = dark;
      const pal = dark ? darkPalette : lightPalette;
      for (let i = 0; i < petalCount; i++) {
        petalMesh.setColorAt(i, pal[i % pal.length]);
      }
      if (petalMesh.instanceColor) petalMesh.instanceColor.needsUpdate = true;
      fireflyMaterial.color.setHex(dark ? 0xf5b971 : 0xffe9ba);
      fireflyMaterial.opacity = dark ? (density === 'landing' ? 0.8 : 0.45) : 0.42;
      ambientLight.color.setHex(dark ? 0xd9c2f5 : 0xfff1f5);
      keyLight.intensity = dark ? 0.85 : 1.15;
    };

    // Single static demand render for reduced motion users
    if (reducedMotion) {
      activeRenderer.render(scene, camera);
    }

    let rafId = 0;
    let time = 0;

    const animate = () => {
      if (reducedMotion) return;
      if (document.hidden) {
        rafId = 0;
        return;
      }

      syncThemeColors();
      time += 0.016;

      // Damped camera parallax
      pointer.cx += (pointer.tx - pointer.cx) * 0.04;
      pointer.cy += (pointer.ty - pointer.cy) * 0.04;
      camera.position.x = pointer.cx;
      camera.position.y = pointer.cy;
      camera.lookAt(0, 0, 0);

      // Update 3D petals
      for (let i = 0; i < petalCount; i++) {
        const p = petals[i];
        p.phase += p.swayFreq;
        p.x += p.vx + Math.sin(p.phase) * 0.008;
        p.y += p.vy;
        p.z += p.vz;
        p.rx += p.vrx;
        p.ry += p.vry;
        p.rz += p.vrz;

        if (p.y < -spreadY / 2 - 1) {
          p.y = spreadY / 2 + 1;
          p.x = (Math.random() - 0.5) * spreadX;
        }
        if (p.x > spreadX / 2 + 1) {
          p.x = -spreadX / 2 - 1;
        }

        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(p.rx, p.ry, p.rz);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        petalMesh.setMatrixAt(i, dummy.matrix);
      }
      petalMesh.instanceMatrix.needsUpdate = true;

      // Update floating lantern fireflies
      const attr = fireflyGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < fireflyCount; i++) {
        const ff = fireflies[i];
        ff.baseY += ff.speedY;
        if (ff.baseY > spreadY / 2 + 0.5) {
          ff.baseY = -spreadY / 2 - 0.5;
        }
        attr.setXYZ(
          i,
          ff.baseX + Math.sin(time * 0.9 + ff.phase) * ff.radius,
          ff.baseY,
          ff.baseZ + Math.cos(time * 0.7 + ff.phase) * ff.radius * 0.5
        );
      }
      attr.needsUpdate = true;

      activeRenderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };

    const handleVisibilityChange = () => {
      if (reducedMotion) return;
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!reducedMotion && !document.hidden) {
      rafId = requestAnimationFrame(animate);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      petalGeometry.dispose();
      petalMaterial.dispose();
      fireflyGeometry.dispose();
      fireflyMaterial.dispose();
      spriteTex.dispose();
      activeRenderer.dispose();

      if (activeRenderer.domElement.parentNode === container) {
        container.removeChild(activeRenderer.domElement);
      }
    };
  }, [density, reducedMotion]);

  // Also re-trigger static paint on theme toggle when reducedMotion is active
  useEffect(() => {
    if (!reducedMotion) return;
    window.dispatchEvent(new Event('resize'));
  }, [isDark, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[2]"
      aria-hidden="true"
    />
  );
};

export default DreamverseWebGLCanvas;
