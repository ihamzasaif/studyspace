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
import { mergeStudyStates } from '../utils/syncMerge';
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
import { playChime, playSoftClick, startAmbientNoise, stopAmbientNoise } from '../utils/audio';

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
export type AmbientSoundType = 'off' | 'brown' | 'white' | 'rain' | 'waves';

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

  // Global Background Timer & Ambient Sound
  timerMode: TimerMode;
  timerTimeLeft: number;
  isTimerRunning: boolean;
  timerSessionCount: number;
  timerSubjectId: string;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  timerFormatted: string;
  timerProgressRatio: number;
  startTimer: () => void;
  pauseTimer: () => void;
  toggleTimerRunning: () => void;
  resetTimer: () => void;
  skipTimer: () => void;
  switchTimerMode: (mode: TimerMode) => void;
  setTimerSubjectId: (id: string) => void;
  setAmbientSoundMode: (sound: AmbientSoundType, vol?: number) => void;
  setAmbientVolumeLevel: (vol: number) => void;
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

  // Global Pomodoro Timer State (persists continuously second-by-second across all tab switches & page refreshes)
  const TIMER_STORAGE_KEY = 'study_room_focus_timer_v1';

  const initialTimerSnapshot = useMemo(() => {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.timeLeft === 'number' && parsed.timeLeft >= 0) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const [timerMode, setTimerMode] = useState<TimerMode>(() => initialTimerSnapshot?.mode || 'work');
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSessionCount, setTimerSessionCount] = useState<number>(() => initialTimerSnapshot?.sessionCount || 1);
  const [timerSubjectId, setTimerSubjectIdState] = useState<string>(() => initialTimerSnapshot?.subjectId || '');
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('off');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.28);

  const getTimerDurationSeconds = (m: TimerMode, settings = state.settings) => {
    if (m === 'work') return (settings.pomodoroWorkMinutes || 25) * 60;
    if (m === 'shortBreak') return (settings.pomodoroShortBreakMinutes || 5) * 60;
    return (settings.pomodoroLongBreakMinutes || 15) * 60;
  };

  const [timerTimeLeft, setTimerTimeLeft] = useState<number>(() => {
    if (initialTimerSnapshot) {
      if (initialTimerSnapshot.isRunning && initialTimerSnapshot.lastTick) {
        const elapsed = Math.floor((Date.now() - initialTimerSnapshot.lastTick) / 1000);
        const remaining = initialTimerSnapshot.timeLeft - elapsed;
        if (remaining > 0) return remaining;
        return 0;
      }
      if (initialTimerSnapshot.timeLeft > 0) {
        return initialTimerSnapshot.timeLeft;
      }
    }
    return (loadStudyState()?.settings?.pomodoroWorkMinutes || 25) * 60;
  });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronous refs to prevent stale closure data in intervals and beforeunload
  const timerModeRef = useRef<TimerMode>(timerMode);
  timerModeRef.current = timerMode;
  const timerTimeLeftRef = useRef<number>(timerTimeLeft);
  timerTimeLeftRef.current = timerTimeLeft;
  const isTimerRunningRef = useRef<boolean>(isTimerRunning);
  isTimerRunningRef.current = isTimerRunning;
  const timerSessionCountRef = useRef<number>(timerSessionCount);
  timerSessionCountRef.current = timerSessionCount;
  const timerSubjectIdRef = useRef<string>(timerSubjectId);
  timerSubjectIdRef.current = timerSubjectId;

  const persistCurrentTimer = (running = isTimerRunningRef.current, timeLeft = timerTimeLeftRef.current) => {
    try {
      localStorage.setItem(
        TIMER_STORAGE_KEY,
        JSON.stringify({
          mode: timerModeRef.current,
          timeLeft,
          isRunning: running,
          lastTick: Date.now(),
          sessionCount: timerSessionCountRef.current,
          subjectId: timerSubjectIdRef.current,
        })
      );
    } catch {}
  };

  // Initialize timerSubjectId with first subject if unset
  useEffect(() => {
    if (!timerSubjectId && state.subjects.length > 0) {
      setTimerSubjectId(state.subjects[0].id);
    }
  }, [state.subjects, timerSubjectId]);

  // Global background ticking timer (persists every single second to localStorage)
  useEffect(() => {
    if (isTimerRunning) {
      persistCurrentTimer(true, timerTimeLeft);

      timerIntervalRef.current = setInterval(() => {
        setTimerTimeLeft((prev) => {
          if (prev <= 1) {
            persistCurrentTimer(false, 0);
            handleTimerSessionComplete();
            return 0;
          }
          const next = prev - 1;
          persistCurrentTimer(true, next);
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      persistCurrentTimer(false, timerTimeLeft);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timerMode, timerSubjectId, timerSessionCount, state.settings.soundEnabled, todayStr]);

  const handleTimerSessionComplete = () => {
    setIsTimerRunning(false);
    if (state.settings.soundEnabled) {
      playChime();
    }

    if (timerMode === 'work') {
      const minutesSpent = state.settings.pomodoroWorkMinutes || 25;
      const subId = timerSubjectId || state.subjects[0]?.id || 'general';
      const newSession: StudySession = {
        id: `sess-${Date.now()}`,
        subjectId: subId,
        date: todayStr,
        minutes: minutesSpent,
        mode: 'pomodoro',
        timestamp: new Date().toISOString(),
        note: `Pomodoro Focus session #${timerSessionCount}`,
      };

      commitState((prev) => ({
        ...prev,
        studySessions: [newSession, ...prev.studySessions],
      }));

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.65 },
        });
      } catch {}

      if (timerSessionCount % 4 === 0) {
        const nextDur = (state.settings.pomodoroLongBreakMinutes || 15) * 60;
        setTimerMode('longBreak');
        setTimerTimeLeft(nextDur);
        persistCurrentTimer(false, nextDur);
      } else {
        const nextDur = (state.settings.pomodoroShortBreakMinutes || 5) * 60;
        setTimerMode('shortBreak');
        setTimerTimeLeft(nextDur);
        persistCurrentTimer(false, nextDur);
      }
      setTimerSessionCount((c) => c + 1);
    } else {
      const nextDur = (state.settings.pomodoroWorkMinutes || 25) * 60;
      setTimerMode('work');
      setTimerTimeLeft(nextDur);
      persistCurrentTimer(false, nextDur);
    }
  };

  const toggleTimerRunning = () => {
    playSoftClick();
    setIsTimerRunning((prev) => {
      const next = !prev;
      persistCurrentTimer(next, timerTimeLeftRef.current);
      return next;
    });
  };

  const startTimer = () => {
    playSoftClick();
    setIsTimerRunning(true);
    persistCurrentTimer(true, timerTimeLeftRef.current);
  };

  const pauseTimer = () => {
    playSoftClick();
    setIsTimerRunning(false);
    persistCurrentTimer(false, timerTimeLeftRef.current);
  };

  const resetTimer = () => {
    playSoftClick();
    setIsTimerRunning(false);
    const dur = getTimerDurationSeconds(timerMode);
    setTimerTimeLeft(dur);
    persistCurrentTimer(false, dur);
  };

  const skipTimer = () => {
    playSoftClick();
    setIsTimerRunning(false);
    if (timerMode === 'work') {
      const dur = getTimerDurationSeconds('shortBreak');
      setTimerMode('shortBreak');
      setTimerTimeLeft(dur);
      persistCurrentTimer(false, dur);
    } else {
      const dur = getTimerDurationSeconds('work');
      setTimerMode('work');
      setTimerTimeLeft(dur);
      persistCurrentTimer(false, dur);
    }
  };

  const switchTimerMode = (newMode: TimerMode) => {
    playSoftClick();
    setIsTimerRunning(false);
    setTimerMode(newMode);
    const dur = getTimerDurationSeconds(newMode);
    setTimerTimeLeft(dur);
    persistCurrentTimer(false, dur);
  };

  const setTimerSubjectId = (id: string) => {
    setTimerSubjectIdState(id);
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ ...parsed, subjectId: id }));
      }
    } catch {}
  };

  const setAmbientSoundMode = (sound: AmbientSoundType, vol = ambientVolume) => {
    setAmbientSound(sound);
    if (sound === 'off') {
      stopAmbientNoise();
    } else {
      startAmbientNoise(sound, vol);
    }
  };

  const setAmbientVolumeLevel = (vol: number) => {
    setAmbientVolume(vol);
    if (ambientSound !== 'off') {
      startAmbientNoise(ambientSound, vol);
    }
  };

  const timerFormatted = useMemo(() => {
    const mins = Math.floor(timerTimeLeft / 60);
    const secs = timerTimeLeft % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [timerTimeLeft]);

  const timerProgressRatio = useMemo(() => {
    const total = getTimerDurationSeconds(timerMode);
    return total > 0 ? (total - timerTimeLeft) / total : 0;
  }, [timerMode, timerTimeLeft, state.settings]);

  // Account and Cloud Sync State
  const [account, setAccount] = useState<AppAccount | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isIncomingCloudUpdateRef = useRef(false);
  const isCloudInitializedRef = useRef(false);
  const cloudSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stateRef = useRef<StudyState>(state);
  stateRef.current = state;
  const accountRef = useRef<AppAccount | null>(account);
  accountRef.current = account;

  // Immediate commit helper for zero-latency storage and instant cloud push
  const commitState = (updater: (prev: StudyState) => StudyState): StudyState => {
    let nextState: StudyState = stateRef.current;
    setState((prev) => {
      const next = updater(prev);
      nextState = next;
      stateRef.current = next;
      saveStudyState(next);
      if (accountRef.current?.uid) {
        saveStudyStateToCloud(accountRef.current.uid, next).catch((err) => {
          console.warn('Instant cloud save notice:', err);
        });
      }
      return next;
    });
    return nextState;
  };

  // Immediate save on page close, tab switch, refresh, or publish
  useEffect(() => {
    const handleFlush = () => {
      saveStudyState(stateRef.current);
      if (accountRef.current?.uid) {
        saveStudyStateToCloud(accountRef.current.uid, stateRef.current).catch(() => {});
      }
      persistCurrentTimer(isTimerRunningRef.current, timerTimeLeftRef.current);
    };

    window.addEventListener('beforeunload', handleFlush);
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        handleFlush();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('beforeunload', handleFlush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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
        isCloudInitializedRef.current = false;
        setSyncStatus('offline');
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to remote Firestore studyData document for instant multi-device synchronization
  useEffect(() => {
    if (!account?.uid) {
      isCloudInitializedRef.current = false;
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');

    // 1. Initial pull: fetch cloud state and MERGE so neither local nor cloud data is ever lost
    getCloudStudyState(account.uid)
      .then((cloudData) => {
        if (cloudData) {
          isIncomingCloudUpdateRef.current = true;
          setState((currentLocal) => {
            const merged = mergeStudyStates(currentLocal, cloudData);
            saveStudyState(merged);
            stateRef.current = merged;
            // Push merged back to cloud to guarantee both are in perfect sync
            saveStudyStateToCloud(account.uid, merged).catch(() => {});
            return merged;
          });
          setTimeout(() => {
            isIncomingCloudUpdateRef.current = false;
          }, 300);
        } else {
          // No remote document exists yet: initialize cloud with current local state
          setState((currentLocal) => {
            saveStudyStateToCloud(account.uid, currentLocal).catch(() => {});
            return currentLocal;
          });
        }
        isCloudInitializedRef.current = true;
        setSyncStatus('synced');
      })
      .catch((err) => {
        console.warn('Initial cloud fetch notice:', err);
        isCloudInitializedRef.current = true;
        setSyncStatus('synced');
      });

    // 2. Real-time subscription to cloud changes (updates instantly when another device saves)
    const unsubscribe = subscribeToCloudStudyState(
      account.uid,
      (cloudState) => {
        isIncomingCloudUpdateRef.current = true;
        setState((currentLocal) => {
          // ALWAYS merge: never overwrite populated local state with empty cloud state!
          const updated = mergeStudyStates(currentLocal, cloudState);
          saveStudyState(updated);
          stateRef.current = updated;
          isCloudInitializedRef.current = true;
          return updated;
        });
        setSyncStatus('synced');
        setTimeout(() => {
          isIncomingCloudUpdateRef.current = false;
        }, 200);
      },
      (error) => {
        console.warn('Real-time sync subscription notice:', error);
        setSyncStatus('synced');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [account?.uid]);

  // Persist state changes locally AND continuously sync to cloud if authenticated
  useEffect(() => {
    saveStudyState(state);
    stateRef.current = state;

    if (
      account?.uid &&
      isCloudInitializedRef.current &&
      !isIncomingCloudUpdateRef.current
    ) {
      setSyncStatus('syncing');
      if (cloudSyncTimerRef.current) {
        clearTimeout(cloudSyncTimerRef.current);
      }
      // Real-time synchronization debounced by 400ms
      cloudSyncTimerRef.current = setTimeout(async () => {
        try {
          await saveStudyStateToCloud(account.uid, state);
          setSyncStatus('synced');
        } catch (err) {
          console.warn('Cloud sync debounced notice:', err);
          setSyncStatus('synced');
        }
      }, 400);
    }
  }, [state, account?.uid]);

  const logout = async () => {
    isCloudInitializedRef.current = false;
    await logoutUser();
    setAccount(null);
    setSyncStatus('synced');
  };

  const syncNow = async () => {
    saveStudyState(stateRef.current);
    if (!account?.uid) {
      setIsAuthModalOpen(true);
      return;
    }
    setSyncStatus('syncing');
    try {
      // Pull remote first, merge with local, and push to cloud
      const remoteData = await getCloudStudyState(account.uid);
      const merged = mergeStudyStates(stateRef.current, remoteData);
      isIncomingCloudUpdateRef.current = true;
      setState(merged);
      stateRef.current = merged;
      saveStudyState(merged);
      await saveStudyStateToCloud(account.uid, merged);
      isCloudInitializedRef.current = true;
      setTimeout(() => {
        isIncomingCloudUpdateRef.current = false;
      }, 200);
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Manual sync notice:', err);
      setSyncStatus('synced');
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
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: todayStr,
    };
    commitState(prev => ({
      ...prev,
      subjects: [...prev.subjects, newSubject],
      deletedIds: (prev.deletedIds || []).filter(id => id !== newSubject.id),
    }));
    return newSubject;
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    commitState(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const deleteSubject = (id: string) => {
    commitState(prev => {
      const relatedGoalIds = prev.goals.filter(g => g.subjectId === id).map(g => g.id);
      const relatedTimetableIds = prev.timetable.filter(t => t.subjectId === id).map(t => t.id);
      const relatedSessionIds = prev.studySessions.filter(s => s.subjectId === id).map(s => s.id);
      const newDeleted = Array.from(new Set([
        ...(prev.deletedIds || []),
        id,
        ...relatedGoalIds,
        ...relatedTimetableIds,
        ...relatedSessionIds,
      ])).slice(-500);

      return {
        ...prev,
        subjects: prev.subjects.filter(s => s.id !== id),
        goals: prev.goals.filter(g => g.subjectId !== id),
        timetable: prev.timetable.filter(t => t.subjectId !== id),
        studySessions: prev.studySessions.filter(s => s.subjectId !== id),
        notes: prev.notes.map(n => (n.subjectId === id ? { ...n, subjectId: undefined } : n)),
        deletedIds: newDeleted,
      };
    });
    if (selectedSubjectId === id) {
      setSelectedSubjectId(null);
    }
  };

  const getSubject = (id: string) => {
    return stateRef.current.subjects.find(s => s.id === id);
  };

  // Goals CRUD
  const addGoal = (goalData: Omit<Goal, 'id' | 'order'>): Goal => {
    const dayGoals = stateRef.current.goals.filter(g => g.date === goalData.date);
    const newGoal: Goal = {
      ...goalData,
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order: dayGoals.length + 1,
    };
    commitState(prev => ({
      ...prev,
      goals: [...prev.goals, newGoal],
      deletedIds: (prev.deletedIds || []).filter(id => id !== newGoal.id),
    }));
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    commitState(prev => ({
      ...prev,
      goals: prev.goals.map(g => (g.id === id ? { ...g, ...updates } : g)),
    }));
  };

  const toggleGoal = (id: string) => {
    commitState(prev => {
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
    commitState(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id),
      deletedIds: Array.from(new Set([...(prev.deletedIds || []), id])).slice(-500),
    }));
  };

  const reorderGoals = (dateStr: string, reorderedIds: string[]) => {
    commitState(prev => {
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
    const unfinished = stateRef.current.goals.filter(g => g.date === fromDateStr && !g.completed);

    if (unfinished.length === 0) return 0;

    const existingTomorrowGoals = stateRef.current.goals.filter(g => g.date === tomorrowStr);
    let nextOrder = existingTomorrowGoals.length + 1;

    const carriedGoals: Goal[] = unfinished.map(g => ({
      ...g,
      id: `goal-carried-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: tomorrowStr,
      order: nextOrder++,
      notes: g.notes ? `${g.notes} (Carried from ${fromDateStr})` : `Carried from ${fromDateStr}`,
    }));

    commitState(prev => ({
      ...prev,
      goals: [...prev.goals, ...carriedGoals],
    }));

    return carriedGoals.length;
  };

  // Timetable CRUD
  const addTimetableBlock = (blockData: Omit<TimetableBlock, 'id'>): TimetableBlock => {
    const newBlock: TimetableBlock = {
      ...blockData,
      id: `tt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    commitState(prev => ({
      ...prev,
      timetable: [...prev.timetable, newBlock],
      deletedIds: (prev.deletedIds || []).filter(id => id !== newBlock.id),
    }));
    return newBlock;
  };

  const updateTimetableBlock = (id: string, updates: Partial<TimetableBlock>) => {
    commitState(prev => ({
      ...prev,
      timetable: prev.timetable.map(t => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteTimetableBlock = (id: string) => {
    commitState(prev => ({
      ...prev,
      timetable: prev.timetable.filter(t => t.id !== id),
      deletedIds: Array.from(new Set([...(prev.deletedIds || []), id])).slice(-500),
    }));
  };

  // Habits CRUD
  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt'>): Habit => {
    const newHabit: Habit = {
      ...habitData,
      id: `hab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: todayStr,
    };
    commitState(prev => ({
      ...prev,
      habits: [...prev.habits, newHabit],
      deletedIds: (prev.deletedIds || []).filter(id => id !== newHabit.id),
    }));
    return newHabit;
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    commitState(prev => ({
      ...prev,
      habits: prev.habits.map(h => (h.id === id ? { ...h, ...updates } : h)),
    }));
  };

  const deleteHabit = (id: string) => {
    commitState(prev => {
      const newLogs = { ...prev.habitLogs };
      Object.keys(newLogs).forEach(date => {
        newLogs[date] = newLogs[date].filter(hid => hid !== id);
      });
      return {
        ...prev,
        habits: prev.habits.filter(h => h.id !== id),
        habitLogs: newLogs,
        deletedIds: Array.from(new Set([...(prev.deletedIds || []), id])).slice(-500),
      };
    });
  };

  const toggleHabitDay = (habitId: string, dateStr: string) => {
    commitState(prev => {
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
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    commitState(prev => ({
      ...prev,
      studySessions: [...prev.studySessions, newSession],
      deletedIds: (prev.deletedIds || []).filter(id => id !== newSession.id),
    }));
  };

  const deleteStudySession = (id: string) => {
    commitState(prev => ({
      ...prev,
      studySessions: prev.studySessions.filter(s => s.id !== id),
      deletedIds: Array.from(new Set([...(prev.deletedIds || []), id])).slice(-500),
    }));
  };

  // Notes CRUD
  const addNote = (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const now = new Date().toISOString();
    const newNote: Note = {
      ...noteData,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    commitState(prev => ({
      ...prev,
      notes: [newNote, ...prev.notes],
      deletedIds: (prev.deletedIds || []).filter(id => id !== newNote.id),
    }));
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    commitState(prev => ({
      ...prev,
      notes: prev.notes.map(n =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      ),
    }));
  };

  const deleteNote = (id: string) => {
    commitState(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== id),
      deletedIds: Array.from(new Set([...(prev.deletedIds || []), id])).slice(-500),
    }));
  };

  const togglePinNote = (id: string) => {
    commitState(prev => ({
      ...prev,
      notes: prev.notes.map(n => (n.id === id ? { ...n, isPinned: !n.isPinned } : n)),
    }));
  };

  // Exam Countdown
  const setExamCountdown = (exam: ExamCountdown | null) => {
    commitState(prev => ({
      ...prev,
      examCountdown: exam,
    }));
  };

  // Profile
  const updateProfile = (updates: Partial<UserProfile>) => {
    commitState(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...updates,
      },
    }));
  };

  // Settings
  const updateSettings = (updates: Partial<UserSettings>) => {
    commitState(prev => ({
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
    commitState(() => sample);
  };

  const clearData = () => {
    const empty = clearAllData();
    commitState(() => empty);
  };

  const exportData = () => {
    exportDataAsJSON(stateRef.current);
  };

  const importData = (jsonStr: string) => {
    const imported = importDataFromJSON(jsonStr);
    commitState(() => imported);
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
        timerMode,
        timerTimeLeft,
        isTimerRunning,
        timerSessionCount,
        timerSubjectId,
        ambientSound,
        ambientVolume,
        timerFormatted,
        timerProgressRatio,
        startTimer,
        pauseTimer,
        toggleTimerRunning,
        resetTimer,
        skipTimer,
        switchTimerMode,
        setTimerSubjectId,
        setAmbientSoundMode,
        setAmbientVolumeLevel,
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
