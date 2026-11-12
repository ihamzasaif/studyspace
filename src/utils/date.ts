import { DayOfWeek, HabitLog, StudySession, Goal } from '../types';

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDayName(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDayOfWeek(dateStr: string): DayOfWeek {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday
  const map: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return map[dayIndex];
}

/**
 * Returns Monday to Sunday dates of the week containing `targetDate`
 */
export function getWeekDates(targetDateStr: string): { day: DayOfWeek; dateStr: string; label: string; isToday: boolean }[] {
  const [year, month, day] = targetDateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);

  // JavaScript: 0 is Sun, 1 is Mon...
  const dayOfWeek = targetDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + diffToMonday);

  const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const todayStr = getTodayString();

  return days.map((dayName, idx) => {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + idx);
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    return {
      day: dayName,
      dateStr,
      label: cur.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
      isToday: dateStr === todayStr,
    };
  });
}

/**
 * Get past N days array ending today
 */
export function getPastNDays(n: number): string[] {
  const result: string[] = [];
  const today = getTodayString();
  for (let i = n - 1; i >= 0; i--) {
    result.push(addDays(today, -i));
  }
  return result;
}

/**
 * Calculate current continuous streak for a single habit
 */
export function calculateHabitStreak(habitId: string, habitLogs: HabitLog): { current: number; best: number } {
  const today = getTodayString();
  const yesterday = addDays(today, -1);

  let current = 0;
  let checkDate = habitLogs[today]?.includes(habitId) ? today : yesterday;

  while (habitLogs[checkDate]?.includes(habitId)) {
    current++;
    checkDate = addDays(checkDate, -1);
  }

  // Calculate best streak in recorded history
  const recordedDates = Object.keys(habitLogs)
    .filter(d => habitLogs[d].includes(habitId))
    .sort();

  let best = current;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const date of recordedDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const nextExpected = addDays(prevDate, 1);
      if (date === nextExpected) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > best) best = tempStreak;
    prevDate = date;
  }

  return { current, best: Math.max(best, current) };
}

/**
 * Calculate overall study streak (days with at least 1 study session or 1 completed goal)
 */
export function calculateOverallStudyStreak(sessions: StudySession[], goals: Goal[]): number {
  const activeDates = new Set<string>();

  sessions.forEach(s => {
    if (s.minutes > 0) activeDates.add(s.date);
  });
  goals.forEach(g => {
    if (g.completed) activeDates.add(g.date);
  });

  const today = getTodayString();
  const yesterday = addDays(today, -1);

  let streak = 0;
  let checkDate = activeDates.has(today) ? today : yesterday;

  while (activeDates.has(checkDate)) {
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  return streak;
}

/**
 * Calculate days remaining until an exam
 */
export function getDaysRemaining(targetDateStr: string): { days: number; isPast: boolean; label: string } {
  if (!targetDateStr) return { days: 0, isPast: true, label: 'No date set' };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const [y, m, d] = targetDateStr.split('T')[0].split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), isPast: true, label: `${Math.abs(diffDays)}d ago` };
  } else if (diffDays === 0) {
    return { days: 0, isPast: false, label: 'Today!' };
  } else if (diffDays === 1) {
    return { days: 1, isPast: false, label: 'Tomorrow' };
  } else {
    return { days: diffDays, isPast: false, label: `${diffDays} days left` };
  }
}

/**
 * Format minutes into human-readable hours and minutes without awkward decimals like 0.1h
 * Examples:
 *   0 -> '0m'
 *   15 -> '15m'
 *   60 -> '1h'
 *   75 -> '1h 15m'
 */
export function formatMinutesHuman(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0m';
  const mins = Math.round(totalMinutes);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m}m`;
}
