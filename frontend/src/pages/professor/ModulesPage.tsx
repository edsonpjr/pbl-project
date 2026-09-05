import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { modulesApi, topicsApi } from '../../api';
import type { Module, Topic } from '../../types';
import {
  Card, Button, Badge, Input, Textarea,
  Modal, Alert, Spinner, EmptyState, Divider,
} from '../../components/ui';

// ─── Module Form ──────────────────────────────────────────────────────────────

interface ModuleFormData {
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
}

function ModuleFormModal({
  open, onClose, initial, onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Module;
  onSave: () => void;
}) {
  const [form, setForm] = useState<ModuleFormData>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    order_index: initial?.order_index ?? 0,
    is_published: initial?.is_published ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        title: initial?.title ?? '',
        description: initial?.description ?? '',
        order_index: initial?.order_index ?? 0,
        is_published: initial?.is_published ?? false,
      });
      setError('');
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Título é obrigatório'); return; }
    setLoading(true);
    try {
      if (initial) await modulesApi.update(initial.id, form);
      else         await modulesApi.create(form);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao salvar módulo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar Módulo' : 'Novo Módulo'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && <Alert variant="danger">{error}</Alert>}
        <Input
          label="Título"
          placeholder="Ex: Cálculo 1"
          value={form.title}
          onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
          autoFocus
        />
        <Textarea
          label="Descrição"
          placeholder="Descreva o conteúdo deste módulo..."
          value={form.description}
          onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          style={{ minHeight: 90 }}
        />
        <Input
          label="Ordem"
          type="number"
          value={form.order_index}
          onChange={(e) => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: '14px' }}>
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked }))}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 500 }}>Publicado (visível para alunos)</span>
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>{initial ? 'Salvar' : 'Criar Módulo'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Topic Form ───────────────────────────────────────────────────────────────

interface TopicFormData {
  title: string;
  content: string;
  theory: string;
  order_index: number;
  is_published: boolean;
}

function TopicFormModal({
  open, onClose, moduleId, initial, onSave,
}: {
  open: boolean;
  onClose: () => void;
  moduleId: number;
  initial?: Topic;
  onSave: () => void;
}) {
  const [form, setForm] = useState<TopicFormData>({
    title: initial?.title ?? '',
    content: initial?.content ?? '',
    theory: initial?.theory ?? '',
    order_index: initial?.order_index ?? 0,
    is_published: initial?.is_published ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        title: initial?.title ?? '',
        content: initial?.content ?? '',
        theory: initial?.theory ?? '',
        order_index: initial?.order_index ?? 0,
        is_published: initial?.is_published ?? false,
      });
      setError('');
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Título é obrigatório'); return; }
    setLoading(true);
    try {
      if (initial) await topicsApi.update(initial.id, form);
      else         await topicsApi.create(moduleId, form);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erro ao salvar tópico');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar Tópico' : 'Novo Tópico'} width={640}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {error && <Alert variant="danger">{error}</Alert>}
        <Input
          label="Título"
          placeholder="Ex: Limites"
          value={form.title}
          onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
          autoFocus
        />
        <Textarea
          label="Resumo (descrição curta)"
          placeholder="Breve descrição exibida no card..."
          value={form.content}
          onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
          style={{ minHeight: 70 }}
        />
        <Textarea
          label="Teoria (suporta Markdown e LaTeX com $$...$$)"
          placeholder="## O que é um Limite?&#10;&#10;O **limite** de uma função..."
          value={form.theory}
          onChange={(e) => setForm(f => ({ ...f, theory: e.target.value }))}
          style={{ minHeight: 200, fontFamily: 'var(--font-mono)', fontSize: '13px' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Input
            label="Ordem"
            type="number"
            value={form.order_index}
            onChange={(e) => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))}
          />
          <label style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            cursor: 'pointer', fontSize: '14px', paddingTop: '22px',
          }}>
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked }))}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontWeight: 500 }}>Publicado</span>
          </label>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>{initial ? 'Salvar' : 'Criar Tópico'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Topic row ────────────────────────────────────────────────────────────────

function TopicRow({
  topic, onEdit, onDelete, onManageExercises,
}: {
  topic: Topic;
  onEdit: (t: Topic) => void;
  onDelete: (t: Topic) => void;
  onManageExercises: (t: Topic) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--space-3) var(--space-4)',
      background: 'var(--color-canvas-subtle)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border-muted)',
      gap: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '16px' }}>{topic.is_published ? '👁️' : '🔒'}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {topic.title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>
            Ordem: {topic.order_index} · {topic.is_published ? 'Publicado' : 'Rascunho'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
        <Button variant="ghost" size="sm" onClick={() => onManageExercises(topic)}>
          🧩 Exercícios
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onEdit(topic)}>
          ✏️ Editar
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(topic)}>
          🗑️
        </Button>
      </div>
    </div>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────

