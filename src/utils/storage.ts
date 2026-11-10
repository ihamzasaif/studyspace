import { StudyState, Subject, Goal, TimetableBlock, Habit, HabitLog, StudySession, Note, ExamCountdown, UserSettings, UserProfile } from '../types';
import { getTodayString, addDays } from './date';

const STORAGE_KEY = 'study_room_app_state_v2';

export const COLOR_PALETTE = [
  { name: 'Teal', hex: '#0d9488', bgClass: 'bg-teal-500', textClass: 'text-teal-600 dark:text-teal-400' },
  { name: 'Indigo', hex: '#6366f1', bgClass: 'bg-indigo-500', textClass: 'text-indigo-600 dark:text-indigo-400' },
  { name: 'Amber', hex: '#d97706', bgClass: 'bg-amber-500', textClass: 'text-amber-600 dark:text-amber-400' },
  { name: 'Rose', hex: '#e11d48', bgClass: 'bg-rose-500', textClass: 'text-rose-600 dark:text-rose-400' },
  { name: 'Emerald', hex: '#059669', bgClass: 'bg-emerald-500', textClass: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Violet', hex: '#8b5cf6', bgClass: 'bg-violet-500', textClass: 'text-violet-600 dark:text-violet-400' },
  { name: 'Sky', hex: '#0284c7', bgClass: 'bg-sky-500', textClass: 'text-sky-600 dark:text-sky-400' },
  { name: 'Orange', hex: '#ea580c', bgClass: 'bg-orange-500', textClass: 'text-orange-600 dark:text-orange-400' },
];

export const MOTIVATIONAL_LINES = [
  'Deep work produces rare value.',
  'Focus is the art of knowing what to ignore.',
  'Small daily efforts compound into mastery.',
  'Calm mind, steady progress.',
  'Clarity precedes competence.',
  'Consistency beats intensity every single time.',
  'One concept thoroughly learned is better than ten skimmed.',
  'The best study session is the one you actually begin.',
];

export function getBlankState(): StudyState {
  return {
    profile: {
      name: '',
      profession: '',
      institution: '',
      targetGoal: '',
      avatarColor: '#0d9488',
    },
    subjects: [],
    goals: [],
    timetable: [],
    habits: [],
    habitLogs: {},
    studySessions: [],
    notes: [],
    examCountdown: null,
    settings: {
      dailyTargetHours: 3.5,
      pomodoroWorkMinutes: 25,
      pomodoroShortBreakMinutes: 5,
      pomodoroLongBreakMinutes: 15,
      soundEnabled: true,
      ambientNoise: 'off',
      theme: 'light',
    },
    deletedIds: [],
  };
}

export function getInitialSampleData(): StudyState {
  const today = getTodayString();
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);
  const threeDaysAgo = addDays(today, -3);
  const fourDaysAgo = addDays(today, -4);
  const fiveDaysAgo = addDays(today, -5);
  const tomorrow = addDays(today, 1);
  const examDate = addDays(today, 14);

  const subjects: Subject[] = [
    {
      id: 'sub-1',
      name: 'Computer Systems & Architecture',
      code: 'CS 204',
      color: '#0d9488',
      notes: 'Pipelining, cache memory hierarchies, RISC-V assembly.',
      createdAt: fiveDaysAgo,
    },
    {
      id: 'sub-2',
      name: 'Algorithms & Data Structures',
      code: 'CS 301',
      color: '#6366f1',
      notes: 'Dynamic programming, graph algorithms, NP-completeness.',
      createdAt: fiveDaysAgo,
    },
    {
      id: 'sub-3',
      name: 'Linear Algebra & Optimization',
      code: 'MATH 220',
      color: '#d97706',
      notes: 'Eigenvalues, SVD decomposition, gradient descent mechanics.',
      createdAt: fiveDaysAgo,
    },
    {
      id: 'sub-4',
      name: 'Cognitive Psychology',
      code: 'PSYC 110',
      color: '#059669',
      notes: 'Working memory limits, spaced retrieval practice, mental models.',
      createdAt: fiveDaysAgo,
    },
  ];

  const goals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Derive 5-stage RISC-V hazard detection logic',
      subjectId: 'sub-1',
      date: today,
      completed: true,
      priority: 'high',
      notes: 'Check textbook chapter 4.7 diagrams',
      estimatedMinutes: 45,
      order: 1,
      completedAt: `${today}T10:15:00`,
    },
    {
      id: 'goal-2',
      title: 'Implement Dijkstra and Bellman-Ford comparisons',
      subjectId: 'sub-2',
      date: today,
      completed: true,
      priority: 'high',
      notes: 'Benchmark on sparse graphs with negative edge weights',
      estimatedMinutes: 60,
      order: 2,
      completedAt: `${today}T11:40:00`,
    },
    {
      id: 'goal-3',
      title: 'Practice SVD transformation proofs (problems 12–18)',
      subjectId: 'sub-3',
      date: today,
      completed: false,
      priority: 'medium',
      notes: 'Focus on geometric interpretation of singular values',
      estimatedMinutes: 50,
      order: 3,
    },
    {
      id: 'goal-4',
      title: 'Review Leitner spaced repetition flashcards',
      subjectId: 'sub-4',
      date: today,
      completed: false,
      priority: 'low',
      notes: '40 flashcards on cognitive load theory',
      estimatedMinutes: 25,
      order: 4,
    },
    {
      id: 'goal-5',
      title: 'Complete mock quiz on Cache associativity',
      subjectId: 'sub-1',
      date: today,
      completed: false,
      priority: 'medium',
      notes: 'Direct mapped vs 2-way vs fully associative hit rates',
      estimatedMinutes: 30,
      order: 5,
    },
    // Past completed goals
    {
      id: 'goal-prev-1',
      title: 'Read chapter 3: Pipelining basics',
      subjectId: 'sub-1',
      date: yesterday,
      completed: true,
      priority: 'high',
      notes: 'Understood structural hazards',
      estimatedMinutes: 50,
      order: 1,
      completedAt: `${yesterday}T16:00:00`,
    },
    {
      id: 'goal-prev-2',
      title: 'Solve 10 LeetCode Medium graph problems',
      subjectId: 'sub-2',
      date: yesterday,
      completed: true,
      priority: 'high',
      notes: 'Topological sort & union-find',
      estimatedMinutes: 90,
      order: 2,
      completedAt: `${yesterday}T18:30:00`,
    },
    // Tomorrow goal
    {
      id: 'goal-tom-1',
      title: 'Read research paper on attention heads in Transformers',
      subjectId: 'sub-2',
      date: tomorrow,
      completed: false,
      priority: 'high',
      notes: 'Prepare 1-page synthesis note',
      estimatedMinutes: 60,
      order: 1,
    },
  ];

  const timetable: TimetableBlock[] = [
    {
      id: 'tt-1',
      subjectId: 'sub-1',
      day: 'mon',
      startTime: '09:00',
      endTime: '10:30',
      title: 'Architecture Lecture',
      location: 'Hall B2',
    },
    {
      id: 'tt-2',
      subjectId: 'sub-2',
      day: 'mon',
      startTime: '14:00',
      endTime: '15:30',
      title: 'Algorithms Seminar',
      location: 'Lab 401',
    },
    {
      id: 'tt-3',
      subjectId: 'sub-3',
      day: 'tue',
      startTime: '10:00',
      endTime: '11:30',
      title: 'Optimization Workshop',
      location: 'Math Building 12',
    },
    {
      id: 'tt-4',
      subjectId: 'sub-4',
      day: 'tue',
      startTime: '15:00',
      endTime: '16:30',
      title: 'Cognitive Science Review',
      location: 'Quiet Study Lounge',
    },
    {
      id: 'tt-5',
      subjectId: 'sub-1',
      day: 'wed',
      startTime: '09:00',
      endTime: '11:00',
      title: 'Systems Lab Session',
      location: 'Hardware Workstation',
    },
    {
      id: 'tt-6',
      subjectId: 'sub-2',
      day: 'wed',
      startTime: '13:30',
      endTime: '15:00',
      title: 'Graph Theory Problem Set',
      location: 'Library Floor 3',
    },
    {
      id: 'tt-7',
      subjectId: 'sub-3',
      day: 'thu',
      startTime: '10:00',
      endTime: '12:00',
      title: 'Linear Algebra Exercises',
      location: 'Study Carrel 9',
    },
    {
      id: 'tt-8',
      subjectId: 'sub-1',
      day: 'fri',
      startTime: '11:00',
      endTime: '12:30',
      title: 'Microarchitecture Deep Dive',
      location: 'Room 205',
    },
    {
      id: 'tt-9',
      subjectId: 'sub-2',
      day: 'sat',
      startTime: '10:00',
      endTime: '12:00',
      title: 'Competitive Coding Sprint',
      location: 'Home Study Desk',
    },
    {
      id: 'tt-10',
      subjectId: 'sub-4',
      day: 'sun',
      startTime: '16:00',
      endTime: '17:30',
      title: 'Weekly Knowledge Synthesis',
      location: 'Study Desk',
    },
  ];

  const habits: Habit[] = [
    {
      id: 'hab-1',
      name: 'Morning deep study block (90 mins)',
      description: 'Zero phone or social media during the first 2 hours of day',
      createdAt: fiveDaysAgo,
    },
    {
      id: 'hab-2',
      name: 'Active recall & flashcard revision',
      description: 'Review cards due in Anki / Leitner box',
      createdAt: fiveDaysAgo,
    },
    {
      id: 'hab-3',
      name: 'Solve 2 analytical practice problems',
      description: 'Writing proofs or algorithms by hand without hints',
      createdAt: fiveDaysAgo,
    },
    {
      id: 'hab-4',
      name: 'Hydration & 30-min walk / workout',
      description: 'Reset mental fatigue and improve memory consolidation',
      createdAt: fiveDaysAgo,
    },
    {
      id: 'hab-5',
      name: 'Evening review & tomorrow planning',
      description: 'Check off day goals and set top 3 priorities for tomorrow',
      createdAt: fiveDaysAgo,
    },
  ];

  const habitLogs: HabitLog = {
    [fiveDaysAgo]: ['hab-1', 'hab-2', 'hab-4'],
    [fourDaysAgo]: ['hab-1', 'hab-2', 'hab-3', 'hab-4'],
    [threeDaysAgo]: ['hab-1', 'hab-2', 'hab-3', 'hab-4', 'hab-5'],
    [twoDaysAgo]: ['hab-1', 'hab-2', 'hab-3', 'hab-4'],
    [yesterday]: ['hab-1', 'hab-2', 'hab-3', 'hab-4', 'hab-5'],
    [today]: ['hab-1', 'hab-2'],
  };

  const studySessions: StudySession[] = [
    {
      id: 'sess-1',
      subjectId: 'sub-1',
      date: fiveDaysAgo,
      minutes: 75,
      mode: 'pomodoro',
      timestamp: `${fiveDaysAgo}T10:00:00`,
      note: 'Instruction pipeline breakdown',
    },
    {
      id: 'sess-2',
      subjectId: 'sub-2',
      date: fourDaysAgo,
      minutes: 90,
      mode: 'pomodoro',
      timestamp: `${fourDaysAgo}T11:00:00`,
      note: 'Red-black trees balancing',
    },
    {
      id: 'sess-3',
      subjectId: 'sub-3',
      date: threeDaysAgo,
      minutes: 120,
      mode: 'pomodoro',
      timestamp: `${threeDaysAgo}T14:30:00`,
      note: 'Matrix diagonalization',
    },
    {
      id: 'sess-4',
      subjectId: 'sub-1',
      date: twoDaysAgo,
      minutes: 60,
      mode: 'pomodoro',
      timestamp: `${twoDaysAgo}T09:30:00`,
      note: 'Memory hierarchy caches',
    },
    {
      id: 'sess-5',
      subjectId: 'sub-2',
      date: yesterday,
      minutes: 110,
      mode: 'pomodoro',
      timestamp: `${yesterday}T15:00:00`,
      note: 'Graph algorithms practice',
    },
    {
      id: 'sess-6',
      subjectId: 'sub-3',
      date: yesterday,
      minutes: 45,
      mode: 'manual',
      timestamp: `${yesterday}T19:00:00`,
      note: 'Eigenvalue problem set',
    },
    // Today sessions (2 hours logged so far)
    {
      id: 'sess-7',
      subjectId: 'sub-1',
      date: today,
      minutes: 50,
      mode: 'pomodoro',
      timestamp: `${today}T09:30:00`,
      note: 'Hazard unit logic derivation',
    },
    {
      id: 'sess-8',
      subjectId: 'sub-2',
      date: today,
      minutes: 75,
      mode: 'pomodoro',
      timestamp: `${today}T11:00:00`,
      note: 'Dijkstra shortest path variants',
    },
  ];

  const notes: Note[] = [
    {
      id: 'note-1',
      title: 'RISC-V 5-Stage Pipeline Hazards Summary',
      content:
`1. Structural Hazards:
- Hardware resource conflict (e.g. single memory port for Instruction & Data).
- Solution: Separate Instruction and Data memories / Harvard architecture.

2. Data Hazards (RAW - Read After Write):
- An instruction depends on result of previous instruction still in the pipeline.
- Solution: Forwarding / Bypassing unit paths directly from EX/MEM or MEM/WB to EX stage.
- Load-Use Hazard requires 1-cycle stall (bubble).

3. Control Hazards (Branching):
- Branch decision made in MEM stage causes 3 flushes.
- Optimized: Move branch comparator to ID stage (1-cycle penalty) + Dynamic Branch Predictor (2-bit saturating counter).`,
      subjectId: 'sub-1',
      isPinned: true,
      updatedAt: today,
      createdAt: fiveDaysAgo,
    },
    {
      id: 'note-2',
      title: 'Key Asymptotic Complexities for Quick Recall',
      content:
`Dijkstra: O((V + E) log V) with Min-Heap
Bellman-Ford: O(V * E) - handles negative edge weights
Floyd-Warshall: O(V^3) - All-pairs shortest path
Kruskal MST: O(E log E) or O(E log V) with Disjoint Set (Union-Find)
Prim MST: O((V + E) log V) with adjacency list and binary heap
Topological Sort: O(V + E) using Kahn's algorithm or DFS`,
      subjectId: 'sub-2',
      isPinned: true,
      updatedAt: yesterday,
      createdAt: fourDaysAgo,
    },
    {
      id: 'note-3',
      title: 'Formulas & Transformations: Linear Algebra',
      content:
`SVD Decomposition: A = U * Sigma * V^T
- U: Eigenvectors of A * A^T (Left singular vectors)
- V: Eigenvectors of A^T * A (Right singular vectors)
- Sigma: Square roots of non-zero eigenvalues of A^T * A

Rank-Nullity Theorem:
dim(Col A) + dim(Nul A) = n (number of columns)`,
      subjectId: 'sub-3',
      isPinned: false,
      updatedAt: twoDaysAgo,
      createdAt: threeDaysAgo,
    },
  ];

  const examCountdown: ExamCountdown = {
    title: 'Midterm Examination: Systems Architecture',
    targetDate: examDate,
    subjectId: 'sub-1',
  };

  const settings: UserSettings = {
    dailyTargetHours: 3.5,
    pomodoroWorkMinutes: 25,
    pomodoroShortBreakMinutes: 5,
    pomodoroLongBreakMinutes: 15,
    soundEnabled: true,
    ambientNoise: 'off',
    theme: 'light',
  };

  const profile: UserProfile = {
    name: 'Hamza',
    profession: 'Engineering Student',
    institution: 'University Studies',
    targetGoal: 'Master Systems, Algorithms & Stay Consistent',
    avatarColor: '#0d9488',
  };

  return {
    profile,
    subjects,
    goals,
    timetable,
    habits,
    habitLogs,
    studySessions,
    notes,
    examCountdown,
    settings,
    deletedIds: [],
  };
}

