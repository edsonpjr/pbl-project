import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../ui';

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('pbl_theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pbl_theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  return { theme, toggle };
}

// ─── NavLink ─────────────────────────────────────────────────────────────────

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const active = location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      style={{
        padding: '4px 10px',
        borderRadius: 'var(--radius-md)',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--color-accent-fg)' : 'var(--color-fg-muted)',
        background: active ? 'var(--color-accent-muted)' : 'transparent',
        textDecoration: 'none',
        transition: 'background var(--transition), color var(--transition)',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-canvas-subtle)';
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-fg-default)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
          (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-fg-muted)';
        }
      }}
    >
      {children}
    </Link>
  );
}

// ─── XP Badge animado ─────────────────────────────────────────────────────────

function XpBadge({ xp }: { xp: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      background: 'var(--color-xp-subtle)',
      border: '1px solid var(--color-xp-gold)',
      borderRadius: '20px',
      padding: '2px 10px',
      fontSize: '12px',
      fontWeight: 700,
      color: 'var(--color-xp-gold)',
    }}>
      ⚡ {xp.toLocaleString()} XP
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isProfessor = user?.role === 'professor';

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--color-canvas-default)',
      borderBottom: '1px solid var(--color-border-muted)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '56px', gap: 'var(--space-4)',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 'var(--radius-md)',
            background: 'var(--color-accent-fg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
          }}>
            🧠
          </div>
          <span style={{
            fontSize: '16px', fontWeight: 700,
            color: 'var(--color-fg-default)',
          }}>
            PBL<span style={{ color: 'var(--color-accent-fg)' }}>Learn</span>
          </span>
        </Link>

        {/* Nav links */}
        {user && (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            {isProfessor ? (
              <>
                <NavLink to="/professor/modules">Módulos</NavLink>
                <NavLink to="/professor/users">Usuários</NavLink>
                <NavLink to="/ranking">Ranking</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/learn">Aprender</NavLink>
                <NavLink to="/ranking">Ranking</NavLink>
                <NavLink to="/progress">Progresso</NavLink>
              </>
            )}
          </nav>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            title="Alternar tema"
            style={{
              background: 'none', border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)', padding: '5px 8px',
              cursor: 'pointer', fontSize: '14px',
              color: 'var(--color-fg-muted)',
              display: 'flex', alignItems: 'center',
            }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* User info */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'none', border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--radius-md)', padding: '4px 10px',
                  cursor: 'pointer', color: 'var(--color-fg-default)',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--color-accent-fg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', color: '#fff', fontWeight: 700,
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name.split(' ')[0]}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--color-fg-muted)' }}>▾</span>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div
                  style={{
                    position: 'absolute', top: '110%', right: 0,
                    background: 'var(--color-canvas-default)',
                    border: '1px solid var(--color-border-default)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: 220,
                    zIndex: 200,
                    overflow: 'hidden',
                    animation: 'fadeUp 0.12s ease',
                  }}
                >
                  <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-border-muted)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-fg-default)' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)', marginTop: '2px' }}>
                      {user.email}
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <Badge variant={isProfessor ? 'accent' : 'success'}>
                        {isProfessor ? '👨‍🏫 Professor' : '🎓 Aluno'}
                      </Badge>
                      {!isProfessor && <XpBadge xp={user.xp} />}
                    </div>
                  </div>
                  <div style={{ padding: 'var(--space-2)' }}>
                    <button
                      onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 12px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        borderRadius: 'var(--radius-md)', fontSize: '14px',
                        color: 'var(--color-fg-default)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-canvas-subtle)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      👤 Meu Perfil
                    </button>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 12px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        borderRadius: 'var(--radius-md)', fontSize: '14px',
                        color: 'var(--color-danger-fg)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      🚪 Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Link to="/login" style={{
                padding: '5px 14px', borderRadius: 'var(--radius-md)',
                fontSize: '13px', fontWeight: 500,
                color: 'var(--color-fg-default)',
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-canvas-subtle)',
                textDecoration: 'none',
              }}>
                Entrar
              </Link>
              <Link to="/register" style={{
                padding: '5px 14px', borderRadius: 'var(--radius-md)',
                fontSize: '13px', fontWeight: 500,
                color: '#fff',
                background: 'var(--color-accent-fg)',
                textDecoration: 'none',
              }}>
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 150 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
