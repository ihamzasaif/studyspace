export interface Subject {
  id: string;
  name: string;
  color: string; // Tailwind color hex or class identifier
  code?: string; // Optional short code like 'CS101'
  notes?: string;
  createdAt: string;
}

export type Priority = 'low' | 'medium' | 'high';

export interface Goal {
  id: string;
  title: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  priority: Priority;
  notes?: string;
  estimatedMinutes?: number;
  order: number;
  completedAt?: string;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface TimetableBlock {
  id: string;
  subjectId: string;
  day: DayOfWeek;
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  title?: string;
  location?: string;
}

export interface Habit {
  id: string;
  name: string;
  category?: string;
  description?: string;
  createdAt: string;
  icon?: string;
}

// Habit log: date (YYYY-MM-DD) -> array of habit IDs completed on that date
export interface HabitLog {
  [date: string]: string[];
}

export interface StudySession {
  id: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  mode: 'pomodoro' | 'manual';
  timestamp: string;
  note?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId?: string;
  isPinned: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface ExamCountdown {
  title: string;
  targetDate: string; // YYYY-MM-DDTHH:mm or YYYY-MM-DD
  subjectId?: string;
}

export interface UserSettings {
  dailyTargetHours: number; // e.g. 4.0
  pomodoroWorkMinutes: number; // default 25
  pomodoroShortBreakMinutes: number; // default 5
  pomodoroLongBreakMinutes: number; // default 15
  soundEnabled: boolean;
  ambientNoise: 'off' | 'brown' | 'white' | 'rain';
  theme: 'light' | 'dark' | 'system';
}

export interface UserProfile {
  name: string;
  profession: string;
  institution?: string;
  targetGoal?: string;
  avatarColor?: string;
}

export interface StudyState {
  profile: UserProfile;
  subjects: Subject[];
  goals: Goal[];
  timetable: TimetableBlock[];
  habits: Habit[];
  habitLogs: HabitLog;
  studySessions: StudySession[];
  notes: Note[];
  examCountdown: ExamCountdown | null;
  settings: UserSettings;
}

export type ActiveTab =
  | 'dashboard'
  | 'subjects'
  | 'goals'
  | 'timetable'
  | 'habits'
  | 'timer'
  | 'notes'
  | 'stats'
  | 'profile';

