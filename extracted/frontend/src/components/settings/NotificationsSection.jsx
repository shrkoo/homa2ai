import React from 'react';
import { Bell } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { usePref } from '@/hooks/usePref';
import SettingsSection from './SettingsSection';
import ToggleRow from './ToggleRow';

export default function NotificationsSection() {
  const { t } = useI18n();
  const [send, setSend] = usePref('homa_notif_send', true);
  const [receive, setReceive] = usePref('homa_notif_receive', false);
  const [jobDone, setJobDone] = usePref('homa_notif_job_done', true);

  return (
    <SettingsSection title={t('notifications')} icon={Bell}>
      <ToggleRow label={t('sound_on_send')} desc={t('notifications_desc')} checked={send} onChange={setSend} />
      <div className="h-px bg-border my-1" />
      <ToggleRow label={t('sound_on_receive')} checked={receive} onChange={setReceive} />
      <div className="h-px bg-border my-1" />
      <ToggleRow label={t('sound_on_job_done') || 'اعلان اتمام کار'} desc={t('sound_on_job_done_desc') || 'صدای اعلان هنگام آماده شدن تولید ویدیو و تصویر'} checked={jobDone} onChange={setJobDone} />
    </SettingsSection>
  );
}