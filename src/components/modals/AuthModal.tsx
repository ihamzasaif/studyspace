import React, { useState } from 'react';
import {
  registerWithUsername,
  loginWithUsername,
  loginWithGoogle,
  sanitizeUsername,
  createInstantAccount,
} from '../../firebase/authService';
import { useBackHandler } from '../../hooks/useBackHandler';
import { playSoftClick } from '../../utils/audio';
import {
  X,
  Lock,
  User,
  AtSign,
  Briefcase,
  School,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { AppAccount } from '../../types';

import { useStudy } from '../../context/StudyContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (account: AppAccount) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup',
}) => {
  const { updateProfile } = useStudy();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [institution, setInstitution] = useState('');
  const [avatarColor, setAvatarColor] = useState('#0d9488');

  useBackHandler(isOpen, onClose, 'auth-modal');

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyDomain = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  const handleCreateInstantFallback = () => {
    const cleanUser = sanitizeUsername(username) || `student_${Date.now().toString().slice(-4)}`;
    const acc = createInstantAccount({
      username: cleanUser,
      name: name.trim() || 'Learner',
      password,
      profession: profession.trim(),
      institution: institution.trim(),
      avatarColor,
    });
    updateProfile({
      name: acc.displayName,
      profession: acc.profession,
      institution: acc.institution,
      avatarColor: acc.avatarColor,
    });
    playSoftClick();
    if (onSuccess) onSuccess(acc);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnauthorizedDomain(false);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const cleanUser = sanitizeUsername(username);
        if (!cleanUser || cleanUser.length < 3) {
          throw new Error('Username must be at least 3 letters (alphanumeric).');
        }
        if (!password || password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }

        const acc = await registerWithUsername({
          username: cleanUser,
          password,
          name: name.trim(),
          profession: profession.trim(),
          institution: institution.trim(),
          avatarColor,
        });

        updateProfile({
          name: acc.displayName || name.trim(),
          profession: acc.profession || profession.trim(),
          institution: acc.institution || institution.trim(),
          avatarColor: acc.avatarColor || avatarColor,
        });

        playSoftClick();
        if (onSuccess) onSuccess(acc);
        onClose();
      } else {
        const acc = await loginWithUsername(username, password);
        updateProfile({
          name: acc.displayName,
          profession: acc.profession,
          institution: acc.institution,
          avatarColor: acc.avatarColor,
        });
        playSoftClick();
        if (onSuccess) onSuccess(acc);
        onClose();
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      if (msg.includes('auth/unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
        setError('Firebase: Current domain is not in Authorized Domains for Google login.');
      } else if (msg.includes('auth/operation-not-allowed')) {
        // Automatically activate instant account so user is never blocked by disabled email provider
        const cleanUser = sanitizeUsername(username) || `student_${Date.now().toString().slice(-4)}`;
        const fallbackAcc = createInstantAccount({
          username: cleanUser,
          name: name.trim() || 'Learner',
          password,
          profession: profession.trim(),
          institution: institution.trim(),
          avatarColor,
        });
        updateProfile({
          name: fallbackAcc.displayName,
          profession: fallbackAcc.profession,
          institution: fallbackAcc.institution,
          avatarColor: fallbackAcc.avatarColor,
        });
        playSoftClick();
        if (onSuccess) onSuccess(fallbackAcc);
        onClose();
        return;
      } else if (msg.includes('auth/email-already-in-use')) {
        setError('This username is already taken. Please pick another one.');
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setError('Incorrect username or password. Please try again.');
      } else if (msg.includes('auth/user-not-found')) {
        setError('No account found with this username. Please register first.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsUnauthorizedDomain(false);
    setLoading(true);
    try {
      const acc = await loginWithGoogle();
      updateProfile({
        name: acc.displayName,
        profession: acc.profession,
        institution: acc.institution,
        avatarColor: acc.avatarColor,
      });
      playSoftClick();
      if (onSuccess) onSuccess(acc);
      onClose();
    } catch (err: unknown) {
      console.error('Google login error:', err);
      const msg = err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.';
      if (msg.includes('auth/unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
        setError('Firebase unauthorized domain: Google OAuth requires adding this domain to Firebase Authorized Domains.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xl space-y-5 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              S
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {mode === 'signup' ? 'Create Study Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Real-time study sync & backup across all devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Sign in vs Register) */}
        <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
              setIsUnauthorizedDomain(false);
            }}
            className={`flex-1 py-2 rounded-lg transition-colors text-center ${
              mode === 'signup'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
              setIsUnauthorizedDomain(false);
            }}
            className={`flex-1 py-2 rounded-lg transition-colors text-center ${
              mode === 'signin'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Dedicated Authorized Domain Notice & 1-Click Fix */}
        {isUnauthorizedDomain && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 text-xs space-y-2.5">
            <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs text-amber-950 dark:text-amber-100">
                  Domain Authorization Required for Google Login
                </p>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                  Firebase blocks Google Sign-In popups until your preview domain is added to Firebase Authorized Domains.
                </p>
              </div>
            </div>

            {/* Current domain copy box */}
            <div className="flex items-center gap-2 p-2 bg-white/90 dark:bg-neutral-900/90 rounded-xl border border-amber-200 dark:border-neutral-700">
              <span className="flex-1 font-mono text-[11px] text-neutral-700 dark:text-neutral-300 truncate">
                {currentHost}
              </span>
              <button
                type="button"
                onClick={handleCopyDomain}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg text-[11px] font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1 transition-colors"
              >
                {copiedDomain ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDomain ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <a
                href="https://console.firebase.google.com/project/gen-lang-client-0214233798/authentication/settings"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline flex items-center gap-1"
              >
                <span>Open Firebase Settings</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={handleCreateInstantFallback}
                className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold shadow-xs flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                <span>Instant Account (Skip Domain)</span>
              </button>
            </div>
          </div>
        )}

        {/* Regular Error Notification */}
        {error && !isUnauthorizedDomain && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span className="break-words leading-relaxed">{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Full Name <span className="text-teal-600">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Hamza Saif"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Username <span className="text-teal-600">*</span>
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder={mode === 'signup' ? 'e.g. hamza_saif' : 'Username or email'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {mode === 'signup' && (
              <p className="text-[11px] text-neutral-400 mt-1">
                Use letters, numbers, or underscores (minimum 3 characters).
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Password <span className="text-teal-600">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Profession / Field
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. CA / CS"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      className="w-full pl-9 pr-2.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Institution
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. ICAP / Uni"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full pl-9 pr-2.5 py-2 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar color selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Avatar Theme Color
                </label>
                <div className="flex items-center gap-2">
                  {['#0d9488', '#4f46e5', '#2563eb', '#9333ea', '#e11d48', '#d97706'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        avatarColor === c ? 'scale-125 ring-2 ring-offset-2 ring-teal-500' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === 'signup' ? 'Create Account & Start' : 'Sign In to Study Room'}</span>
          </button>
        </form>

        {/* Instant Study Account 1-Click option */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleCreateInstantFallback}
            className="w-full py-2 px-3 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100/60 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Create Instant Account without Google / Cloud setup</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
          <span className="bg-white dark:bg-[#1A1D23] px-3 text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
            Or
          </span>
        </div>

        {/* 1-Click Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer Note */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline underline-offset-2 cursor-pointer"
          >
            Continue as Guest (Local Offline Mode)
          </button>
        </div>
      </div>
    </div>
  );
};
