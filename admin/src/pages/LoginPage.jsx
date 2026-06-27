import React, { useState } from 'react';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import ThemeToggle from '@/components/ThemeToggle';
import { inputClass, btnPrimary } from '@/utils/styles';

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
    <div className="relative flex min-h-screen items-center justify-center bg-page p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="admin-panel w-full max-w-md rounded-2xl border p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="text-brand" size={28} />
          <h1 className="text-xl font-bold text-text-main">Admin Login</h1>
        </div>
        <p className="text-sm text-text-dim mb-6">
          SuperAdmin: platform setup only. College admins: use the email and password set under
          College → Admin Login (or Admin Login tab if you are the college owner).
        </p>
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
            className={`w-full py-3 ${btnPrimary}`}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
