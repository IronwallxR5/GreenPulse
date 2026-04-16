import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';

const Layout = lazy(() => import('./components/layout/Layout'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const GoogleCallback = lazy(() => import('./pages/Auth/GoogleCallback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectView = lazy(() => import('./pages/ProjectView'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));

function RouteLoader() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center">
      <div className="flex items-center gap-2 rounded-full border border-warm-200 bg-white px-4 py-2 text-sm text-warm-600 shadow-warm-sm">
        <span className="h-2.5 w-2.5 rounded-full bg-forest-500 animate-pulseSoft" />
        Loading view...
      </div>
    </div>
  );
}

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<RouteLoader />}>
      <div className="route-enter">{children}</div>
    </Suspense>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LazyPage><Login /></LazyPage>} />
        <Route path="/register" element={<LazyPage><Register /></LazyPage>} />
        <Route path="/auth/callback" element={<LazyPage><GoogleCallback /></LazyPage>} />
        
        <Route
          path="/"
          element={
            <LazyPage>
              <ProtectedRoute><Layout /></ProtectedRoute>
            </LazyPage>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects/:id" element={<ProjectView />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        <Route path="*" element={
          <div className="flex items-center justify-center h-screen">
            <h1 className="text-2xl font-bold">404 - Not Found</h1>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
