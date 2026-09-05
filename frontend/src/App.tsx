import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Navbar from './components/layout/Navbar';

// Pages
import { LoginPage, RegisterPage }       from './pages/auth';
import LearnPage                          from './pages/student/LearnPage';
import TopicPage                          from './pages/student/TopicPage';
import { RankingPage, ProgressPage }      from './pages/student/RankingAndProgress';
import ProfessorModulesPage               from './pages/professor/ModulesPage';
import ProfessorExercisesPage             from './pages/professor/ExercisesPage';
import { UsersPage, ProfilePage }         from './pages/professor/UsersAndProfile';

// ─── Guarda de rota autenticada ───────────────────────────────────────────────

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuth } = useAuthStore();
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
}

// ─── Guarda exclusiva para professor ─────────────────────────────────────────

function ProfessorRoute({ children }: { children: React.ReactNode }) {
  const { isAuth, user } = useAuthStore();
  if (!isAuth) return <Navigate to="/login" replace />;
  if (user?.role !== 'professor') return <Navigate to="/learn" replace />;
  return <>{children}</>;
}

// ─── Guarda exclusiva para aluno ─────────────────────────────────────────────

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { isAuth, user } = useAuthStore();
  if (!isAuth) return <Navigate to="/login" replace />;
  if (user?.role !== 'student') return <Navigate to="/professor/modules" replace />;
  return <>{children}</>;
}

// ─── Layout com Navbar ────────────────────────────────────────────────────────

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-canvas-subtle)' }}>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 56px)' }}>
        {children}
      </main>
    </div>
  );
}

// ─── Redirect inteligente na raiz ─────────────────────────────────────────────

function HomeRedirect() {
  const { isAuth, user } = useAuthStore();
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === 'professor' ? '/professor/modules' : '/learn'} replace />;
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Root redirect */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Student routes */}
        <Route path="/learn" element={
          <StudentRoute>
            <AppLayout><LearnPage /></AppLayout>
          </StudentRoute>
        } />
        <Route path="/learn/topic/:id" element={
          <StudentRoute>
            <AppLayout><TopicPage /></AppLayout>
          </StudentRoute>
        } />
        <Route path="/ranking" element={
          <PrivateRoute>
            <AppLayout><RankingPage /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/progress" element={
          <StudentRoute>
            <AppLayout><ProgressPage /></AppLayout>
          </StudentRoute>
        } />

        {/* Shared profile */}
        <Route path="/profile" element={
          <PrivateRoute>
            <AppLayout><ProfilePage /></AppLayout>
          </PrivateRoute>
        } />

        {/* Professor routes */}
        <Route path="/professor/modules" element={
          <ProfessorRoute>
            <AppLayout><ProfessorModulesPage /></AppLayout>
          </ProfessorRoute>
        } />
        <Route path="/professor/topics/:topicId/exercises" element={
          <ProfessorRoute>
            <AppLayout><ProfessorExercisesPage /></AppLayout>
          </ProfessorRoute>
        } />
        <Route path="/professor/users" element={
          <ProfessorRoute>
            <AppLayout><UsersPage /></AppLayout>
          </ProfessorRoute>
        } />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
