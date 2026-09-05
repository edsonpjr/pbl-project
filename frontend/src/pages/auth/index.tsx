import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { Button, Input, Alert, Card } from '../../components/ui';

// ─── Logo mark compartilhado ──────────────────────────────────────────────────

function AuthLogo() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
      <div style={{
        width: 52, height: 52, borderRadius: 'var(--radius-lg)',
        background: 'var(--color-accent-fg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '26px', margin: '0 auto var(--space-3)',
        boxShadow: '0 4px 16px var(--color-accent-muted)',
      }}>
        🧠
      </div>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
        PBL<span style={{ color: 'var(--color-accent-fg)' }}>Learn</span>
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
        Aprenda com problemas reais
      </p>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Preencha todos os campos.'); return; }

    setLoading(true);
    setError('');
    try {
      const data = await authApi.login(email, password);
      setAuth(data.user, data.token);
      navigate(data.user.role === 'professor' ? '/professor/modules' : '/learn');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 'var(--space-6)',
      background: 'var(--color-canvas-subtle)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <AuthLogo />
        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-fg-default)', marginBottom: 'var(--space-1)' }}>
              Entrar na plataforma
            </h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <Button type="submit" fullWidth loading={loading} size="lg">
              Entrar
            </Button>

            {/* Demo credentials */}
            <div style={{
              background: 'var(--color-canvas-subtle)',
              border: '1px solid var(--color-border-muted)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3)',
              fontSize: '12px',
              color: 'var(--color-fg-muted)',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--color-fg-default)' }}>
                🔑 Credenciais de demo
              </div>
              <div
                style={{ cursor: 'pointer', color: 'var(--color-accent-fg)' }}
                onClick={() => { setEmail('professor@pbl.com'); setPassword('professor123'); }}
              >
                👨‍🏫 professor@pbl.com / professor123
              </div>
              <div
                style={{ cursor: 'pointer', color: 'var(--color-accent-fg)', marginTop: '2px' }}
                onClick={() => { setEmail('aluno@pbl.com'); setPassword('aluno123'); }}
              >
                🎓 aluno@pbl.com / aluno123
              </div>
            </div>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: '14px', color: 'var(--color-fg-muted)' }}>
          Não tem conta?{' '}
          <Link to="/register" style={{ color: 'var(--color-accent-fg)', fontWeight: 600 }}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'student' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())          e.name     = 'Nome obrigatório';
    if (!form.email.includes('@'))  e.email    = 'E-mail inválido';
    if (form.password.length < 6)   e.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirm) e.confirm = 'Senhas não coincidem';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    try {
      const data = await authApi.register(form.name, form.email, form.password, form.role);
      setAuth(data.user, data.token);
      navigate(data.user.role === 'professor' ? '/professor/modules' : '/learn');
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value })),
    error: errors[k],
  });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 'var(--space-6)',
      background: 'var(--color-canvas-subtle)',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <AuthLogo />
        <Card>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-fg-default)', marginBottom: 'var(--space-1)' }}>
              Criar conta
            </h2>

            {apiError && <Alert variant="danger">{apiError}</Alert>}

            <Input label="Nome completo" placeholder="João Silva" {...field('name')} />
            <Input label="E-mail" type="email" placeholder="joao@email.com" {...field('email')} />
            <Input label="Senha" type="password" placeholder="••••••••" {...field('password')} hint="Mínimo 6 caracteres" />
            <Input label="Confirmar senha" type="password" placeholder="••••••••" {...field('confirm')} />

            {/* Role selector */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-fg-default)', display: 'block', marginBottom: '6px' }}>
                Você é:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                {[
                  { val: 'student',   icon: '🎓', label: 'Aluno' },
                  { val: 'professor', icon: '👨‍🏫', label: 'Professor' },
                ].map(({ val, icon, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: val }))}
                    style={{
                      padding: 'var(--space-3)',
                      border: `2px solid ${form.role === val ? 'var(--color-accent-fg)' : 'var(--color-border-default)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: form.role === val ? 'var(--color-accent-muted)' : 'var(--color-canvas-default)',
                      cursor: 'pointer',
                      fontSize: '14px', fontWeight: 500,
                      color: form.role === val ? 'var(--color-accent-fg)' : 'var(--color-fg-muted)',
                      transition: 'all var(--transition)',
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading} size="lg">
              Criar conta
            </Button>
          </form>
        </Card>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-5)', fontSize: '14px', color: 'var(--color-fg-muted)' }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent-fg)', fontWeight: 600 }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
