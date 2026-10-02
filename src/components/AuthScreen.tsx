import { useState } from 'react';
import { signInWithPassword, signUpUser, sanitizeReturnTo } from '../lib/auth';

type AuthMode = 'login' | 'register';

export function AuthScreen({ returnTo }: { returnTo?: string }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'register') {
        const result = await signUpUser({ full_name: fullName, email, password });
        if (result.error) {
          throw result.error;
        }
        setSuccess('Registration was created successfully. Please check your email and then continue.');
      } else {
        const result = await signInWithPassword(email, password);
        if (result.error) {
          throw result.error;
        }
      }

      const next = sanitizeReturnTo(returnTo || '/');
      window.location.assign(next);
    } catch (caughtError: any) {
      setError(caughtError?.message ?? 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">CHEMLAB ACCESS</span>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create student account'}</h1>
          <p>{mode === 'login' ? 'Sign in to continue your chemistry activity.' : 'New public registrations are student accounts only.'}</p>
        </div>

        <div className="auth-toggle">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>Log in</button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>Register</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <label>
              <span>Full name</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Alex Student" required />
            </label>
          )}

          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@example.com" required />
          </label>

          <label>
            <span>Password</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" minLength={6} required />
          </label>

          {error && <div className="form-message error">{error}</div>}
          {success && <div className="form-message success">{success}</div>}

          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  );
}
