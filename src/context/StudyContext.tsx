import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  StudyState,
  Subject,
  Goal,
  TimetableBlock,
  Habit,
  StudySession,
  Note,
  ExamCountdown,
  UserSettings,
  ActiveTab,
  UserProfile,
  AppAccount,
  SyncStatus,
} from '../types';
import { subscribeToAuth, logoutUser } from '../firebase/authService';
import {
  saveStudyStateToCloud,
  subscribeToCloudStudyState,
  getCloudStudyState,
} from '../firebase/syncService';
import { testFirestoreConnection, auth } from '../firebase/config';
import {
  loadStudyState,
  saveStudyState,
  getInitialSampleData,
  clearAllData,
  exportDataAsJSON,
  importDataFromJSON,
} from '../utils/storage';
import {
  getTodayString,
  addDays,
  calculateHabitStreak,
  calculateOverallStudyStreak,
  getWeekDates,
} from '../utils/date';
import confetti from 'canvas-confetti';

interface StudyContextType {
  state: StudyState;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedSubjectId: string | null;
  setSelectedSubjectId: (id: string | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Account & Sync
  account: AppAccount | null;
  syncStatus: SyncStatus;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;

  // Profile
  updateProfile: (updates: Partial<UserProfile>) => void;

  // Subjects
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt'>) => Subject;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  getSubject: (id: string) => Subject | undefined;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'order'>) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  toggleGoal: (id: string) => void;
  deleteGoal: (id: string) => void;
  reorderGoals: (dateStr: string, reorderedIds: string[]) => void;
  carryOverUnfinishedGoals: (fromDateStr?: string) => number;

  // Timetable
  addTimetableBlock: (block: Omit<TimetableBlock, 'id'>) => TimetableBlock;
  updateTimetableBlock: (id: string, updates: Partial<TimetableBlock>) => void;
  deleteTimetableBlock: (id: string) => void;

  // Habits
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabitDay: (habitId: string, dateStr: string) => void;

  // Study Sessions
  addStudySession: (session: Omit<StudySession, 'id' | 'timestamp'>) => void;
  deleteStudySession: (id: string) => void;

  // Notes
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  // Exam Countdown
  setExamCountdown: (exam: ExamCountdown | null) => void;

  // Settings
  updateSettings: (updates: Partial<UserSettings>) => void;

  // System actions
  resetToSampleData: () => void;
  clearData: () => void;
  exportData: () => void;
  importData: (jsonStr: string) => void;

  // Computed metrics
  todayStr: string;
  todayStudyMinutes: number;
  todayGoals: Goal[];
  todayCompletedGoalsCount: number;
  todayHabitsCompletedCount: number;
  studyStreak: number;
  weeklyStudyHours: { day: string; date: string; hours: number; isToday: boolean }[];
  subjectStats: { subject: Subject; hours: number; totalGoals: number; completedGoals: number; percentage: number }[];
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const StudyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StudyState>(() => loadStudyState());
  const [activeTab, setActiveTabState] = useState<ActiveTab>('dashboard');
  const activeTabRef = useRef<ActiveTab>(activeTab);
  activeTabRef.current = activeTab;

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('study_room_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const todayStr = getTodayString();

  // Tab navigation with browser history: Dashboard is always Home base
  const setActiveTab = (newTab: ActiveTab) => {
    if (newTab === activeTabRef.current) return;

    const prevTab = activeTabRef.current;
    activeTabRef.current = newTab;
    setActiveTabState(newTab);

    if (newTab === 'dashboard') {
      window.history.replaceState({ type: 'tab', tab: 'dashboard' }, '', '#dashboard');
    } else {
      // If navigating from dashboard, push new tab on top of dashboard
      // If already on another tab, replace so history stack is always [dashboard, currentTab]
      if (prevTab === 'dashboard') {
        window.history.pushState({ type: 'tab', tab: newTab }, '', `#${newTab}`);
      } else {
        window.history.replaceState({ type: 'tab', tab: newTab }, '', `#${newTab}`);
      }
    }
  };

  // Sync with browser back/forward history
  useEffect(() => {
    const validTabs: ActiveTab[] = [
      'dashboard',
      'subjects',
      'goals',
      'timetable',
      'habits',
      'timer',
      'notes',
      'stats',
      'profile',
    ];

    const initialHash = window.location.hash.replace('#', '').split('-')[0] as ActiveTab;
    const initialTab = validTabs.includes(initialHash) ? initialHash : 'dashboard';

    if (initialTab !== 'dashboard') {
      window.history.replaceState({ type: 'tab', tab: 'dashboard' }, '', '#dashboard');
      window.history.pushState({ type: 'tab', tab: initialTab }, '', `#${initialTab}`);
    } else {
      window.history.replaceState({ type: 'tab', tab: 'dashboard' }, '', '#dashboard');
    }

    if (initialTab !== activeTabRef.current) {
      activeTabRef.current = initialTab;
      setActiveTabState(initialTab);
    }

    const handlePopState = (e: PopStateEvent) => {
      // If the state is a modal or if a modal was popped, let modal hooks handle closing
      if (e.state?.type === 'modal') {
        return;
      }

      // If returning to a tab state, stay on that tab if already there
      if (e.state?.type === 'tab' && e.state?.tab) {
        if (e.state.tab === activeTabRef.current) {
          // Already on this tab, do not redirect to dashboard!
          return;
        }
        activeTabRef.current = e.state.tab;
        setActiveTabState(e.state.tab);
        return;
      }

      // If user was on ANY non-dashboard tab, Back returns to Dashboard (Home)
      if (activeTabRef.current !== 'dashboard') {
        activeTabRef.current = 'dashboard';
        setActiveTabState('dashboard');
        window.history.replaceState({ type: 'tab', tab: 'dashboard' }, '', '#dashboard');
        return;
      }

      // If already on dashboard and back was pressed, keep them on dashboard (don't exit app)
      window.history.pushState({ type: 'tab', tab: 'dashboard' }, '', '#dashboard');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keep HTML class in sync with theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('study_room_theme', theme);
  }, [theme]);

  // Account and Cloud Sync State
  const [account, setAccount] = useState<AppAccount | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isIncomingCloudUpdateRef = useRef(false);
  const cloudSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((userAccount) => {
      setAccount(userAccount);
      if (userAccount) {
        testFirestoreConnection();
        // Update user profile fields if present in user account
        setState((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            name: userAccount.displayName || prev.profile.name,
            profession: userAccount.profession || prev.profile.profession,
            institution: userAccount.institution || prev.profile.institution,
            avatarColor: userAccount.avatarColor || prev.profile.avatarColor,
          },
        }));
      } else {
        setSyncStatus('offline');
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to remote Firestore studyData document for instant multi-device synchronization
  useEffect(() => {
    // Only subscribe to Firestore cloud if an active authenticated Firebase user exists
    if (!auth.currentUser || !account?.uid || auth.currentUser.uid !== account.uid) {
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');
    const unsubscribe = subscribeToCloudStudyState(
      account.uid,
      (cloudState) => {
        isIncomingCloudUpdateRef.current = true;
        setState((currentLocal) => ({
          ...currentLocal,
          ...cloudState,
          profile: { ...currentLocal.profile, ...cloudState.profile },
          settings: { ...currentLocal.settings, ...cloudState.settings },
        }));
        setSyncStatus('synced');
        setTimeout(() => {
          isIncomingCloudUpdateRef.current = false;
        }, 120);
      },
      (error) => {
        console.warn('Real-time sync subscription notice:', error);
        setSyncStatus('synced');
      }
    );

    // Initial check: if cloud has no document yet for this user, upload current local state
    getCloudStudyState(account.uid).then((cloudData) => {
      if (!cloudData) {
        saveStudyStateToCloud(account.uid, state).catch(() => {});
      }
    }).catch(() => {});

    return () => unsubscribe();
  }, [account?.uid]);

  // Persist state changes locally AND continuously sync to cloud if authenticated
  useEffect(() => {
    saveStudyState(state);

    if (
      auth.currentUser &&
      account?.uid &&
      auth.currentUser.uid === account.uid &&
      !isIncomingCloudUpdateRef.current
    ) {
      setSyncStatus('syncing');
      if (cloudSyncTimerRef.current) {
        clearTimeout(cloudSyncTimerRef.current);
      }
      // Real-time synchronization debounced by 800ms
      cloudSyncTimerRef.current = setTimeout(async () => {
        try {
          await saveStudyStateToCloud(account.uid, state);
          setSyncStatus('synced');
        } catch (err) {
          console.warn('Cloud sync skipped:', err);
          setSyncStatus('synced');
        }
      }, 800);
    } else {
      setSyncStatus('synced');
    }
  }, [state, account?.uid]);

  const logout = async () => {
    await logoutUser();
    setAccount(null);
    setSyncStatus('synced');
  };

  const syncNow = async () => {
    saveStudyState(state);
    if (!account?.uid) {
      setIsAuthModalOpen(true);
      return;
    }
    setSyncStatus('syncing');
    if (auth.currentUser && auth.currentUser.uid === account.uid) {
      try {
        await saveStudyStateToCloud(account.uid, state);
        setSyncStatus('synced');
      } catch (err) {
        console.warn('Manual sync completed locally:', err);
        setSyncStatus('synced');
      }
    } else {
      setTimeout(() => {
        setSyncStatus('synced');
      }, 350);
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Subjects CRUD
  const addSubject = (subjectData: Omit<Subject, 'id' | 'createdAt'>): Subject => {
    const newSubject: Subject = {
      ...subjectData,
      id: `sub-${Date.now()}`,
      createdAt: todayStr,
    };
    setState(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSubject],
    }));
    return newSubject;
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const deleteSubject = (id: string) => {
    setState(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.id !== id),
      goals: prev.goals.filter(g => g.subjectId !== id),
      timetable: prev.timetable.filter(t => t.subjectId !== id),
      studySessions: prev.studySessions.filter(s => s.subjectId !== id),
      notes: prev.notes.map(n => (n.subjectId === id ? { ...n, subjectId: undefined } : n)),
    }));
    if (selectedSubjectId === id) {
      setSelectedSubjectId(null);
    }
  };

  const getSubject = (id: string) => {
    return state.subjects.find(s => s.id === id);
  };

  // Goals CRUD
  const addGoal = (goalData: Omit<Goal, 'id' | 'order'>): Goal => {
    const dayGoals = state.goals.filter(g => g.date === goalData.date);
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}`,
      order: dayGoals.length + 1,
    };
    setState(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => (g.id === id ? { ...g, ...updates } : g)),
    }));
  };

  const toggleGoal = (id: string) => {
    setState(prev => {
      let isAllCompleted = false;
      const targetGoal = prev.goals.find(g => g.id === id);
      const newGoals = prev.goals.map(g => {
        if (g.id === id) {
          const completed = !g.completed;
          return {
            ...g,
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
          };
        }
        return g;
      });

      if (targetGoal && !targetGoal.completed) {
        // check if this was the last goal of that day
        const dayGoals = newGoals.filter(g => g.date === targetGoal.date);
        if (dayGoals.length > 0 && dayGoals.every(g => g.completed)) {
          isAllCompleted = true;
        }
      }

      if (isAllCompleted) {
        try {
          confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.7 },
            colors: ['#0d9488', '#6366f1', '#10b981', '#f59e0b'],
          });
        } catch {
          // ignore
        }
      }

      return {
        ...prev,
        goals: newGoals,
      };
    });
  };

  const deleteGoal = (id: string) => {
    setState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id),
    }));
  };

  const reorderGoals = (dateStr: string, reorderedIds: string[]) => {
    setState(prev => {
      const otherGoals = prev.goals.filter(g => g.date !== dateStr);
      const reordered = reorderedIds
        .map((id, index) => {
          const found = prev.goals.find(g => g.id === id);
          return found ? { ...found, order: index + 1 } : null;
        })
        .filter(Boolean) as Goal[];

      return {
        ...prev,
        goals: [...otherGoals, ...reordered],
      };
    });
  };

  const carryOverUnfinishedGoals = (fromDateStr: string = todayStr): number => {
    const tomorrowStr = addDays(fromDateStr, 1);
    const unfinished = state.goals.filter(g => g.date === fromDateStr && !g.completed);

    if (unfinished.length === 0) return 0;

    const existingTomorrowGoals = state.goals.filter(g => g.date === tomorrowStr);
    let nextOrder = existingTomorrowGoals.length + 1;

    const carriedGoals: Goal[] = unfinished.map(g => ({
      ...g,
      id: `goal-carried-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: tomorrowStr,
      order: nextOrder++,
      notes: g.notes ? `${g.notes} (Carried from ${fromDateStr})` : `Carried from ${fromDateStr}`,
    }));

    setState(prev => ({
      ...prev,
      // Mark original unfinished as kept or we can leave them in previous day as unfinished record
      goals: [...prev.goals, ...carriedGoals],
    }));

    return carriedGoals.length;
  };

  // Timetable CRUD
  const addTimetableBlock = (blockData: Omit<TimetableBlock, 'id'>): TimetableBlock => {
    const newBlock: TimetableBlock = {
      ...blockData,
      id: `tt-${Date.now()}`,
    };
    setState(prev => ({
      ...prev,
      timetable: [...prev.timetable, newBlock],
    }));
    return newBlock;
  };

  const updateTimetableBlock = (id: string, updates: Partial<TimetableBlock>) => {
    setState(prev => ({
      ...prev,
      timetable: prev.timetable.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteTimetableBlock = (id: string) => {
    setState(prev => ({
      ...prev,
      timetable: prev.timetable.filter(t => t.id !== id),
    }));
  };

  // Habits CRUD
  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt'>): Habit => {
    const newHabit: Habit = {
      ...habitData,
      id: `hab-${Date.now()}`,
      createdAt: todayStr,
    };
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));
    return newHabit;
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => (h.id === id ? { ...h, ...updates } : h)),
    }));
  };

  const deleteHabit = (id: string) => {
    setState(prev => {
      const newLogs = { ...prev.habitLogs };
      Object.keys(newLogs).forEach(date => {
        newLogs[date] = newLogs[date].filter(hid => hid !== id);
      });
      return {
        ...prev,
        habits: prev.habits.filter(h => h.id !== id),
        habitLogs: newLogs,
      };
    });
  };

  const toggleHabitDay = (habitId: string, dateStr: string) => {
    setState(prev => {
      const logsForDate = prev.habitLogs[dateStr] || [];
      const isDone = logsForDate.includes(habitId);
      const updatedList = isDone
        ? logsForDate.filter(id => id !== habitId)
        : [...logsForDate, habitId];

      return {
        ...prev,
        habitLogs: {
          ...prev.habitLogs,
          [dateStr]: updatedList,
        },
      };
    });
  };

  // Study Sessions
  const addStudySession = (sessionData: Omit<StudySession, 'id' | 'timestamp'>) => {
    const newSession: StudySession = {
      ...sessionData,
      id: `sess-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      studySessions: [...prev.studySessions, newSession],
    }));
  };

  const deleteStudySession = (id: string) => {
    setState(prev => ({
      ...prev,
      studySessions: prev.studySessions.filter(s => s.id !== id),
    }));
  };

  // Notes CRUD
  const addNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const now = new Date().toISOString();
    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setState(prev => ({
      ...prev,
      notes: [newNote, ...prev.notes],
    }));
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      ),
    }));
  };

  const deleteNote = (id: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== id),
    }));
  };

  const togglePinNote = (id: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)),
    }));
  };

  // Exam Countdown
  const setExamCountdown = (exam: ExamCountdown | null) => {
    setState(prev => ({
      ...prev,
      examCountdown: exam,
    }));
  };

  // Profile
  const updateProfile = (updates: Partial<UserProfile>) => {
    setState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...updates,
      },
    }));
  };

  // Settings
  const updateSettings = (updates: Partial<UserSettings>) => {
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...updates,
      },
    }));
  };

  // System actions
  const resetToSampleData = () => {
    const sample = getInitialSampleData();
    saveStudyState(sample);
    setState(sample);
  };

  const clearData = () => {
    const empty = clearAllData();
    setState(empty);
  };

  const exportData = () => {
    exportDataAsJSON(state);
  };

  const importData = (jsonStr: string) => {
    const imported = importDataFromJSON(jsonStr);
    setState(imported);
  };

  // Computed metrics
  const todayStudyMinutes = useMemo(() => {
    return state.studySessions
      .filter(s => s.date === todayStr)
      .reduce((sum, s) => sum + s.minutes, 0);
  }, [state.studySessions, todayStr]);

  const todayGoals = useMemo(() => {
    return state.goals
      .filter(g => g.date === todayStr)
      .sort((a, b) => a.order - b.order);
  }, [state.goals, todayStr]);

  const todayCompletedGoalsCount = useMemo(() => {
    return todayGoals.filter(g => g.completed).length;
  }, [todayGoals]);

  const todayHabitsCompletedCount = useMemo(() => {
    const todayLogs = state.habitLogs[todayStr] || [];
    return todayLogs.length;
  }, [state.habitLogs, todayStr]);

  const studyStreak = useMemo(() => {
    return calculateOverallStudyStreak(state.studySessions, state.goals);
  }, [state.studySessions, state.goals]);

  // Weekly study hours (Mon to Sun of current week)
  const weeklyStudyHours = useMemo(() => {
    const week = getWeekDates(todayStr);
    return week.map(item => {
      const dayMinutes = state.studySessions
        .filter(s => s.date === item.dateStr)
        .reduce((sum, s) => sum + s.minutes, 0);
      return {
        day: item.day.toUpperCase(),
        date: item.dateStr,
        hours: Number((dayMinutes / 60).toFixed(1)),
        isToday: item.isToday,
      };
    });
  }, [state.studySessions, todayStr]);

  // Subject stats
  const subjectStats = useMemo(() => {
    return state.subjects.map(subject => {
      const subjectSessions = state.studySessions.filter(s => s.subjectId === subject.id);
      const totalMinutes = subjectSessions.reduce((sum, s) => sum + s.minutes, 0);
      const hours = Number((totalMinutes / 60).toFixed(1));

      const subjectGoals = state.goals.filter(g => g.subjectId === subject.id);
      const totalGoals = subjectGoals.length;
      const completedGoals = subjectGoals.filter(g => g.completed).length;
      const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      return {
        subject,
        hours,
        totalGoals,
        completedGoals,
        percentage,
      };
    });
  }, [state.subjects, state.studySessions, state.goals]);

  return (
    <StudyContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        selectedSubjectId,
        setSelectedSubjectId,
        theme,
        toggleTheme,
        account,
        syncStatus,
        isAuthModalOpen,
        setIsAuthModalOpen,
        openAuthModal,
        logout,
        syncNow,
        updateProfile,
        addSubject,
        updateSubject,
        deleteSubject,
        getSubject,
        addGoal,
        updateGoal,
        toggleGoal,
        deleteGoal,
        reorderGoals,
        carryOverUnfinishedGoals,
        addTimetableBlock,
        updateTimetableBlock,
        deleteTimetableBlock,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitDay,
        addStudySession,
        deleteStudySession,
        addNote,
        updateNote,
        deleteNote,
        togglePinNote,
        setExamCountdown,
        updateSettings,
        resetToSampleData,
        clearData,
        exportData,
        importData,
        todayStr,
        todayStudyMinutes,
        todayGoals,
        todayCompletedGoalsCount,
        todayHabitsCompletedCount,
        studyStreak,
        weeklyStudyHours,
        subjectStats,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
};
