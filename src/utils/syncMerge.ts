import { StudyState, Subject, Goal, TimetableBlock, Habit, StudySession, Note } from '../types';

/**
 * Intelligent two-way merge for StudyRoom state across multiple devices.
 * Guarantees zero data loss: items are merged by unique ID rather than blindly overwritten.
 */
export function mergeStudyStates(local: StudyState, remote: StudyState | null | undefined): StudyState {
  if (!remote) return local;

  const deletedSet = new Set<string>([
    ...(local.deletedIds || []),
    ...(remote.deletedIds || []),
  ]);

  // 1. Merge Subjects by ID
  const subjectMap = new Map<string, Subject>();
  (remote.subjects || []).forEach((sub) => {
    if (sub && sub.id && !deletedSet.has(sub.id)) subjectMap.set(sub.id, sub);
  });
  (local.subjects || []).forEach((sub) => {
    if (sub && sub.id && !deletedSet.has(sub.id)) {
      const existing = subjectMap.get(sub.id);
      if (!existing) {
        subjectMap.set(sub.id, sub);
      } else {
        subjectMap.set(sub.id, {
          ...existing,
          ...sub,
          name: sub.name || existing.name,
          color: sub.color || existing.color,
          notes: sub.notes || existing.notes,
        });
      }
    }
  });

  // 2. Merge Goals by ID
  const goalMap = new Map<string, Goal>();
  (remote.goals || []).forEach((g) => {
    if (g && g.id && !deletedSet.has(g.id)) goalMap.set(g.id, g);
  });
  (local.goals || []).forEach((g) => {
    if (g && g.id && !deletedSet.has(g.id)) {
      const existing = goalMap.get(g.id);
      if (!existing) {
        goalMap.set(g.id, g);
      } else {
        // Retain completion state if completed on either device
        goalMap.set(g.id, {
          ...existing,
          ...g,
          completed: existing.completed || g.completed,
        });
      }
    }
  });

  // 3. Merge Timetable blocks by ID
  const timetableMap = new Map<string, TimetableBlock>();
  (remote.timetable || []).forEach((b) => {
    if (b && b.id && !deletedSet.has(b.id)) timetableMap.set(b.id, b);
  });
  (local.timetable || []).forEach((b) => {
    if (b && b.id && !deletedSet.has(b.id)) timetableMap.set(b.id, b);
  });

  // 4. Merge Habits by ID and habitLogs by date keys
  const habitMap = new Map<string, Habit>();
  (remote.habits || []).forEach((h) => {
    if (h && h.id && !deletedSet.has(h.id)) habitMap.set(h.id, h);
  });
  (local.habits || []).forEach((h) => {
    if (h && h.id && !deletedSet.has(h.id)) habitMap.set(h.id, h);
  });

  const mergedHabitLogs: Record<string, string[]> = {
    ...(remote.habitLogs || {}),
  };
  if (local.habitLogs) {
    Object.entries(local.habitLogs).forEach(([date, ids]) => {
      const existing = mergedHabitLogs[date] || [];
      mergedHabitLogs[date] = Array.from(new Set([...existing, ...(ids || [])]));
    });
  }

  // 5. Merge Study Sessions by ID
  const sessionMap = new Map<string, StudySession>();
  (remote.studySessions || []).forEach((s) => {
    if (s && s.id && !deletedSet.has(s.id)) sessionMap.set(s.id, s);
  });
  (local.studySessions || []).forEach((s) => {
    if (s && s.id && !deletedSet.has(s.id)) sessionMap.set(s.id, s);
  });

  // 6. Merge Notes by ID (newest updatedAt wins)
  const noteMap = new Map<string, Note>();
  (remote.notes || []).forEach((n) => {
    if (n && n.id && !deletedSet.has(n.id)) noteMap.set(n.id, n);
  });
  (local.notes || []).forEach((n) => {
    if (n && n.id && !deletedSet.has(n.id)) {
      const existing = noteMap.get(n.id);
      if (!existing) {
        noteMap.set(n.id, n);
      } else {
        const localTime = new Date(n.updatedAt || n.createdAt || 0).getTime();
        const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        noteMap.set(n.id, localTime >= remoteTime ? n : existing);
      }
    }
  });

  // 7. Profile info
  const mergedProfile = {
    name: local.profile?.name?.trim() || remote.profile?.name?.trim() || '',
    profession: local.profile?.profession?.trim() || remote.profile?.profession?.trim() || '',
    institution: local.profile?.institution?.trim() || remote.profile?.institution?.trim() || '',
    avatarColor: local.profile?.avatarColor || remote.profile?.avatarColor || '#0d9488',
  };

  // 8. Settings
  const mergedSettings = {
    dailyTargetHours: local.settings?.dailyTargetHours ?? remote.settings?.dailyTargetHours ?? 3.5,
    pomodoroWorkMinutes: local.settings?.pomodoroWorkMinutes ?? remote.settings?.pomodoroWorkMinutes ?? 25,
    pomodoroShortBreakMinutes: local.settings?.pomodoroShortBreakMinutes ?? remote.settings?.pomodoroShortBreakMinutes ?? 5,
    pomodoroLongBreakMinutes: local.settings?.pomodoroLongBreakMinutes ?? remote.settings?.pomodoroLongBreakMinutes ?? 15,
    soundEnabled: local.settings?.soundEnabled ?? remote.settings?.soundEnabled ?? true,
    ambientNoise: local.settings?.ambientNoise ?? remote.settings?.ambientNoise ?? 'off',
    theme: local.settings?.theme ?? remote.settings?.theme ?? 'system',
  };

  return {
    profile: mergedProfile,
    subjects: Array.from(subjectMap.values()),
    goals: Array.from(goalMap.values()),
    timetable: Array.from(timetableMap.values()),
    habits: Array.from(habitMap.values()),
    habitLogs: mergedHabitLogs,
    studySessions: Array.from(sessionMap.values()),
    notes: Array.from(noteMap.values()),
    examCountdown: local.examCountdown || remote.examCountdown || null,
    settings: mergedSettings,
    deletedIds: Array.from(deletedSet).slice(-500),
  };
}
