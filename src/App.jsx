import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from './components/Layout.jsx';
import ChatWidget from './components/chat/ChatWidget.jsx';
import ToastViewport, { toast } from './components/ui/Toast.jsx';
import { useAppStore } from './store/appStore.js';
import { useAlertsEngine } from './hooks/useAlertsEngine.js';

import Home from './routes/Home.jsx';
import Onboarding from './routes/Onboarding.jsx';
import Dashboard from './routes/Dashboard.jsx';
import Plan from './routes/Plan.jsx';
import Checklist from './routes/Checklist.jsx';
import Travel from './routes/Travel.jsx';
import Community from './routes/Community.jsx';
import Recovery from './routes/Recovery.jsx';
import Login from './routes/Login.jsx';
import Profile from './routes/Profile.jsx';
import { useAuth } from './hooks/useAuth.js';

/** Runs the background alerts engine and surfaces new alerts as toasts. */
function AlertsRunner() {
  const profile = useAppStore((s) => s.profile);
  const language = useAppStore((s) => s.language);
  const alertHistory = useAppStore((s) => s.alertHistory);
  useAlertsEngine(profile?.location || null, language);

  // Toast the newest alert when it appears.
  useEffect(() => {
    if (alertHistory[0] && Date.now() - alertHistory[0].firedAt < 5000) {
      toast(alertHistory[0].message, 'alert');
    }
  }, [alertHistory]);

  return null;
}

export default function App() {
  const { i18n } = useTranslation();
  const language = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  // Initialize auth-state syncing at the app root.
  useAuth();

  // Keep i18n + <html> class in sync with persisted store on load.
  useEffect(() => {
    if (i18n.language !== language) i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/checklist" element={<Checklist />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/community" element={<Community />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <ChatWidget />
      <ToastViewport />
      <AlertsRunner />
    </>
  );
}
