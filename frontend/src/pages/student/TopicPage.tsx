import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { topicsApi, exercisesApi, progressApi } from '../../api';
import type { Topic, Exercise, Progress, SubmissionResult } from '../../types';
import {
  Card, Button, Badge, ProgressBar,
  Alert, Spinner, EmptyState,
} from '../../components/ui';

// ─── Feedback animado após submissão ─────────────────────────────────────────

function SubmissionFeedback({
  result, onNext,
}: {
  result: SubmissionResult;
  onNext: () => void;
}) {
  return (
    <div style={{
      padding: 'var(--space-4)',
      borderRadius: 'var(--radius-lg)',
      background: result.is_correct
        ? 'var(--color-success-subtle)'
        : 'var(--color-danger-subtle)',
      border: `1px solid ${result.is_correct
        ? 'var(--color-success-emphasis)'
        : 'var(--color-danger-fg)'}`,
      animation: 'fadeUp 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: '28px' }}>{result.is_correct ? '🎉' : '❌'}</span>
        <div>
          <div style={{
            fontSize: '16px', fontWeight: 700,
            color: result.is_correct
              ? 'var(--color-success-fg)'
              : 'var(--color-danger-fg)',
          }}>
            {result.feedback}
          </div>
          {result.is_correct && result.xp_earned > 0 && (
            <div style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--color-xp-gold)',
              marginTop: '2px',
            }}>
              ⚡ +{result.xp_earned} XP ganhos!
            </div>
          )}
          {result.is_correct && result.already_solved && (
            <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)', marginTop: '2px' }}>
              (Exercício já resolvido anteriormente — XP não computado novamente)
            </div>
          )}
          {!result.is_correct && result.correct_answer && (
            <div style={{ fontSize: '13px', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
              Resposta correta: <strong>{result.correct_answer}</strong>
            </div>
          )}
        </div>
      </div>
      <Button variant={result.is_correct ? 'success' : 'secondary'} onClick={onNext}>
        {result.is_correct ? 'Próximo exercício →' : 'Tentar novamente'}
      </Button>
    </div>
  );
}

// ─── Exercício de múltipla escolha ───────────────────────────────────────────

