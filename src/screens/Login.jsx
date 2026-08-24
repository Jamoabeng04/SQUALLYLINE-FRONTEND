import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../providers/ToastProvider';
import { AuthShell, AuthField, AuthSubmit, AuthAlert, AuthLink } from '../components/auth/AuthShell';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ProtectedRoute stashes where the user was headed before the redirect.
  const redirectTo = location.state?.from || '/';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      showToast(`Welcome back, ${user.firstName || user.username}`, 'success');
      // Staff land on the admin dashboard, customers on wherever they were going.
      const target = user.role === 'admin' || user.role === 'apprentice' ? '/admin' : redirectTo;
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || 'Could not sign you in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in"
      subtitle="Your measurements, orders and fittings — all in one place."
      footer={<>New here? <AuthLink to="/register">Create an account</AuthLink></>}
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthAlert message={error} />

        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <AuthSubmit loading={loading}>Sign in</AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
