import axios from 'axios';
import type {
  AuthResponse, User, Module, Topic, Exercise,
  SubmissionResult, Submission, Progress, ApiResponse
} from '../types';

/**
 * Detecta a URL do backend automaticamente.
 *
 * - GitHub Codespaces: substitui porta do hostname atual por 8080
 *   Ex: https://xxxx-5173.app.github.dev → https://xxxx-8080.app.github.dev
 * - Desenvolvimento local: usa VITE_API_URL ou http://localhost:8080
 * - Docker (nginx proxy): usa caminho relativo ''
 */
function resolveApiUrl(): string {
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit && explicit !== 'auto') return explicit;

  const { hostname, protocol } = window.location;

  // GitHub Codespaces
  if (hostname.includes('.app.github.dev')) {
    const backendHost = hostname.replace(/-\d+\.app\.github\.dev/, '-8080.app.github.dev');
    return `${protocol}//${backendHost}`;
  }

  // Gitpod
  if (hostname.includes('.gitpod.io')) {
    const backendHost = hostname.replace(/^\d+-/, '8080-');
    return `${protocol}//${backendHost}`;
  }

  // Docker com nginx proxy (porta 80, sem localhost)
  if (!hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    return '';
  }

  // Desenvolvimento local
  return 'http://localhost:8080';
}

const BASE_URL = resolveApiUrl();

// ─── Cliente Axios base ───────────────────────────────────────────────────────

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: injeta token JWT em cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pbl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: redireciona para login em 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pbl_token');
      localStorage.removeItem('pbl_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Helper para extrair dados da resposta padrão ─────────────────────────────

function extract<T>(res: { data: ApiResponse<T> }): T {
  return res.data.data;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password })
       .then(extract),

  register: (name: string, email: string, password: string, role: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', { name, email, password, role })
       .then(extract),

  me: () =>
    api.get<ApiResponse<User>>('/auth/me').then(extract),
};

// ─── Users API ────────────────────────────────────────────────────────────────

export const usersApi = {
  getAll: () =>
    api.get<ApiResponse<User[]>>('/users').then(extract),

  getById: (id: number) =>
    api.get<ApiResponse<User>>(`/users/${id}`).then(extract),

  update: (id: number, data: Partial<User> & { password?: string }) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data).then(extract),

  remove: (id: number) =>
    api.delete<ApiResponse<null>>(`/users/${id}`).then(extract),

  getRanking: (limit = 10) =>
    api.get<ApiResponse<User[]>>(`/users/ranking?limit=${limit}`).then(extract),
};

// ─── Modules API ──────────────────────────────────────────────────────────────

export const modulesApi = {
  getAll: () =>
    api.get<ApiResponse<Module[]>>('/modules').then(extract),

  getById: (id: number) =>
    api.get<ApiResponse<Module>>(`/modules/${id}`).then(extract),

  create: (data: Partial<Module>) =>
    api.post<ApiResponse<Module>>('/modules', data).then(extract),

  update: (id: number, data: Partial<Module>) =>
    api.put<ApiResponse<Module>>(`/modules/${id}`, data).then(extract),

  remove: (id: number) =>
    api.delete<ApiResponse<null>>(`/modules/${id}`).then(extract),
};

// ─── Topics API ───────────────────────────────────────────────────────────────

export const topicsApi = {
  getByModule: (moduleId: number) =>
    api.get<ApiResponse<Topic[]>>(`/modules/${moduleId}/topics`).then(extract),

  getById: (id: number) =>
    api.get<ApiResponse<Topic>>(`/topics/${id}`).then(extract),

  create: (moduleId: number, data: Partial<Topic>) =>
    api.post<ApiResponse<Topic>>(`/modules/${moduleId}/topics`, data).then(extract),

  update: (id: number, data: Partial<Topic>) =>
    api.put<ApiResponse<Topic>>(`/topics/${id}`, data).then(extract),

  remove: (id: number) =>
    api.delete<ApiResponse<null>>(`/topics/${id}`).then(extract),
};

// ─── Exercises API ────────────────────────────────────────────────────────────

export const exercisesApi = {
  getByTopic: (topicId: number) =>
    api.get<ApiResponse<Exercise[]>>(`/topics/${topicId}/exercises`).then(extract),

  getById: (id: number) =>
    api.get<ApiResponse<Exercise>>(`/exercises/${id}`).then(extract),

  create: (topicId: number, data: Partial<Exercise> & { correct_answer: string }) =>
    api.post<ApiResponse<Exercise>>(`/topics/${topicId}/exercises`, data).then(extract),

  update: (id: number, data: Partial<Exercise>) =>
    api.put<ApiResponse<Exercise>>(`/exercises/${id}`, data).then(extract),

  remove: (id: number) =>
    api.delete<ApiResponse<null>>(`/exercises/${id}`).then(extract),

  submit: (exerciseId: number, answer: string) =>
    api.post<ApiResponse<SubmissionResult>>(`/exercises/${exerciseId}/submit`, { answer })
       .then(extract),
};

// ─── Progress API ─────────────────────────────────────────────────────────────

export const progressApi = {
  getMyProgress: () =>
    api.get<ApiResponse<Progress[]>>('/progress/me').then(extract),

  getProgressByTopic: (topicId: number) =>
    api.get<ApiResponse<Progress>>(`/progress/me/${topicId}`).then(extract),

  getMySubmissions: () =>
    api.get<ApiResponse<Submission[]>>('/submissions/me').then(extract),
};

export default api;