function MultipleChoiceExercise({
  exercise, onSubmit, disabled,
}: {
  exercise: Exercise;
  onSubmit: (answer: string) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<string>('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
        {exercise.options.map((opt) => {
          const isSelected = selected === opt.label;
          return (
            <button
              key={opt.label}
              disabled={disabled}
              onClick={() => !disabled && setSelected(opt.label)}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                background: isSelected ? 'var(--color-accent-muted)' : 'var(--color-canvas-subtle)',
                border: `2px solid ${isSelected ? 'var(--color-accent-fg)' : 'var(--color-border-default)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                opacity: disabled ? 0.7 : 1,
                transition: 'all var(--transition)',
                fontSize: '14px',
                color: isSelected ? 'var(--color-accent-fg)' : 'var(--color-fg-default)',
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                background: isSelected ? 'var(--color-accent-fg)' : 'var(--color-border-default)',
                color: isSelected ? '#fff' : 'var(--color-fg-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
              }}>
                {opt.label.toUpperCase()}
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>
      <Button
        disabled={!selected || disabled}
        onClick={() => onSubmit(selected)}
        size="lg"
        style={{ alignSelf: 'flex-start' }}
      >
        Confirmar resposta
      </Button>
    </div>
  );
}

// ─── Exercício de input numérico ──────────────────────────────────────────────

function NumericInputExercise({
  exercise, onSubmit, disabled,
}: {
  exercise: Exercise;
  onSubmit: (answer: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim() && !disabled) onSubmit(value.trim());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <input
          type="number"
          step="any"
          placeholder="Digite sua resposta numérica..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={{
            flex: 1, padding: '10px 14px',
            fontSize: '16px', fontFamily: 'var(--font-mono)',
            background: 'var(--color-canvas-default)',
            border: '2px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-fg-default)',
            outline: 'none',
            opacity: disabled ? 0.7 : 1,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-fg)'; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; }}
        />
        <Button
          disabled={!value.trim() || disabled}
          onClick={() => onSubmit(value.trim())}
          size="lg"
        >
          Confirmar
        </Button>
      </div>
      {exercise.tolerance > 0 && (
        <p style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>
          Tolerância de ±{exercise.tolerance} aceita
        </p>
      )}
    </div>
  );
}

// ─── Card de exercício individual ─────────────────────────────────────────────

function ExerciseCard({
  exercise, index, total, onAnswered,
}: {
  exercise: Exercise;
  index: number;
  total: number;
  onAnswered: (xp: number) => void;
}) {
  const [result,    setResult]    = useState<SubmissionResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [showHint,  setShowHint]  = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (answer: string) => {
    setLoading(true);
    try {
      const res = await exercisesApi.submit(exercise.id, answer);
      setResult(res);
      setSubmitted(true);
      onAnswered(res.xp_earned);
    } catch {
      // silently ignore network errors
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!result?.is_correct) {
      setResult(null);
      setSubmitted(false);
    }
    // If correct, parent controls navigation
  };

  return (
    <Card style={{ marginBottom: 'var(--space-4)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Badge variant="default">
            {index + 1}/{total}
          </Badge>
          <Badge variant={exercise.type === 'multiple_choice' ? 'accent' : 'warning'}>
            {exercise.type === 'multiple_choice' ? '🔤 Múltipla escolha' : '🔢 Numérico'}
          </Badge>
        </div>
        <Badge variant="xp">⚡ {exercise.xp_reward} XP</Badge>
      </div>

      {/* Question */}
      <div style={{
        fontSize: '15px', fontWeight: 600,
        color: 'var(--color-fg-default)',
        lineHeight: 1.6, marginBottom: 'var(--space-4)',
        padding: 'var(--space-3)',
        background: 'var(--color-canvas-subtle)',
        borderRadius: 'var(--radius-md)',
        borderLeft: '3px solid var(--color-accent-fg)',
      }}>
        {exercise.question}
      </div>

      {/* Hint */}
      {exercise.hint && (
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <button
            onClick={() => setShowHint(h => !h)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: 'var(--color-warning-fg)',
              fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px',
            }}
          >
            💡 {showHint ? 'Ocultar dica' : 'Ver dica'}
          </button>
          {showHint && (
            <div style={{
              marginTop: 'var(--space-2)',
              padding: 'var(--space-3)',
              background: 'var(--color-warning-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px', color: 'var(--color-warning-fg)',
            }}>
              {exercise.hint}
            </div>
          )}
        </div>
      )}

      {/* Answer area */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)' }}>
          <Spinner size={28} />
        </div>
      ) : result && (submitted && (result.is_correct || !result.is_correct)) ? (
        <SubmissionFeedback
          result={result}
          onNext={handleNext}
        />
      ) : exercise.type === 'multiple_choice' ? (
        <MultipleChoiceExercise exercise={exercise} onSubmit={handleSubmit} disabled={loading} />
      ) : (
        <NumericInputExercise exercise={exercise} onSubmit={handleSubmit} disabled={loading} />
      )}
    </Card>
  );
}

// ─── Topic Page ───────────────────────────────────────────────────────────────

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [topic,     setTopic]     = useState<Topic | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [progress,  setProgress]  = useState<Progress | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<'theory' | 'exercises'>('theory');
  const [gainedXp,  setGainedXp]  = useState(0);

  useEffect(() => {
    if (!id) return;
    const topicId = parseInt(id);
    async function load() {
      try {
        const [t, exs, prog] = await Promise.all([
          topicsApi.getById(topicId),
          exercisesApi.getByTopic(topicId),
          progressApi.getProgressByTopic(topicId),
        ]);
        setTopic(t);
        setExercises(exs);
        setProgress(prog);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAnswered = (xp: number) => {
    setGainedXp(prev => prev + xp);
    // Refresh progress
    if (id) {
      progressApi.getProgressByTopic(parseInt(id)).then(setProgress);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) var(--space-6)' }}>
        <EmptyState icon="❓" title="Tópico não encontrado" />
      </div>
    );
  }

  const pct = progress?.completion_pct ?? 0;

  return (
    <div className="container" style={{ padding: 'var(--space-6) var(--space-6)' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-5)', fontSize: '13px' }}>
        <button
          onClick={() => navigate('/learn')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-accent-fg)', padding: 0, fontSize: '13px',
          }}
        >
          ← Aprender
        </button>
        <span style={{ color: 'var(--color-fg-muted)' }}>/</span>
        <span style={{ color: 'var(--color-fg-muted)' }}>{topic.title}</span>
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-5)',
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
            {topic.title}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
            {topic.content}
          </p>
        </div>

        {/* Progress summary */}
        <div style={{
          background: 'var(--color-canvas-subtle)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          minWidth: 200,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-fg-muted)', marginBottom: '6px' }}>
            Seu progresso
          </div>
          <ProgressBar value={pct} showLabel animated />
          <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)', marginTop: '6px' }}>
            {progress?.completed_exercises ?? 0}/{progress?.total_exercises ?? exercises.length} exercícios
          </div>
          {gainedXp > 0 && (
            <div style={{ marginTop: '6px' }}>
              <Badge variant="xp">⚡ +{gainedXp} XP nesta sessão</Badge>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 'var(--space-1)',
        borderBottom: '2px solid var(--color-border-muted)',
        marginBottom: 'var(--space-6)',
      }}>
        {(['theory', 'exercises'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--color-accent-fg)' : 'var(--color-fg-muted)',
              borderBottom: `2px solid ${tab === t ? 'var(--color-accent-fg)' : 'transparent'}`,
              marginBottom: '-2px',
              transition: 'all var(--transition)',
            }}
          >
            {t === 'theory' ? '📖 Teoria' : `🧩 Exercícios (${exercises.length})`}
          </button>
        ))}
      </div>

      {/* Theory tab */}
      {tab === 'theory' && (
        <div>
          <Card>
            {topic.theory ? (
              <div style={{
                fontSize: '15px', lineHeight: 1.8,
                color: 'var(--color-fg-default)',
              }}
                className="markdown-body"
              >
                <style>{`
                  .markdown-body h2 { font-size:18px; font-weight:700; margin:24px 0 12px; color:var(--color-fg-default); border-bottom:1px solid var(--color-border-muted); padding-bottom:8px; }
                  .markdown-body h3 { font-size:15px; font-weight:600; margin:16px 0 8px; color:var(--color-fg-default); }
                  .markdown-body p  { margin-bottom:12px; }
                  .markdown-body ul, .markdown-body ol { padding-left:24px; margin-bottom:12px; }
                  .markdown-body li { margin-bottom:4px; }
                  .markdown-body table { border-collapse:collapse; width:100%; margin-bottom:16px; font-size:14px; }
                  .markdown-body th, .markdown-body td { border:1px solid var(--color-border-default); padding:8px 12px; text-align:left; }
                  .markdown-body th { background:var(--color-canvas-subtle); font-weight:600; }
                  .markdown-body strong { font-weight:700; color:var(--color-fg-default); }
                  .markdown-body code { font-family:var(--font-mono); background:var(--color-canvas-subtle); padding:2px 6px; border-radius:4px; font-size:13px; }
                `}</style>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {topic.theory}
                </ReactMarkdown>
              </div>
            ) : (
              <EmptyState icon="📄" title="Teoria em breve" description="O professor ainda não adicionou teoria a este tópico." />
            )}
          </Card>
          {exercises.length > 0 && (
            <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
              <Button size="lg" onClick={() => setTab('exercises')}>
                Pronto para praticar? → Exercícios
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Exercises tab */}
      {tab === 'exercises' && (
        <div>
          {exercises.length === 0 ? (
            <EmptyState icon="🧩" title="Nenhum exercício disponível" description="Aguarde o professor adicionar exercícios a este tópico." />
          ) : (
            <>
              {pct === 100 && (
                <Alert variant="success" style={{ marginBottom: 'var(--space-4)' }}>
                  🏆 Parabéns! Você completou todos os exercícios deste tópico.
                </Alert>
              )}
              {exercises.map((ex, i) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  index={i}
                  total={exercises.length}
                  onAnswered={handleAnswered}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
