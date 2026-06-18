import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Boletines from './pages/Boletines';
import Agenda from './pages/Agenda';
import Directorio from './pages/Directorio';
import Reportes from './pages/Reportes';
import FacebookPanel from './pages/FacebookPanel';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard"  element={<Dashboard />} />
        <Route path="/boletines"  element={<Boletines />} />
        <Route path="/agenda"     element={<Agenda />} />
        <Route path="/directorio" element={<Directorio />} />
        <Route path="/reportes"   element={<Reportes />} />
        <Route path="/facebook"   element={<FacebookPanel />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
