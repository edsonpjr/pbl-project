import React, { useEffect, useState } from 'react';
import { usersApi, authApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';
import {
  Card, Button, Badge, Input, Modal,
  Alert, Spinner, EmptyState,
} from '../../components/ui';

// ─── Professor - Users Page ───────────────────────────────────────────────────

export function UsersPage() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [deleteUser, setDeleteUser] = useState<User | undefined>();

  const load = () => {
    usersApi.getAll().then(setUsers).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteUser) return;
    await usersApi.remove(deleteUser.id);
    setDeleteUser(undefined);
    load();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  const students   = filtered.filter(u => u.role === 'student');
  const professors = filtered.filter(u => u.role === 'professor');

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
          👥 Usuários
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
          {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-5)', maxWidth: 400 }}>
        <Input
          placeholder="🔍 Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        {[
          { label: 'Total',       value: users.length,     icon: '👥', color: 'var(--color-accent-fg)' },
          { label: 'Alunos',      value: users.filter(u => u.role === 'student').length,   icon: '🎓', color: 'var(--color-success-fg)' },
          { label: 'Professores', value: users.filter(u => u.role === 'professor').length, icon: '👨‍🏫', color: 'var(--color-warning-fg)' },
          { label: 'XP médio',   value: Math.round(users.filter(u=>u.role==='student').reduce((s,u)=>s+u.xp,0) / Math.max(1, users.filter(u=>u.role==='student').length)), icon: '⚡', color: 'var(--color-xp-gold)' },
        ].map(({ label, value, icon, color }) => (
          <Card key={label} padding="var(--space-3)">
            <div style={{ fontSize: '20px' }}>{icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>{label}</div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Nenhum usuário encontrado" description="Tente outro termo de busca." />
      ) : (
        <>
          {/* Students */}
          {students.length > 0 && (
            <section style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-fg-default)' }}>
                🎓 Alunos ({students.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-3)' }}>
                {students.map((u) => (
                  <UserCard key={u.id} user={u} onDelete={() => setDeleteUser(u)} />
                ))}
              </div>
            </section>
          )}

          {/* Professors */}
          {professors.length > 0 && (
            <section>
              <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-fg-default)' }}>
                👨‍🏫 Professores ({professors.length})
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-3)' }}>
                {professors.map((u) => (
                  <UserCard key={u.id} user={u} onDelete={() => setDeleteUser(u)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Confirm delete */}
      <Modal open={!!deleteUser} onClose={() => setDeleteUser(undefined)} title="Remover usuário">
        <p style={{ color: 'var(--color-fg-muted)', marginBottom: 'var(--space-4)' }}>
          Tem certeza que deseja remover <strong>{deleteUser?.name}</strong>?
          Todo o histórico de progresso e submissões será perdido.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeleteUser(undefined)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Remover</Button>
        </div>
      </Modal>
    </div>
  );
}

function UserCard({ user, onDelete }: { user: User; onDelete: () => void }) {
  return (
    <Card padding="var(--space-4)">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: user.role === 'professor' ? 'var(--color-warning-subtle)' : 'var(--color-accent-muted)',
            border: '2px solid var(--color-border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 700, flexShrink: 0,
            color: user.role === 'professor' ? 'var(--color-warning-fg)' : 'var(--color-accent-fg)',
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
            <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <Badge variant={user.role === 'professor' ? 'warning' : 'success'}>
                {user.role === 'professor' ? '👨‍🏫 Professor' : '🎓 Aluno'}
              </Badge>
              {user.role === 'student' && (
                <Badge variant="xp">⚡ {user.xp} XP</Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={onDelete} style={{ flexShrink: 0 }}>🗑️</Button>
      </div>
    </Card>
  );
}

// ─── Profile Page (shared: aluno e professor) ─────────────────────────────────

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form,    setForm]    = useState({ name: user?.name ?? '', email: user?.email ?? '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.password && form.password !== form.confirm) {
      setError('Senhas não coincidem'); return;
    }
    if (form.password && form.password.length < 6) {
      setError('Senha mínima: 6 caracteres'); return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload: any = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;

      await usersApi.update(user.id, payload);
      // Refresh user from server
      const updated = await authApi.me();
      updateUser(updated);
      setSuccess('Perfil atualizado com sucesso!');
      setForm(f => ({ ...f, password: '', confirm: '' }));
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)', maxWidth: 600 }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
          👤 Meu Perfil
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Avatar & summary */}
      <Card style={{ marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--color-accent-fg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-fg-muted)' }}>{user.email}</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
              <Badge variant={user.role === 'professor' ? 'accent' : 'success'}>
                {user.role === 'professor' ? '👨‍🏫 Professor' : '🎓 Aluno'}
              </Badge>
              {user.role === 'student' && (
                <Badge variant="xp">⚡ {user.xp.toLocaleString()} XP</Badge>
              )}
              <Badge variant="default">
                Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit form */}
      <Card>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 'var(--space-4)', color: 'var(--color-fg-default)' }}>
          Editar informações
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {success && <Alert variant="success">{success}</Alert>}
          {error   && <Alert variant="danger">{error}</Alert>}

          <Input
            label="Nome completo"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <Input
            label="Nova senha (deixe em branco para manter)"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
          />
          {form.password && (
            <Input
              label="Confirmar nova senha"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm(f => ({ ...f, confirm: e.target.value }))}
            />
          )}
          <Button type="submit" loading={loading}>Salvar alterações</Button>
        </form>
      </Card>
    </div>
  );
}
