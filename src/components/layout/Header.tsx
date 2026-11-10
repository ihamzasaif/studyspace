import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { formatDateDisplay } from '../../utils/date';
import { Play, Settings, Moon, Sun } from 'lucide-react';
import { playSoftClick } from '../../utils/audio';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenProfile }) => {
  const {
    state,
    activeTab,
    setActiveTab,
    todayStr,
    theme,
    toggleTheme,
    todayStudyMinutes,
    account,
    syncStatus,
    syncNow,
    openAuthModal,
    isTimerRunning,
    timerFormatted,
  } = useStudy();

  const tabTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    goals: 'Daily Goals',
    timetable: 'Timetable',
    subjects: 'Subjects',
    habits: 'Daily Habits',
    timer: 'Focus Timer',
    notes: 'Quick Pad',
    stats: 'Progress & Stats',
    profile: 'Study Profile',
  };

  const currentHours = (todayStudyMinutes / 60).toFixed(1);

  const getInitials = () => {
    if (!state.profile.name.trim()) return 'U';
    const parts = state.profile.name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const [justSynced, setJustSynced] = useState(false);

  const handleManualSync = async () => {
    playSoftClick();
    await syncNow();
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 bg-[#F8F9FA]/90 dark:bg-[#121417]/90 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/60 transition-colors">
      {/* Left Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
          {tabTitles[activeTab] || 'Study Room'}
        </h2>
        <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700" aria-hidden="true">·</span>
        <span className="hidden sm:inline text-xs text-neutral-500 dark:text-neutral-400">
          {formatDateDisplay(todayStr)}
        </span>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-2">
        {/* Real-time Cloud Sync Status */}
        {account ? (
          <button
            onClick={handleManualSync}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/60 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            title="Real-time Cloud Sync Active (Click to force sync now)"
          >
            {syncStatus === 'syncing' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="hidden sm:inline text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Syncing</span>
              </>
            ) : syncStatus === 'error' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="hidden sm:inline text-[11px] text-rose-500">Retry Sync</span>
              </>
            ) : justSynced ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Synced Now ✓</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="hidden sm:inline text-[11px] text-neutral-600 dark:text-neutral-400">Synced</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={openAuthModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors shrink-0 shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>Sync Account</span>
          </button>
        )}

        {/* Today's study time counter */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-300">
          <span className="text-neutral-400 dark:text-neutral-500">Today:</span>
          <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {currentHours}h
          </span>
        </div>

        {/* Quick Start / Running Focus Timer button */}
        {activeTab !== 'timer' && (
          <button
            onClick={() => {
              playSoftClick();
              setActiveTab('timer');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all shrink-0 ${
              isTimerRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
            }`}
            title={isTimerRunning ? 'Timer is running in background - click to open' : 'Start Focus Timer'}
          >
            {isTimerRunning ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                <span className="font-mono tabular-nums">{timerFormatted}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden xs:inline">Focus</span>
              </>
            )}
          </button>
        )}

        {/* User Profile Quick Avatar Button */}
        <button
          onClick={() => {
            playSoftClick();
            onOpenProfile();
          }}
          className="flex items-center gap-2 p-1 pl-2.5 rounded-lg bg-white dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700/60 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors"
          title="Account & Profile Settings"
        >
          <span className="hidden sm:inline font-medium text-neutral-800 dark:text-neutral-200 break-words max-w-[120px] leading-tight">
            {account?.displayName || state.profile.name || 'Account'}
          </span>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[10px] shrink-0"
            style={{ backgroundColor: account?.avatarColor || state.profile.avatarColor || '#0d9488' }}
          >
            {getInitials()}
          </div>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => {
            playSoftClick();
            toggleTheme();
          }}
          className="flex p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings button */}
        <button
          onClick={() => {
            playSoftClick();
            onOpenSettings();
          }}
          className="flex p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors"
          title="Preferences & Backup"
          aria-label="Preferences"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
