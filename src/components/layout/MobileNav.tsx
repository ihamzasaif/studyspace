import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Timer,
  MoreHorizontal,
  BookOpen,
  Sparkles,
  FileText,
  BarChart3,
  Settings,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { playSoftClick } from '../../utils/audio';

interface MobileNavProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenSettings, onOpenProfile }) => {
  const { state, activeTab, setActiveTab, theme, toggleTheme } = useStudy();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'goals', label: 'Goals', icon: CheckSquare },
    { id: 'timetable', label: 'Schedule', icon: Calendar },
    { id: 'timer', label: 'Focus', icon: Timer },
  ];

  const moreItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'habits', label: 'Daily Habits', icon: Sparkles },
    { id: 'notes', label: 'Quick Pad', icon: FileText },
    { id: 'stats', label: 'Progress & Stats', icon: BarChart3 },
  ];

  return (
    <>
      {/* More Drawer */}
      {isMoreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-t-2xl p-5 border-t border-neutral-200 dark:border-neutral-800 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                All Sections & Profile
              </span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile banner inside drawer */}
            <button
              onClick={() => {
                setIsMoreOpen(false);
                onOpenProfile();
              }}
              className="w-full text-left p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: state.profile.avatarColor || '#0d9488' }}
              >
                {state.profile.name ? state.profile.name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-teal-900 dark:text-teal-200 truncate">
                  {state.profile.name || 'Setup Your Profile'}
                </p>
                <p className="text-[11px] text-teal-700/80 dark:text-teal-400 truncate">
                  {state.profile.profession || 'Set name, profession & target'}
                </p>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      playSoftClick();
                      setActiveTab(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  onOpenSettings();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                <Settings className="w-4 h-4" />
                <span>Preferences</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#16181D]/95 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800/80 px-2 py-1.5 flex items-center justify-around"
        aria-label="Mobile Navigation"
      >
        {mainTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                playSoftClick();
                setActiveTab(item.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-teal-700 dark:text-teal-400 font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => {
            playSoftClick();
            setIsMoreOpen(true);
          }}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition-colors ${
            ['subjects', 'habits', 'notes', 'stats'].includes(activeTab)
              ? 'text-teal-700 dark:text-teal-400 font-semibold'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