const BACKUP_STORAGE_KEY = 'study_room_app_state_backup';

export function loadStudyState(): StudyState {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    
    // If main key is missing or empty, check redundant backup storage
    if (!raw) {
      const backupRaw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (backupRaw) {
        raw = backupRaw;
      }
    }

    if (!raw) {
      const blank = getBlankState();
      return blank;
    }

    const parsed = JSON.parse(raw);
    
    // If parsed state has no subjects or goals, check if backup has them
    if (
      (!parsed.subjects || parsed.subjects.length === 0) &&
      (!parsed.goals || parsed.goals.length === 0)
    ) {
      const backupRaw = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (backupRaw) {
        try {
          const backupParsed = JSON.parse(backupRaw);
          if (
            (backupParsed.subjects && backupParsed.subjects.length > 0) ||
            (backupParsed.goals && backupParsed.goals.length > 0)
          ) {
            return {
              profile: {
                name: backupParsed.profile?.name ?? parsed.profile?.name ?? '',
                profession: backupParsed.profile?.profession ?? parsed.profile?.profession ?? '',
                institution: backupParsed.profile?.institution ?? parsed.profile?.institution ?? '',
                targetGoal: backupParsed.profile?.targetGoal ?? parsed.profile?.targetGoal ?? '',
                avatarColor: backupParsed.profile?.avatarColor ?? parsed.profile?.avatarColor ?? '#0d9488',
              },
              subjects: backupParsed.subjects || [],
              goals: backupParsed.goals || [],
              timetable: backupParsed.timetable || [],
              habits: backupParsed.habits || [],
              habitLogs: backupParsed.habitLogs || {},
              studySessions: backupParsed.studySessions || [],
              notes: backupParsed.notes || [],
              examCountdown: backupParsed.examCountdown || null,
              settings: {
                dailyTargetHours: backupParsed.settings?.dailyTargetHours ?? 3.5,
                pomodoroWorkMinutes: backupParsed.settings?.pomodoroWorkMinutes ?? 25,
                pomodoroShortBreakMinutes: backupParsed.settings?.pomodoroShortBreakMinutes ?? 5,
                pomodoroLongBreakMinutes: backupParsed.settings?.pomodoroLongBreakMinutes ?? 15,
                soundEnabled: backupParsed.settings?.soundEnabled ?? true,
                ambientNoise: 'off',
                theme: backupParsed.settings?.theme ?? 'light',
              },
              deletedIds: backupParsed.deletedIds || [],
            };
          }
        } catch {}
      }
    }

    return {
      profile: {
        name: parsed.profile?.name ?? '',
        profession: parsed.profile?.profession ?? '',
        institution: parsed.profile?.institution ?? '',
        targetGoal: parsed.profile?.targetGoal ?? '',
        avatarColor: parsed.profile?.avatarColor ?? '#0d9488',
      },
      subjects: parsed.subjects || [],
      goals: parsed.goals || [],
      timetable: parsed.timetable || [],
      habits: parsed.habits || [],
      habitLogs: parsed.habitLogs || {},
      studySessions: parsed.studySessions || [],
      notes: parsed.notes || [],
      examCountdown: parsed.examCountdown || null,
      settings: {
        dailyTargetHours: parsed.settings?.dailyTargetHours ?? 3.5,
        pomodoroWorkMinutes: parsed.settings?.pomodoroWorkMinutes ?? 25,
        pomodoroShortBreakMinutes: parsed.settings?.pomodoroShortBreakMinutes ?? 5,
        pomodoroLongBreakMinutes: parsed.settings?.pomodoroLongBreakMinutes ?? 15,
        soundEnabled: parsed.settings?.soundEnabled ?? true,
        ambientNoise: 'off',
        theme: parsed.settings?.theme ?? 'light',
      },
      deletedIds: parsed.deletedIds || [],
    };
  } catch (err) {
    console.error('Failed to parse saved study state:', err);
    return getBlankState();
  }
}

export function saveStudyState(state: StudyState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Redundant backup save whenever user has study data
    if (
      (state.subjects && state.subjects.length > 0) ||
      (state.goals && state.goals.length > 0) ||
      (state.timetable && state.timetable.length > 0) ||
      (state.habits && state.habits.length > 0)
    ) {
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.error('Failed to save study state:', err);
  }
}

export function clearAllData(): StudyState {
  const emptyState = getBlankState();
  saveStudyState(emptyState);
  return emptyState;
}

export function exportDataAsJSON(state: StudyState): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `study-room-backup-${getTodayString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importDataFromJSON(jsonString: string): StudyState {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.subjects) || !Array.isArray(parsed.goals)) {
    throw new Error('Invalid Study Room JSON structure');
  }
  saveStudyState(parsed);
  return parsed;
}
