// ─── Usuários ─────────────────────────────────────────────────────────────────

export type Role = 'student' | 'professor';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  xp: number;
  rank?: number;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Módulos ──────────────────────────────────────────────────────────────────

export interface Module {
  id: number;
  title: string;
  description: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  topics?: Topic[];
}

// ─── Tópicos ─────────────────────────────────────────────────────────────────

export interface Topic {
  id: number;
  module_id: number;
  title: string;
  content: string;
  theory: string;
  order_index: number;
  is_published: boolean;
  created_at: string;
  exercises?: Exercise[];
  progress?: Progress;
}

// ─── Exercícios ───────────────────────────────────────────────────────────────

export type ExerciseType = 'multiple_choice' | 'numeric_input';

export interface Choice {
  label: string;
  text: string;
}

export interface Exercise {
  id: number;
  topic_id: number;
  type: ExerciseType;
  question: string;
  hint: string;
  correct_answer?: string; // só presente para professor
  options: Choice[];
  tolerance: number;
  xp_reward: number;
  order_index: number;
  created_at: string;
}

// ─── Submissões ───────────────────────────────────────────────────────────────

export interface SubmissionResult {
  submission_id: number;
  is_correct: boolean;
  xp_earned: number;
  already_solved: boolean;
  feedback: string;
  correct_answer: string;
}

export interface Submission {
  id: number;
  exercise_id: number;
  user_answer: string;
  is_correct: boolean;
  xp_earned: number;
  submitted_at: string;
}

// ─── Progresso ────────────────────────────────────────────────────────────────

export interface Progress {
  id?: number;
  user_id: number;
  topic_id: number;
  completed_exercises: number;
  total_exercises: number;
  xp_earned: number;
  completion_pct: number;
  is_completed: boolean;
  last_activity?: string;
}

// ─── API response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}
