import type { Transition, Variants } from 'motion/react';

/**
 * BLACKBOOK BOTANICAL MOTION DESIGN SYSTEM
 *
 * Calibrated for flagship SaaS tactility, visual continuity, and distraction-free focus:
 * - Fast (120–160ms): tactile presses, hover states, tooltips, focus rings
 * - Standard (180–260ms): tabs, dropdowns, active row indicators, inputs
 * - Expressive (280–400ms): drawer choreography, dialogs, note canvas transitions
 * - Entrance (400–520ms): landing hero reveals, structured staggers
 */

export const MOTION_DURATION = {
  fast: 0.14,
  standard: 0.22,
  expressive: 0.34,
  entrance: 0.46,
} as const;

export const MOTION_EASE = {
  /** Architectural deceleration — silky finish with zero childish overshoot */
  botanical: [0.22, 1, 0.36, 1] as const,
  /** Crisp ink-nib response for micro tactile controls */
  tactile: [0.2, 0, 0, 1] as const,
  /** Smooth symmetric curve for color/opacity fades */
  silk: [0.4, 0, 0.2, 1] as const,
} as const;

export const MOTION_SPRING = {
  /** Shared layout indicators (tabs, sidebar pills, active notes) */
  indicator: {
    type: 'spring',
    stiffness: 460,
    damping: 36,
    mass: 0.85,
  } satisfies Transition,
  /** Workspace sidebars, AI panel, and layered surfaces */
  surface: {
    type: 'spring',
    stiffness: 340,
    damping: 32,
    mass: 0.95,
  } satisfies Transition,
  /** Subtle tactile snap back */
  tactile: {
    type: 'spring',
    stiffness: 520,
    damping: 34,
    mass: 0.7,
  } satisfies Transition,
} as const;

/** Coordinated page / surface fade & optical settle */
export const surfaceRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.expressive,
      ease: MOTION_EASE.botanical,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.tactile,
    },
  },
};

/** Note document canvas continuity transition (never touches inner text editing) */
export const noteCanvasVariants: Variants = {
  initial: {
    opacity: 0,
    y: 6,
    scale: 0.994,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: MOTION_DURATION.standard,
      ease: MOTION_EASE.botanical,
    },
  },
};

/** Staggered landing / section entrance container */
export const botanicalStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

/** Individual item in staggered botanical showcase */
export const botanicalStaggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.entrance,
      ease: MOTION_EASE.botanical,
    },
  },
};

/** Modal / Popover layered depth emergence */
export const floatingSurfaceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 6,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATION.standard,
      ease: MOTION_EASE.botanical,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: {
      duration: MOTION_DURATION.fast,
      ease: MOTION_EASE.tactile,
    },
  },
};
