import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exercisesApi, topicsApi } from '../../api';
import type { Exercise, Topic } from '../../types';
import {
  Card, Button, Badge, Input, Textarea, Select,
  Modal, Alert, Spinner, EmptyState, Divider,
} from '../../components/ui';

// ─── Choice editor (opções de múltipla escolha) ───────────────────────────────

interface Choice { label: string; text: string; }

function ChoiceEditor({
  choices, onChange,
}: {
  choices: Choice[];
  onChange: (choices: Choice[]) => void;
}) {
  const LABELS = ['a', 'b', 'c', 'd'];

  const updateText = (idx: number, text: string) => {
    const updated = [...choices];
    updated[idx] = { ...updated[idx], text };
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-fg-default)' }}>
        Opções de resposta
      </label>
      {LABELS.map((lbl, i) => (
        <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-canvas-subtle)',
            border: '1px solid var(--color-border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: 'var(--color-fg-muted)',
          }}>
            {lbl.toUpperCase()}
          </div>
          <input
            value={choices[i]?.text ?? ''}
            onChange={(e) => updateText(i, e.target.value)}
            placeholder={`Alternativa ${lbl.toUpperCase()}...`}
            style={{
              flex: 1, padding: '6px 12px', fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              color: 'var(--color-fg-default)',
              background: 'var(--color-canvas-default)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-md)',
              outline: 'none',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent-fg)'; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--color-border-default)'; }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Exercise Form Modal ──────────────────────────────────────────────────────

interface ExForm {
  type: 'multiple_choice' | 'numeric_input';
  question: string;
  hint: string;
  correct_answer: string;
  options: Choice[];
  tolerance: number;
  xp_reward: number;
  order_index: number;
}

const defaultChoices: Choice[] = [
  { label: 'a', text: '' },
  { label: 'b', text: '' },
  { label: 'c', text: '' },
  { label: 'd', text: '' },
];

function ExerciseFormModal({
  open, onClose, topicId, initial, onSave,
}: {
  open: boolean;
  onClose: () => void;
  topicId: number;
  initial?: Exercise;
  onSave: () => void;
}) {
  const [form, setForm] = useState<ExForm>({
    type:           'multiple_choice',
    question:       '',
    hint:           '',
    correct_answer: '',
    options:        defaultChoices,
    tolerance:      0.001,
    xp_reward:      10,
    order_index:    0,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        type:           initial.type,
        question:       initial.question,
        hint:           initial.hint,
        correct_answer: initial.correct_answer ?? '',
        options:        initial.options.length > 0
                          ? initial.options
                          : defaultChoices,
        tolerance:      initial.tolerance,
        xp_reward:      initial.xp_reward,
        order_index:    initial.order_index,
      });
    } else {
      setForm({
        type: 'multiple_choice', question: '', hint: '',
        correct_answer: '', options: defaultChoices,
        tolerance: 0.001, xp_reward: 10, order_index: 0,
      });
    }
    setError('');
  }, [open, initial]);

  const validate = (): string | null => {
    if (!form.question.trim()) return 'A pergunta é obrigatória';
    if (!form.correct_answer.trim()) return 'A resposta correta é obrigatória';
    if (form.type === 'multiple_choice') {
      const filled = form.options.filter(o => o.text.trim()).length;
      if (filled < 2) return 'Preencha ao menos 2 alternativas';
      const validLabels = form.options.map(o => o.label);
      if (!validLabels.includes(form.correct_answer.toLowerCase())) {
        return 'A resposta correta deve ser uma das letras: a, b, c ou d';
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      const payload = {
        ...form,
        options: form.type === 'multiple_choice'
          ? form.options.filter(o => o.text.trim())
          : [],
      };
      if (initial) await exercisesApi.update(initial.id, payload);
      else         await exercisesApi.create(topicId, payload as any);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao salvar exercício');
    } finally {
      setLoading(false);
    }
  };

  const f = <K extends keyof ExForm>(k: K) => ({
    value: form[k] as any,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value })),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar Exercício' : 'Novo Exercício'}
      width={680}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Type selector */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-fg-default)', display: 'block', marginBottom: '6px' }}>
            Tipo de exercício
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
            {([
              { val: 'multiple_choice', icon: '🔤', label: 'Múltipla escolha' },
              { val: 'numeric_input',   icon: '🔢', label: 'Input numérico' },
            ] as const).map(({ val, icon, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: val }))}
                style={{
                  padding: 'var(--space-3)',
                  border: `2px solid ${form.type === val ? 'var(--color-accent-fg)' : 'var(--color-border-default)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: form.type === val ? 'var(--color-accent-muted)' : 'var(--color-canvas-default)',
                  cursor: 'pointer',
                  fontSize: '14px', fontWeight: 500,
                  color: form.type === val ? 'var(--color-accent-fg)' : 'var(--color-fg-muted)',
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <Textarea
          label="Pergunta"
          placeholder="Digite o enunciado do exercício... (suporta notação matemática textual)"
          style={{ minHeight: 90 }}
          {...f('question')}
        />

        {/* Hint */}
        <Input label="Dica (opcional)" placeholder="Uma dica para o aluno..." {...f('hint')} />

        {/* Options (MC only) */}
        {form.type === 'multiple_choice' && (
          <>
            <ChoiceEditor
              choices={form.options}
              onChange={(opts) => setForm(p => ({ ...p, options: opts }))}
            />
            <Select
              label="Resposta correta"
              value={form.correct_answer}
              onChange={(e) => setForm(p => ({ ...p, correct_answer: e.target.value }))}
              options={[
                { value: '',  label: 'Selecione a alternativa correta...' },
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B' },
                { value: 'c', label: 'C' },
                { value: 'd', label: 'D' },
              ]}
            />
          </>
        )}

        {/* Numeric answer */}
        {form.type === 'numeric_input' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              label="Resposta correta (número)"
              type="number"
              step="any"
              placeholder="Ex: 4"
              {...f('correct_answer')}
            />
            <Input
              label="Tolerância (±)"
              type="number"
              step="any"
              placeholder="Ex: 0.001"
              value={form.tolerance}
              onChange={(e) => setForm(p => ({ ...p, tolerance: parseFloat(e.target.value) || 0 }))}
              hint="Margem de erro aceita"
            />
          </div>
        )}

        <Divider />

        {/* XP and Order */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Input
            label="XP de recompensa"
            type="number"
            value={form.xp_reward}
            onChange={(e) => setForm(p => ({ ...p, xp_reward: parseInt(e.target.value) || 0 }))}
          />
          <Input
            label="Ordem"
            type="number"
            value={form.order_index}
            onChange={(e) => setForm(p => ({ ...p, order_index: parseInt(e.target.value) || 0 }))}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>
            {initial ? 'Salvar alterações' : 'Criar exercício'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Exercise card (list view) ────────────────────────────────────────────────

function ExerciseListItem({
  exercise, index, onEdit, onDelete,
}: {
  exercise: Exercise;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card padding="var(--space-4)" style={{ marginBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: '8px' }}>
            <Badge variant="default">#{index + 1}</Badge>
            <Badge variant={exercise.type === 'multiple_choice' ? 'accent' : 'warning'}>
              {exercise.type === 'multiple_choice' ? '🔤 Múltipla escolha' : '🔢 Numérico'}
            </Badge>
            <Badge variant="xp">⚡ {exercise.xp_reward} XP</Badge>
            {exercise.hint && <Badge variant="warning">💡 Tem dica</Badge>}
          </div>

          {/* Question preview */}
          <p style={{
            fontSize: '14px', color: 'var(--color-fg-default)',
            fontWeight: 500, marginBottom: '6px',
            display: '-webkit-box', WebkitLineClamp: expanded ? 999 : 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {exercise.question}
          </p>

          {/* Expanded: show options + answer */}
          {expanded && exercise.type === 'multiple_choice' && exercise.options.length > 0 && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              {exercise.options.map((opt) => (
                <div
                  key={opt.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    padding: '4px 0',
                    color: opt.label === exercise.correct_answer
                      ? 'var(--color-success-fg)'
                      : 'var(--color-fg-muted)',
                    fontWeight: opt.label === exercise.correct_answer ? 600 : 400,
                    fontSize: '13px',
                  }}
                >
                  <span style={{ width: 20, textAlign: 'center' }}>
                    {opt.label === exercise.correct_answer ? '✅' : '○'}
                  </span>
                  <strong>{opt.label.toUpperCase()}.</strong> {opt.text}
                </div>
              ))}
            </div>
          )}

          {expanded && exercise.type === 'numeric_input' && (
            <div style={{
              marginTop: 'var(--space-2)',
              fontSize: '13px', color: 'var(--color-success-fg)', fontWeight: 600,
            }}>
              ✅ Resposta: {exercise.correct_answer} (±{exercise.tolerance})
            </div>
          )}

          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: 'var(--color-accent-fg)',
              marginTop: '4px', padding: 0,
            }}
          >
            {expanded ? '▲ Ocultar detalhes' : '▼ Ver detalhes'}
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
          <Button variant="secondary" size="sm" onClick={onEdit}>✏️</Button>
          <Button variant="danger"    size="sm" onClick={onDelete}>🗑️</Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Professor Exercises Page ─────────────────────────────────────────────────

export default function ProfessorExercisesPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate    = useNavigate();

  const [topic,       setTopic]       = useState<Topic | null>(null);
  const [exercises,   setExercises]   = useState<Exercise[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [exModal,     setExModal]     = useState(false);
  const [editEx,      setEditEx]      = useState<Exercise | undefined>();
  const [deleteEx,    setDeleteEx]    = useState<Exercise | undefined>();

  const id = parseInt(topicId ?? '0');

  const load = async () => {
    setLoading(true);
    try {
      const [t, exs] = await Promise.all([
        topicsApi.getById(id),
        exercisesApi.getByTopic(id),
      ]);
      setTopic(t);
      setExercises(exs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const handleDelete = async () => {
    if (!deleteEx) return;
    await exercisesApi.remove(deleteEx.id);
    setDeleteEx(undefined);
    load();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: 'var(--space-6) var(--space-6)' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-5)', fontSize: '13px' }}>
        <button
          onClick={() => navigate('/professor/modules')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent-fg)', padding: 0, fontSize: '13px' }}
        >
          ← Módulos
        </button>
        <span style={{ color: 'var(--color-fg-muted)' }}>/</span>
        <span style={{ color: 'var(--color-fg-muted)' }}>{topic?.title}</span>
        <span style={{ color: 'var(--color-fg-muted)' }}>/</span>
        <span style={{ color: 'var(--color-fg-muted)' }}>Exercícios</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
            🧩 Exercícios — {topic?.title}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
            {exercises.length} exercício{exercises.length !== 1 ? 's' : ''} cadastrado{exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => { setEditEx(undefined); setExModal(true); }} leftIcon={<span>+</span>}>
          Novo Exercício
        </Button>
      </div>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <EmptyState
          icon="🧩"
          title="Nenhum exercício"
          description="Adicione exercícios a este tópico para os alunos praticarem."
          action={
            <Button onClick={() => { setEditEx(undefined); setExModal(true); }}>
              + Criar Exercício
            </Button>
          }
        />
      ) : (
        exercises.map((ex, i) => (
          <ExerciseListItem
            key={ex.id}
            exercise={ex}
            index={i}
            onEdit={() => { setEditEx(ex); setExModal(true); }}
            onDelete={() => setDeleteEx(ex)}
          />
        ))
      )}

      {/* Exercise form modal */}
      <ExerciseFormModal
        open={exModal}
        onClose={() => { setExModal(false); setEditEx(undefined); }}
        topicId={id}
        initial={editEx}
        onSave={load}
      />

      {/* Confirm delete modal */}
      <Modal open={!!deleteEx} onClose={() => setDeleteEx(undefined)} title="Excluir exercício">
        <p style={{ color: 'var(--color-fg-muted)', marginBottom: 'var(--space-4)' }}>
          Tem certeza que deseja excluir este exercício? O histórico de submissões dos alunos também será removido.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeleteEx(undefined)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
}
