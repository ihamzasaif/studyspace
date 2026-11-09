import React, { useState } from 'react';
import {
  registerWithUsername,
  loginWithUsername,
  loginWithGoogle,
  sanitizeUsername,
} from '../../firebase/authService';
import { useBackHandler } from '../../hooks/useBackHandler';
import { playSoftClick } from '../../utils/audio';
import { X, Lock, User, AtSign, Briefcase, School, AlertCircle, Loader2 } from 'lucide-react';
import { AppAccount } from '../../types';

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
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [institution, setInstitution] = useState('');
  const [avatarColor, setAvatarColor] = useState('#0d9488');

  useBackHandler(isOpen, onClose, 'auth-modal');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

        playSoftClick();
        if (onSuccess) onSuccess(acc);
        onClose();
      } else {
        const acc = await loginWithUsername(username, password);
        playSoftClick();
        if (onSuccess) onSuccess(acc);
        onClose();
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please check credentials.';
      if (msg.includes('auth/email-already-in-use')) {
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
    setLoading(true);
    try {
      const acc = await loginWithGoogle();
      playSoftClick();
      if (onSuccess) onSuccess(acc);
      onClose();
    } catch (err: unknown) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.');
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
                Real-time cloud sync across all your devices
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

        {/* Error Notification */}
        {error && (
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
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{mode === 'signup' ? 'Create Account & Sync' : 'Sign In to Study Room'}</span>
          </button>
        </form>

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
          className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
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
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline underline-offset-2"
          >
            Continue as Guest (Local Offline Mode)
          </button>
        </div>
      </div>
    </div>
  );
};
