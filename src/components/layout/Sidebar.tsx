import React from 'react';
import { useStudy } from '../../context/StudyContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BookOpen,
  Sparkles,
  Timer,
  FileText,
  BarChart3,
  Moon,
  Sun,
  Settings,
  Flame,
} from 'lucide-react';
import { playSoftClick } from '../../utils/audio';

interface SidebarProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings, onOpenProfile }) => {
  const { state, activeTab, setActiveTab, theme, toggleTheme, studyStreak, account, openAuthModal } = useStudy();

  const getInitials = () => {
    const rawName = account?.displayName || state.profile.name;
    if (!rawName.trim()) return 'S';
    const parts = rawName.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Daily Goals', icon: CheckSquare },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'habits', label: 'Daily Habits', icon: Sparkles },
    { id: 'timer', label: 'Focus Timer', icon: Timer },
    { id: 'notes', label: 'Quick Pad', icon: FileText },
    { id: 'stats', label: 'Progress & Stats', icon: BarChart3 },
  ];

  return (
    <aside className="hidden xl:flex flex-col w-64 h-screen shrink-0 bg-white dark:bg-[#16181D] border-r border-neutral-200/80 dark:border-neutral-800/80 select-none transition-colors">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 h-18 border-b border-neutral-200/60 dark:border-neutral-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
            S
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              Study Room
            </h1>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
              Personal Study Space
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="px-4 pt-3 pb-1">
        <button
          onClick={() => {
            playSoftClick();
            onOpenProfile();
          }}
          className="w-full text-left p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-800/60 transition-all flex items-center gap-3 group"
          title="Click to edit profile"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0"
            style={{ backgroundColor: account?.avatarColor || state.profile.avatarColor || '#0d9488' }}
          >
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 break-words leading-tight">
              {account?.displayName || state.profile.name || 'Setup Profile'}
            </p>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 break-words mt-0.5 leading-tight">
              {account ? `@${account.username}` : (state.profile.profession || 'Click to add profession')}
            </p>
          </div>
        </button>
      </div>

      {/* Cloud Sync Status */}
      <div className="px-4 py-1.5">
        {account ? (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/50 text-[11px] text-teal-800 dark:text-teal-300">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Real-time Synced</span>
            </span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">Cloud Active</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              playSoftClick();
              openAuthModal();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            <span>Create Account / Sync</span>
          </button>
        )}
      </div>

      {/* Streak Ribbon */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-medium">Streak</span>
          </div>
          <span className="font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {studyStreak} {studyStreak === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                playSoftClick();
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left whitespace-nowrap ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/40'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-teal-600 dark:text-teal-400' : 'text-neutral-400 dark:text-neutral-500'
                }`}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Utility Controls */}
      <div className="p-3 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
        <button
          onClick={() => {
            playSoftClick();
            toggleTheme();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          aria-label="Toggle dark mode"
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-500" />
            )}
            <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          </div>
          <span className="text-[11px] text-neutral-400 capitalize">{theme}</span>
        </button>

        <button
          onClick={() => {
            playSoftClick();
            onOpenSettings();
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
        >
          <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span>Preferences & Data</span>
        </button>
      </div>
    </aside>
  );
};
