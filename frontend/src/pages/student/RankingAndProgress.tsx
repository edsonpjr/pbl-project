import { useEffect, useState } from 'react';
import { usersApi, progressApi } from '../../api';
import type { User, Progress } from '../../types';
import { Card, Badge, ProgressBar, Spinner, EmptyState } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

// ─── Ranking Page ─────────────────────────────────────────────────────────────

export function RankingPage() {
  const { user: me } = useAuthStore();
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getRanking(20).then(setUsers).finally(() => setLoading(false));
  }, []);

  const medalFor = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)', maxWidth: 700 }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
          🏆 Ranking de Alunos
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
          Top alunos por XP acumulado. Resolva exercícios para subir no ranking!
        </p>
      </div>

      {users.length === 0 ? (
        <EmptyState icon="🏆" title="Nenhum aluno no ranking ainda" description="Seja o primeiro a resolver exercícios!" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {users.map((u, idx) => {
            const rank = idx + 1;
            const isMe = u.id === me?.id;
            return (
              <Card
                key={u.id}
                padding="var(--space-3) var(--space-4)"
                style={{
                  border: isMe
                    ? '2px solid var(--color-accent-fg)'
                    : '1px solid var(--color-border-default)',
                  background: isMe ? 'var(--color-accent-muted)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  {/* Rank */}
                  <div style={{
                    width: 40, textAlign: 'center',
                    fontSize: rank <= 3 ? '22px' : '16px',
                    fontWeight: 700,
                    color: rank <= 3 ? 'var(--color-xp-gold)' : 'var(--color-fg-muted)',
                    flexShrink: 0,
                  }}>
                    {medalFor(rank)}
                  </div>

                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: isMe ? 'var(--color-accent-fg)' : 'var(--color-canvas-subtle)',
                    border: '2px solid var(--color-border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 700,
                    color: isMe ? '#fff' : 'var(--color-fg-default)',
                    flexShrink: 0,
                  }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: isMe ? 700 : 500,
                      color: 'var(--color-fg-default)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      {u.name}
                      {isMe && <Badge variant="accent" style={{ fontSize: '10px' }}>Você</Badge>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>
                      {u.email}
                    </div>
                  </div>

                  {/* XP */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: 'var(--color-xp-subtle)',
                    border: '1px solid var(--color-xp-gold)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '14px', fontWeight: 700,
                    color: 'var(--color-xp-gold)',
                    flexShrink: 0,
                  }}>
                    ⚡ {u.xp.toLocaleString()}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Progress Page ────────────────────────────────────────────────────────────

export function ProgressPage() {
  const [progresses, setProgresses] = useState<Progress[]>([]);
  const [loading, setLoading]       = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    progressApi.getMyProgress().then(setProgresses).finally(() => setLoading(false));
  }, []);

  const totalCompleted = progresses.reduce((s, p) => s + p.completed_exercises, 0);
  const totalExercises = progresses.reduce((s, p) => s + p.total_exercises, 0);
  const overallPct     = totalExercises > 0 ? (totalCompleted / totalExercises) * 100 : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
          📊 Meu Progresso
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
          Acompanhe sua evolução em cada tópico
        </p>
      </div>

      {/* Summary cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-4)', marginBottom: 'var(--space-8)',
      }}>
        {[
          { icon: '⚡', label: 'XP Total',        value: user?.xp.toLocaleString() ?? '0', color: 'var(--color-xp-gold)' },
          { icon: '✅', label: 'Exercícios feitos', value: `${totalCompleted}/${totalExercises}`,  color: 'var(--color-success-fg)' },
          { icon: '📖', label: 'Tópicos iniciados', value: progresses.length,                     color: 'var(--color-accent-fg)' },
          { icon: '🏅', label: 'Concluídos',        value: progresses.filter(p => p.is_completed).length, color: 'var(--color-warning-fg)' },
        ].map(({ icon, label, value, color }) => (
          <Card key={label} padding="var(--space-4)">
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)', marginTop: '2px' }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Overall progress */}
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Progresso geral</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-accent-fg)' }}>
              {Math.round(overallPct)}%
            </span>
          </div>
          <ProgressBar value={overallPct} height={10} animated />
        </div>
      </Card>

      {/* Per topic */}
      {progresses.length === 0 ? (
        <EmptyState
          icon="📈"
          title="Nenhum progresso ainda"
          description="Comece a resolver exercícios para ver seu progresso aqui."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {progresses.map((p) => (
            <Card key={p.topic_id} padding="var(--space-4)">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '18px' }}>{p.is_completed ? '✅' : '📖'}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-fg-default)' }}>
                      Tópico #{p.topic_id}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>
                      {p.completed_exercises}/{p.total_exercises} exercícios
                      {p.last_activity && ` · Última atividade: ${new Date(p.last_activity).toLocaleDateString('pt-BR')}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  {p.is_completed && <Badge variant="success">Concluído</Badge>}
                  <Badge variant="xp">⚡ {p.xp_earned} XP</Badge>
                </div>
              </div>
              <ProgressBar value={p.completion_pct} showLabel height={6} animated />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
