import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../providers/ToastProvider';
import { AuthShell, AuthField, AuthSubmit, AuthAlert, AuthLink } from '../components/auth/AuthShell';

// Mirrors RegisterSerializer.validate_password on the backend, so users see
// the rules before a round trip rather than after.
const passwordProblems = (value) => {
  const problems = [];
  if (value.length < 8) problems.push('at least 8 characters');
  if (!/[A-Z]/.test(value)) problems.push('an uppercase letter');
  if (!/[a-z]/.test(value)) problems.push('a lowercase letter');
  if (!/[0-9]/.test(value)) problems.push('a number');
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) problems.push('a special character');
  return problems;
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const validate = () => {
    const errors = {};

    if (!form.first_name.trim()) errors.first_name = 'Required.';
    if (!form.last_name.trim()) errors.last_name = 'Required.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (!form.username.trim()) errors.username = 'Pick a username.';

    const problems = passwordProblems(form.password);
    if (problems.length) errors.password = `Password needs ${problems.join(', ')}.`;
    if (form.password !== form.confirm_password) errors.confirm_password = 'Passwords do not match.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        phone: form.phone.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
        role: 'customer',
      });
      showToast(`Welcome to Squally Line, ${user.firstName}`, 'success');
      navigate('/', { replace: true });
    } catch (err) {
      // Field-level messages come back as {errors: {email: [...]}}.
      const backendErrors = err.data?.errors;
      if (backendErrors && typeof backendErrors === 'object') {
        const mapped = {};
        Object.entries(backendErrors).forEach(([key, value]) => {
          mapped[key] = Array.isArray(value) ? value.join(' ') : String(value);
        });
        setFieldErrors(mapped);
      }
      setError(err.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Join us"
      title="Create your account"
      subtitle="Save measurements, book fittings and track every order."
      footer={<>Already have an account? <AuthLink to="/login">Sign in</AuthLink></>}
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthAlert message={error} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <AuthField
            label="First name"
            value={form.first_name}
            onChange={set('first_name')}
            placeholder="Kwame"
            autoComplete="given-name"
            error={fieldErrors.first_name}
            required
          />
          <AuthField
            label="Last name"
            value={form.last_name}
            onChange={set('last_name')}
            placeholder="Asante"
            autoComplete="family-name"
            error={fieldErrors.last_name}
            required
          />
        </div>

        <AuthField
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          placeholder="you@example.com"
          autoComplete="email"
          error={fieldErrors.email}
          required
        />

        <AuthField
          label="Username"
          value={form.username}
          onChange={set('username')}
          placeholder="kwame.asante"
          autoComplete="username"
          error={fieldErrors.username}
          required
        />

        <AuthField
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          placeholder="+233 24 123 4567"
          autoComplete="tel"
          error={fieldErrors.phone}
          hint="Optional — used for fitting reminders."
        />

        <AuthField
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="••••••••"
          autoComplete="new-password"
          error={fieldErrors.password}
          hint="8+ characters, with upper, lower, a number and a symbol."
          required
        />

        <AuthField
          label="Confirm password"
          type="password"
          value={form.confirm_password}
          onChange={set('confirm_password')}
          placeholder="••••••••"
          autoComplete="new-password"
          error={fieldErrors.confirm_password}
          required
        />

        <AuthSubmit loading={loading}>Create account</AuthSubmit>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
