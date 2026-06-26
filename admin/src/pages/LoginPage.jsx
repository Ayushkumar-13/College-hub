import React, { useState } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks';

const inputClass =
  'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-border-card rounded-xl text-text-main outline-none focus:ring-2 focus:ring-blue-500/20';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setSubmitting(true);
      const result = await login(email.trim(), password);
      if (!result.success) setError(result.error || 'Login failed');
    } catch (err) {
      setError(err?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface dark:bg-slate-900 border border-border-card rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-blue-600" size={28} />
          <h1 className="text-xl font-bold text-text-main">Admin Login</h1>
        </div>
        <p className="text-sm text-text-dim mb-6">SuperAdmin, Owner, or Admin accounts only.</p>
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClass}
            required
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={inputClass}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-text-dim"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
