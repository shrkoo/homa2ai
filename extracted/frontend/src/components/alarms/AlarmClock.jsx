import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlarmClock as AlarmClockIcon } from 'lucide-react';
import { alarms as alarmStoreAlarms } from '@/lib/alarmStore';
import { useI18n } from '@/i18n/I18nContext';
import { computeNextTrigger } from '@/hooks/useAlarmEngine';

const pad = (n) => String(n).padStart(2, '0');

export default function AlarmClock({ refreshKey = 0 }) {
  const { t } = useI18n();
  const [now, setNow] = useState(new Date());
  const [alarms, setAlarms] = useState([]);

  // Tick every second — real-time device clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const a = await alarmStoreAlarms.filter({ active: true });
        if (active) setAlarms(a);
      } catch {}
    })();
    return () => { active = false; };
  }, [refreshKey]);

  // Next upcoming alarm (earliest next_trigger in the future)
  const nextAlarm = useMemo(() => {
    const upcoming = alarms
      .map((a) => {
        const nt = a.next_trigger ? new Date(a.next_trigger) : computeNextTrigger(a, now);
        return { alarm: a, when: nt };
      })
      .filter((x) => x.when && !isNaN(x.when) && x.when > now)
      .sort((a, b) => a.when - b.when);
    return upcoming[0] || null;
  }, [alarms, now]);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';

  const currentTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const nextAlarmTimeStr = nextAlarm
    ? `${pad(nextAlarm.when.getHours())}:${pad(nextAlarm.when.getMinutes())}:${pad(nextAlarm.when.getSeconds())}`
    : '--:--:--';

  const countdownStr = useMemo(() => {
    if (!nextAlarm) return '--:--:--';
    const diff = Math.max(0, Math.floor((nextAlarm.when.getTime() - now.getTime()) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }, [nextAlarm, now]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      {/* Current time */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock size={14} />
        <span className="text-xs font-medium">{t('current_time') || 'زمان فعلی'}</span>
        <span className="text-[10px] ms-auto opacity-60">{tz}</span>
      </div>
      <div className="text-center text-4xl font-bold font-heading tabular-nums tracking-wider">
        {currentTimeStr}
      </div>

      {/* Next alarm + countdown */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2 min-w-0">
          <AlarmClockIcon size={16} className="text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground leading-tight">{t('next_alarm') || 'آلارم بعدی'}</p>
            <p className="text-sm font-semibold tabular-nums truncate">{nextAlarmTimeStr}</p>
          </div>
        </div>
        <div className="text-end">
          <p className="text-[11px] text-muted-foreground leading-tight">{t('countdown') || 'مانده'}</p>
          <p className="text-sm font-bold tabular-nums text-primary">{countdownStr}</p>
        </div>
      </div>
      {nextAlarm && (
        <p className="text-xs text-muted-foreground truncate text-center pt-1">
          {nextAlarm.alarm.title}
        </p>
      )}
    </div>
  );
}