function ModuleCard({
  module, onEdit, onDelete,
}: {
  module: Module;
  onEdit: (m: Module) => void;
  onDelete: (m: Module) => void;
}) {
  const navigate = useNavigate();
  const [topics,      setTopics]      = useState<Topic[]>([]);
  const [expanded,    setExpanded]    = useState(false);
  const [loadingTop,  setLoadingTop]  = useState(false);
  const [topicModal,  setTopicModal]  = useState(false);
  const [editTopic,   setEditTopic]   = useState<Topic | undefined>();
  const [deleteModal, setDeleteModal] = useState<Topic | undefined>();

  const loadTopics = async () => {
    setLoadingTop(true);
    const list = await topicsApi.getByModule(module.id);
    setTopics(list);
    setLoadingTop(false);
  };

  const handleExpand = () => {
    if (!expanded) loadTopics();
    setExpanded(e => !e);
  };

  const handleDeleteTopic = async (t: Topic) => {
    await topicsApi.remove(t.id);
    setDeleteModal(undefined);
    loadTopics();
  };

  return (
    <>
      <Card style={{ marginBottom: 'var(--space-4)' }}>
        {/* Module header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
                📚 {module.title}
              </h3>
              <Badge variant={module.is_published ? 'success' : 'default'}>
                {module.is_published ? 'Publicado' : 'Rascunho'}
              </Badge>
              <Badge variant="default">Ordem: {module.order_index}</Badge>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-fg-muted)' }}>
              {module.description || 'Sem descrição'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
            <Button variant="secondary" size="sm" onClick={() => onEdit(module)}>✏️ Editar</Button>
            <Button variant="danger"    size="sm" onClick={() => onDelete(module)}>🗑️</Button>
          </div>
        </div>

        <Divider style={{ margin: 'var(--space-3) 0' }} />

        {/* Topics section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 'var(--space-3)' : 0 }}>
            <button
              onClick={handleExpand}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600, color: 'var(--color-accent-fg)',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              {expanded ? '▼' : '▶'} Tópicos {expanded && `(${topics.length})`}
            </button>
            {expanded && (
              <Button
                size="sm"
                onClick={() => { setEditTopic(undefined); setTopicModal(true); }}
              >
                + Novo Tópico
              </Button>
            )}
          </div>

          {expanded && (
            loadingTop ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)' }}>
                <Spinner size={24} />
              </div>
            ) : topics.length === 0 ? (
              <EmptyState
                icon="📄"
                title="Nenhum tópico"
                description="Adicione o primeiro tópico a este módulo."
                action={
                  <Button size="sm" onClick={() => { setEditTopic(undefined); setTopicModal(true); }}>
                    + Criar Tópico
                  </Button>
                }
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {topics.map((t) => (
                  <TopicRow
                    key={t.id}
                    topic={t}
                    onEdit={(t) => { setEditTopic(t); setTopicModal(true); }}
                    onDelete={(t) => setDeleteModal(t)}
                    onManageExercises={(t) => navigate(`/professor/topics/${t.id}/exercises`)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </Card>

      {/* Topic form modal */}
      <TopicFormModal
        open={topicModal}
        onClose={() => { setTopicModal(false); setEditTopic(undefined); }}
        moduleId={module.id}
        initial={editTopic}
        onSave={loadTopics}
      />

      {/* Confirm delete topic modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(undefined)}
        title="Confirmar exclusão"
      >
        <p style={{ color: 'var(--color-fg-muted)', marginBottom: 'var(--space-4)' }}>
          Tem certeza que deseja excluir o tópico <strong>{deleteModal?.title}</strong>?
          Todos os exercícios vinculados serão removidos.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeleteModal(undefined)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteModal && handleDeleteTopic(deleteModal)}>
            Excluir
          </Button>
        </div>
      </Modal>
    </>
  );
}

// ─── Professor Modules Page ───────────────────────────────────────────────────

export default function ProfessorModulesPage() {
  const [modules,     setModules]     = useState<Module[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [moduleModal, setModuleModal] = useState(false);
  const [editModule,  setEditModule]  = useState<Module | undefined>();
  const [deleteModule, setDeleteModule] = useState<Module | undefined>();

  const loadModules = () => {
    modulesApi.getAll().then(setModules).finally(() => setLoading(false));
  };

  useEffect(() => { loadModules(); }, []);

  const handleDeleteModule = async (m: Module) => {
    await modulesApi.remove(m.id);
    setDeleteModule(undefined);
    loadModules();
  };

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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-fg-default)' }}>
            📚 Gerenciar Módulos
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-fg-muted)', marginTop: '4px' }}>
            {modules.length} módulo{modules.length !== 1 ? 's' : ''} cadastrado{modules.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => { setEditModule(undefined); setModuleModal(true); }}
          leftIcon={<span>+</span>}
        >
          Novo Módulo
        </Button>
      </div>

      {/* Modules list */}
      {modules.length === 0 ? (
        <EmptyState
          icon="📚"
          title="Nenhum módulo cadastrado"
          description="Crie o primeiro módulo para começar a estruturar o conteúdo."
          action={
            <Button onClick={() => { setEditModule(undefined); setModuleModal(true); }}>
              + Criar Módulo
            </Button>
          }
        />
      ) : (
        modules.map((m) => (
          <ModuleCard
            key={m.id}
            module={m}
            onEdit={(m) => { setEditModule(m); setModuleModal(true); }}
            onDelete={(m) => setDeleteModule(m)}
          />
        ))
      )}

      {/* Module form modal */}
      <ModuleFormModal
        open={moduleModal}
        onClose={() => { setModuleModal(false); setEditModule(undefined); }}
        initial={editModule}
        onSave={loadModules}
      />

      {/* Confirm delete module modal */}
      <Modal
        open={!!deleteModule}
        onClose={() => setDeleteModule(undefined)}
        title="Confirmar exclusão"
      >
        <p style={{ color: 'var(--color-fg-muted)', marginBottom: 'var(--space-4)' }}>
          Tem certeza que deseja excluir o módulo <strong>{deleteModule?.title}</strong>?
          Todos os tópicos e exercícios serão removidos permanentemente.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setDeleteModule(undefined)}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteModule && handleDeleteModule(deleteModule)}>
            Excluir tudo
          </Button>
        </div>
      </Modal>
    </div>
  );
}
