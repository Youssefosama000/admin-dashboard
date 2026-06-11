import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import TopBar  from './components/TopBar';
import Login                  from './pages/Login';
import Overview               from './pages/Overview';
import RestaurantApplications from './pages/RestaurantApplications';
import MealsApproval          from './pages/MealsApproval';
import Restaurants            from './pages/Restaurants';
import { session } from './services/api';
import { logout as apiLogout } from './services/auth';

function DashboardShell({ user, onLogout }) {
  return (
    <div className="app-shell">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="app-main">
        <TopBar user={user} onLogout={onLogout} />
        <main className="app-content">
          <Routes>
            <Route path="/"            element={<Overview />}               />
            <Route path="/restaurants" element={<RestaurantApplications />} />
            <Route path="/activate"    element={<Restaurants />}            />
            <Route path="/meals"       element={<MealsApproval />}          />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  // Persist session across page refreshes via localStorage flag
  const [user, setUser] = useState(() => {
    if (!session.isLoggedIn()) return null;
    return { name: session.getName(), email: session.getEmail() };
  });

  function handleLogin(result) {
    setUser({ name: result.name ?? 'Admin', email: result.email ?? '' });
  }

  function handleLogout() {
    apiLogout();
    setUser(null);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/*"
          element={
            user
              ? <DashboardShell user={user} onLogout={handleLogout} />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
