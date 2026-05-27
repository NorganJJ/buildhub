import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import Layout from './components/layout/Layout'
import CataloguePage from './pages/CataloguePage'
import ProjectPage from './pages/ProjectPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import MyProjectsPage from './pages/MyProjectsPage'
import CreateProjectPage from './pages/CreateProjectPage'
import EditProjectPage from './pages/EditProjectPage'
import SettingsPage from './pages/SettingsPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import OAuthCallbackPage from './pages/OAuthCallbackPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<CataloguePage />} />
          <Route path="project/:slug" element={<ProjectPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="u/:username" element={<ProfilePage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="my-projects" element={<ProtectedRoute><MyProjectsPage /></ProtectedRoute>} />
          <Route path="my-projects/new" element={<ProtectedRoute><CreateProjectPage /></ProtectedRoute>} />
          <Route path="my-projects/:id/edit" element={<ProtectedRoute><EditProjectPage /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
