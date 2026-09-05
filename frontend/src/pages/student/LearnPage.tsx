import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { modulesApi, topicsApi, progressApi } from '../../api';
import type { Module, Topic, Progress } from '../../types';
import { Card, ProgressBar, Badge, Spinner, EmptyState } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

// ─── Topic card com progresso ─────────────────────────────────────────────────

function TopicCard({
  topic, progress, onClick,
}: {
  topic: Topic;
  progress?: Progress;
  onClick: () => void;
}) {
  const pct    = progress?.completion_pct ?? 0;
  const done   = progress?.is_completed ?? false;
  const started = (progress?.completed_exercises ?? 0) > 0;

  return (
    <Card hoverable onClick={onClick} padding="var(--space-4)">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '6px' }}>
            <span style={{ fontSize: '18px' }}>
              {done ? '✅' : started ? '📖' : '📄'}
            </span>
            <h3 style={{
              fontSize: '15px', fontWeight: 600,
              color: 'var(--color-fg-default)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {topic.title}
            </h3>
          </div>

          <p style={{
            fontSize: '13px', color: 'var(--color-fg-muted)',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            marginBottom: 'var(--space-3)',
          }}>
            {topic.content || 'Clique para começar'}
          </p>

          <ProgressBar value={pct} showLabel height={6} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>
              {progress
                ? `${progress.completed_exercises}/${progress.total_exercises} exercícios`
                : 'Não iniciado'}
            </span>
            {progress && progress.xp_earned > 0 && (
              <Badge variant="xp">⚡ +{progress.xp_earned} XP</Badge>
            )}
          </div>
        </div>

        <span style={{ fontSize: '20px', color: 'var(--color-fg-subtle)', flexShrink: 0 }}>›</span>
      </div>
    </Card>
  );
}

// ─── Module section ───────────────────────────────────────────────────────────

function ModuleSection({
  module, topics, progressMap,
}: {
  module: Module;
  topics: Topic[];
  progressMap: Map<number, Progress>;
}) {
  const navigate = useNavigate();

  const totalExercises  = topics.reduce((s, t) => s + (progressMap.get(t.id)?.total_exercises ?? 0), 0);
  const doneExercises   = topics.reduce((s, t) => s + (progressMap.get(t.id)?.completed_exercises ?? 0), 0);
  const modulePct       = totalExercises > 0 ? (doneExercises / totalExercises) * 100 : 0;

  return (
    <section style={{ marginBottom: 'var(--space-8)' }}>
      {/* Module header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-3)',
        borderBottom: '1px solid var(--color-border-muted)',
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
            📚 {module.title}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-fg-muted)', marginTop: '2px' }}>
            {module.description}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-fg-muted)' }}>
            {Math.round(modulePct)}% completo
          </div>
          <div style={{ width: 100, marginTop: '4px' }}>
            <ProgressBar value={modulePct} height={5} />
          </div>
        </div>
      </div>

      {/* Topics grid */}
      {topics.length === 0 ? (
        <p style={{ fontSize: '14px', color: 'var(--color-fg-muted)', fontStyle: 'italic' }}>
          Nenhum tópico disponível neste módulo.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 'var(--space-3)',
        }}>
          {topics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              progress={progressMap.get(topic.id)}
              onClick={() => navigate(`/learn/topic/${topic.id}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Learn Page ───────────────────────────────────────────────────────────────

export default function LearnPage() {
  const { user } = useAuthStore();
  const [modules,     setModules]     = useState<Module[]>([]);
  const [topicsMap,   setTopicsMap]   = useState<Map<number, Topic[]>>(new Map());
  const [progressMap, setProgressMap] = useState<Map<number, Progress>>(new Map());
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [mods, progresses] = await Promise.all([
          modulesApi.getAll(),
          progressApi.getMyProgress(),
        ]);
        setModules(mods);

        // Build progress map: topicId → Progress
        const pMap = new Map<number, Progress>();
        progresses.forEach((p) => pMap.set(p.topic_id, p));
        setProgressMap(pMap);

        // Load topics for each module
        const tMap = new Map<number, Topic[]>();
        await Promise.all(
          mods.map(async (m) => {
            const topics = await topicsApi.getByModule(m.id);
            tMap.set(m.id, topics);
          })
        );
        setTopicsMap(tMap);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Total XP across topics
  const totalXp = user?.xp ?? 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
              Olá, {user?.name.split(' ')[0]} 👋
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
              Continue de onde parou. Cada problema resolvido é um passo a mais.
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-xp-subtle)',
            border: '2px solid var(--color-xp-gold)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3) var(--space-4)',
          }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-xp-gold)' }}>
                {totalXp.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-fg-muted)' }}>XP Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      {modules.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Nenhum módulo disponível"
          description="Aguarde seu professor publicar os módulos e tópicos."
        />
      ) : (
        modules.map((module) => (
          <ModuleSection
            key={module.id}
            module={module}
            topics={topicsMap.get(module.id) ?? []}
            progressMap={progressMap}
          />
        ))
      )}
    </div>
  );
}
