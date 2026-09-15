import React, { useState } from 'react';
import { UserAccount, createAccount, loginUser } from '../lib/authService';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BookOpen,
  Database,
  X,
} from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (user: UserAccount) => void;
  onCancel?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess, onCancel }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      setErrorMessage('Please enter a username.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 4) {
        setErrorMessage('Password must be at least 4 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const res = await createAccount(cleanUser, password);
        if (res.success && res.user) {
          setSuccessMessage(res.message);
          setTimeout(() => {
            onAuthSuccess(res.user!);
          }, 600);
        } else {
          setErrorMessage(res.message);
        }
      } else {
        const res = await loginUser(cleanUser, password);
        if (res.success && res.user) {
          setSuccessMessage(res.message);
          setTimeout(() => {
            onAuthSuccess(res.user!);
          }, 600);
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto px-4 py-8">
      <div className="w-full bg-[#171f33] border border-[#464554] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#8083ff]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button if modal */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-[#c7c4d7] hover:text-white p-1 rounded-full hover:bg-[#222a3d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#0b1326] border border-[#8083ff]/40 flex items-center justify-center text-[#c0c1ff] shadow-lg mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#dae2fd]">
            {mode === 'login' ? 'Patron Sign In' : 'Create Patron Account'}
          </h1>
          <p className="text-xs text-[#c7c4d7] mt-1 max-w-xs">
            {mode === 'login'
              ? 'Access real-time shelf mapping, 5-minute book holds, and queue status.'
              : 'Registered exclusively in Firestore patrons collection (isolated from admin portal).'}
          </p>
        </div>

        {/* Tabs: Sign In / Create Account */}
        <div className="grid grid-cols-2 p-1 bg-[#0b1326] rounded-2xl border border-[#464554] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-[#8083ff] text-[#0d0096] shadow-md'
                : 'text-[#c7c4d7] hover:text-[#dae2fd]'
            }`}
          >
            Patron Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-[#8083ff] text-[#0d0096] shadow-md'
                : 'text-[#c7c4d7] hover:text-[#dae2fd]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#dae2fd] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#8083ff]" />
              <span>Patron Username</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_reader, sam"
              autoComplete="username"
              className="w-full bg-[#0b1326] border border-[#464554] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#dae2fd] placeholder:text-[#c7c4d7] focus:border-[#8083ff] focus:ring-1 focus:ring-[#8083ff] outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#dae2fd] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#8083ff]" />
                <span>Password</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-[#c0c1ff] hover:text-white flex items-center gap-1 normal-case font-normal"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full bg-[#0b1326] border border-[#464554] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#dae2fd] placeholder:text-[#c7c4d7] focus:border-[#8083ff] focus:ring-1 focus:ring-[#8083ff] outline-none transition-all"
            />
          </div>

          {/* Confirm Password in Signup Mode */}
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#dae2fd] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#8083ff]" />
                <span>Confirm Password</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
                className="w-full bg-[#0b1326] border border-[#464554] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#dae2fd] placeholder:text-[#c7c4d7] focus:border-[#8083ff] focus:ring-1 focus:ring-[#8083ff] outline-none transition-all"
              />
            </div>
          )}

          {/* Status Notifications */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/40 text-[#ffdad6] text-xs">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-[#002113] border border-[#4edea3]/40 text-[#6ffbbe] text-xs">
              {successMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#8083ff] hover:bg-[#c0c1ff] text-[#0d0096] font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-[#0d0096] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In as Patron' : 'Create Patron Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Isolation Notice */}
        <div className="mt-6 pt-4 border-t border-[#464554]/40 flex items-start gap-2 text-[11px] text-[#c7c4d7]">
          <ShieldCheck className="w-4 h-4 text-[#4edea3] shrink-0 mt-0.5" />
          <span>
            Patron accounts are isolated in the <code className="text-[#c0c1ff] font-mono">patrons</code> Firestore collection with salted bcrypt encryption.
          </span>
        </div>
      </div>
    </div>
  );
};
