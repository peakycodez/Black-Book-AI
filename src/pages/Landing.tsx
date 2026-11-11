import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  GitBranch,
  Lock,
  Mail,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import {
  DreamverseBlossom,
  DreamverseCard,
  DreamverseDivider,
  DreamverseMicroLoader,
  DreamverseSeal,
  WritingCompanionsVignette,
} from '@/components/dreamverse';
import {
  botanicalStaggerContainer,
  botanicalStaggerItem,
  MOTION_EASE,
  MOTION_SPRING,
} from '@/lib/motion';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loginAsGuest, signUp, signIn, resendVerification } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );

  useEffect(() => {
    if (user) {
      navigate('/workspace');
    }
  }, [user, navigate]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof document !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem('blackbook-theme', next ? 'dark' : 'light');
      } catch {
        // Ignore storage errors
      }
    }
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { needsVerification } = await signUp(email, password);
        if (needsVerification) {
          setShowVerification(true);
          toast.success('Verification email sent. Please check your inbox.');
        } else {
          toast.success('Account created successfully.');
          navigate('/workspace');
        }
      } else {
        await signIn(email, password);
        toast.success('Welcome back to BlackBook.');
        navigate('/workspace');
      }
    } catch (error) {
      if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes('Email not confirmed')) {
          setShowVerification(true);
          toast.info('Please verify your email to continue');
        } else if (msg.includes('Invalid login credentials')) {
          toast.error('Incorrect email or password. Please try again.');
        } else if (
          msg.toLowerCase().includes('email') &&
          msg.toLowerCase().includes('invalid')
        ) {
          toast.error('This email address is not valid. Please use a real email address.');
        } else if (msg.includes('User already registered')) {
          toast.error('An account with this email already exists. Please sign in instead.');
          setIsSignUp(false);
        } else if (msg.includes('Password should be')) {
          toast.error(msg);
        } else if (msg.includes('rate limit') || msg.includes('too many')) {
          toast.error('Too many attempts. Please wait a moment and try again.');
        } else {
          toast.error(msg || 'Something went wrong. Please try again.');
        }
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/workspace');
  };

  const handleResendVerification = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      await resendVerification(email);
      toast.success('Verification email sent.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : '';
      toast.error(msg || 'Could not resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // ── Verification Pavilion Gate ──
  if (showVerification) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6" dir="ltr">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.36, ease: MOTION_EASE.botanical }}
          className="w-full max-w-md"
        >
          <DreamverseCard elevated className="overflow-hidden p-7 sm:p-8 text-center">
            <div className="mx-auto mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-[#F5B971] via-primary to-[#B59CE2]" />
            <div className="space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/[0.08] shadow-botanical">
                <DreamverseSeal size={36} />
              </div>

              <div className="space-y-2">
                <div className="botanical-badge mx-auto">
                  <Mail className="h-3 w-3" />
                  <span>Verification Dispatched</span>
                </div>
                <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                  Confirm your email address
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  A verification link was sent to{' '}
                  <strong className="font-semibold text-foreground">{email}</strong>. Follow
                  the link to sign in to your BlackBook workspace.
                </p>
              </div>

              <DreamverseDivider />

              <div className="space-y-2.5">
                <Button
                  variant="outline"
                  className="w-full h-10"
                  onClick={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending ? (
                    <DreamverseMicroLoader size={15} />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span>Resend verification email</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-10 text-muted-foreground"
                  onClick={() => {
                    setShowVerification(false);
                    setIsSignUp(false);
                  }}
                >
                  Return to Sign In
                </Button>
              </div>
            </div>
          </DreamverseCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen flex-col justify-between overflow-x-hidden px-4 py-5 sm:px-8 sm:py-6 lg:px-12"
      dir="ltr"
    >
      {/* ── Top Pavilion Crest Navigation ── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: MOTION_EASE.botanical }}
        className="glass-lavender mx-auto flex w-full max-w-6xl items-center justify-between gap-2 rounded-2xl px-3 sm:px-4 py-2.5"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-card/55 backdrop-blur-md shadow-xs">
            <DreamverseSeal size={24} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-heading text-base sm:text-lg font-bold tracking-tight text-foreground leading-none">
              BlackBook
            </span>
            <span className="mt-1 truncate text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.06em] sm:tracking-[0.14em] text-muted-foreground">
              <span className="sm:hidden">Workspace</span>
              <span className="hidden sm:inline">Where Ideas Become Knowledge</span>
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          className="shrink-0 gap-1.5 sm:gap-2 rounded-full px-3 sm:px-4 text-[11px] sm:text-xs font-medium"
        >
          {isDark ? (
            <>
              <Sun className="h-3.5 w-3.5 text-[#F5B971]" />
              <span>Daylight Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-primary" />
              <span>Night Mode</span>
            </>
          )}
        </Button>
      </motion.header>

      {/* ── Main Courtyard Entrance Grid ── */}
      <main className="mx-auto my-auto flex w-full max-w-6xl flex-col gap-7 py-6 lg:py-8">
        <div className="grid grid-cols-1 items-center gap-7 lg:grid-cols-12 lg:gap-9">
          {/* Hero Workspace Overview (7 Columns) */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, ease: MOTION_EASE.botanical }}
            className="flex flex-col gap-5 lg:col-span-7"
          >
            {/* Luxury Sakura Glass Hero Card */}
            <DreamverseCard material="sakura" spotlight className="overflow-hidden p-5 sm:p-7">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="botanical-badge">
                    <DreamverseBlossom size={12} className="text-primary" />
                    <span>Knowledge Workspace</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F5B971] shadow-[0_0_8px_#F5B971]" />
                    <span>Notes · Links · AI Brain</span>
                  </span>
                </div>

                <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[3.1rem] lg:leading-[1.08]">
                  Where ideas{' '}
                  <span className="botanical-accent-text">become knowledge.</span>
                </h1>

                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Write connected notes, attach rich inline knowledge popovers, and uncover related
                  notes or missing concepts with AI Brain in a focused workspace.
                </p>

                {/* Craft Capability Seals */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/45 dark:border-white/15 bg-card/45 backdrop-blur-md px-3 py-1 text-xs font-medium text-foreground/90">
                    <GitBranch className="h-3.5 w-3.5 text-primary" />
                    Bidirectional Links
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/45 dark:border-white/15 bg-card/45 backdrop-blur-md px-3 py-1 text-xs font-medium text-foreground/90">
                    <Sparkles className="h-3.5 w-3.5 text-[#DFA02B] dark:text-[#F5B971]" />
                    AI Brain
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/45 dark:border-white/15 bg-card/45 backdrop-blur-md px-3 py-1 text-xs font-medium text-foreground/90">
                    <Lock className="h-3.5 w-3.5 text-[#429472] dark:text-[#78BFA6]" />
                    Local-First Storage
                  </span>
                </div>
              </div>

              {/* Art-Directed Workspace Preview Window */}
              <div className="mt-5 rounded-2xl border border-white/45 dark:border-white/15 bg-card/35 backdrop-blur-md p-2.5 sm:p-3 shadow-inner">
                <div className="mb-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-foreground/85">
                    <Compass className="h-3.5 w-3.5 text-primary" />
                    <span>Focused Study Environment</span>
                  </div>
                  <span className="font-mono text-[10px] tracking-wide text-muted-foreground">
                    Write · Link · Synthesize
                  </span>
                </div>
                <WritingCompanionsVignette
                  eager
                  className="aspect-[16/9] w-full rounded-xl"
                />
              </div>
            </DreamverseCard>
          </motion.section>

          {/* Pearl Glass Authentication Panel (5 Columns) */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.46, delay: 0.08, ease: MOTION_EASE.botanical }}
            className="lg:col-span-5"
          >
            <DreamverseCard elevated material="pearl" spotlight className="overflow-hidden p-0">
              {/* Top Luminous Header Band */}
              <div className="relative border-b border-white/40 dark:border-white/12 bg-gradient-to-r from-primary/[0.12] via-[#B59CE2]/[0.12] to-[#F5B971]/[0.12] px-6 py-3.5 sm:px-7">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <DreamverseSeal size={22} />
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/90">
                      Account Access
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#F5B971] shadow-[0_0_8px_#F5B971]" />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Cloud &amp; Guest Ready
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-7">
                {/* Segmented Auth Mode Switcher with Shared layoutId Pill */}
                <div
                  role="tablist"
                  aria-label="Authentication mode"
                  className="relative mb-5 grid grid-cols-2 rounded-xl border border-white/45 dark:border-white/15 bg-card/35 backdrop-blur-md p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isSignUp}
                    onClick={() => setIsSignUp(false)}
                    className="relative z-10 rounded-lg py-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    {!isSignUp && (
                      <motion.span
                        layoutId="landing-auth-tab"
                        transition={MOTION_SPRING.tactile}
                        className="absolute inset-0 rounded-lg bg-card/85 shadow-sm border border-primary/25 backdrop-blur-md"
                      />
                    )}
                    <span
                      className={`relative z-10 ${
                        !isSignUp ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Sign In
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={isSignUp}
                    onClick={() => setIsSignUp(true)}
                    className="relative z-10 rounded-lg py-2 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    {isSignUp && (
                      <motion.span
                        layoutId="landing-auth-tab"
                        transition={MOTION_SPRING.tactile}
                        className="absolute inset-0 rounded-lg bg-card/85 shadow-sm border border-primary/25 backdrop-blur-md"
                      />
                    )}
                    <span
                      className={`relative z-10 ${
                        isSignUp ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Create Account
                    </span>
                  </button>
                </div>

                <div className="mb-5 space-y-1">
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    {isSignUp ? 'Create your workspace' : 'Welcome back'}
                  </h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {isSignUp
                      ? 'Create an account to synchronize your notes across every device.'
                      : 'Sign in with your email to open your synchronized notes.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-foreground/90">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="ltr-input h-10 pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-foreground/90">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={6}
                        className="ltr-input h-10 pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isSignUp && (
                      <motion.div
                        key="confirm-password-group"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: MOTION_EASE.botanical }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5 pt-0.5">
                          <Label
                            htmlFor="confirmPassword"
                            className="text-xs font-semibold text-foreground/90"
                          >
                            Confirm password
                          </Label>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Re-enter your password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required={isSignUp}
                              disabled={isLoading}
                              minLength={6}
                              className="ltr-input h-10 pl-9 text-sm"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    type="submit"
                    disabled={isLoading || (!!email && !validateEmail(email))}
                    className="group mt-1 h-11 w-full font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <DreamverseMicroLoader size={16} />
                        <span>{isSignUp ? 'Creating Account…' : 'Signing In…'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <DreamverseDivider className="flex-1" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Or Try Without Account
                  </span>
                  <DreamverseDivider className="flex-1" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                  className="group h-11 w-full justify-between px-4 font-medium"
                >
                  <span className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 text-primary transition-transform duration-200 group-hover:scale-105" />
                    <span>Continue as Guest</span>
                  </span>
                  <span className="rounded-md border border-white/40 dark:border-white/15 bg-card/55 px-2 py-0.5 text-[11px] text-muted-foreground">
                    Local storage
                  </span>
                </Button>
              </div>
            </DreamverseCard>
          </motion.section>
        </div>

        {/* ── Three Product Capability Cards ── */}
        <motion.section
          variants={botanicalStaggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5"
        >
          <motion.div variants={botanicalStaggerItem}>
            <DreamverseCard material="sakura" spotlight tilt className="h-full p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/[0.12] text-primary">
                <GitBranch className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Bidirectional Knowledge Links
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Link related insights directly within your text and inspect floating reference
                cards without breaking focus.
              </p>
            </DreamverseCard>
          </motion.div>

          <motion.div variants={botanicalStaggerItem}>
            <DreamverseCard material="lavender" spotlight tilt className="h-full p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#B59CE2]/40 bg-[#B59CE2]/15 text-[#8267B8] dark:text-[#D8BAFA]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground">
                AI Brain
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Discover related notes, detect missing knowledge gaps, and convert notes into
                summaries or study guides right beside your draft.
              </p>
            </DreamverseCard>
          </motion.div>

          <motion.div variants={botanicalStaggerItem}>
            <DreamverseCard material="pearl" spotlight tilt className="h-full p-5">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#429472]/35 bg-[#429472]/12 text-[#3B7D63] dark:text-[#78BFA6]">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground">
                Local-First &amp; Cloud Sync
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Write offline in Guest Mode immediately, share single notes effortlessly, or sync
                every folder across sessions.
              </p>
            </DreamverseCard>
          </motion.div>
        </motion.section>
      </main>

      {/* ── Compact Footer ── */}
      <footer className="glass-lavender mx-auto flex w-full max-w-6xl items-center justify-between rounded-xl px-4 py-2.5 text-[11px] text-muted-foreground">
        <span>BlackBook · Where ideas become knowledge</span>
        <span className="hidden sm:inline">Connected Notes &amp; AI Workspace</span>
      </footer>
    </div>
  );
}
