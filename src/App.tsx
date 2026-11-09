/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { SettingsModal } from './components/modals/SettingsModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { AuthModal } from './components/modals/AuthModal';

import { Dashboard } from './components/dashboard/Dashboard';
import { SubjectsView } from './components/subjects/SubjectsView';
import { GoalsView } from './components/goals/GoalsView';
import { TimetableView } from './components/timetable/TimetableView';
import { HabitsView } from './components/habits/HabitsView';
import { FocusTimerView } from './components/timer/FocusTimerView';
import { NotesView } from './components/notes/NotesView';
import { StatsView } from './components/stats/StatsView';

const MainLayout: React.FC = () => {
  const { activeTab, account, isAuthModalOpen, setIsAuthModalOpen } = useStudy();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Automatically prompt account creation on initial visit if not logged in
  useEffect(() => {
    const hasSeenPrompt = sessionStorage.getItem('study_room_auth_prompt_shown');
    if (!account && !hasSeenPrompt) {
      sessionStorage.setItem('study_room_auth_prompt_shown', 'true');
      setIsAuthModalOpen(true);
    }
  }, [account, setIsAuthModalOpen]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        );
      case 'subjects':
        return <SubjectsView />;
      case 'goals':
        return <GoalsView />;
      case 'timetable':
        return <TimetableView />;
      case 'habits':
        return <HabitsView />;
      case 'timer':
        return <FocusTimerView />;
      case 'notes':
        return <NotesView />;
      case 'stats':
        return <StatsView />;
      default:
        return (
          <Dashboard
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F9FA] dark:bg-[#121417] text-neutral-800 dark:text-neutral-100 antialiased font-sans transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-20 2xl:pb-8">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Tab Navigation */}
      <MobileNav
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Settings & Data Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Cloud Account & Real-time Sync Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <StudyProvider>
      <MainLayout />
    </StudyProvider>
  );
}
