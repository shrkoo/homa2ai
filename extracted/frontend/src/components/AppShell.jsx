import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '@/lib/AuthContext';
import { useAlarmEngine } from '@/hooks/useAlarmEngine';
import AlarmOverlay from '@/components/alarms/AlarmOverlay';

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && user && !user.onboarding_completed && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [user, isLoadingAuth, location.pathname, navigate]);

  const { activeAlarm, dismissAlarm, snoozeAlarm, completeAlarm } = useAlarmEngine();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="min-h-dvh lg:ms-64">
        <Outlet context={{ openSidebar: () => setOpen(true) }} />
      </main>
      {activeAlarm && (
        <AlarmOverlay
          entry={activeAlarm}
          onDismiss={dismissAlarm}
          onSnooze={snoozeAlarm}
          onComplete={completeAlarm}
        />
      )}
    </div>
  );
}