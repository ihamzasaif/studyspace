import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { StudyState } from '../types';

/**
 * Deep sanitizer for Firestore payloads: strips undefined values and converts to null
 * because Firestore DocumentReference.set() rejects undefined field values.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (value === undefined) {
        return null;
      }
      return value;
    })
  );
}

/**
 * Save user study state to Firestore under /users/{userId}/studyData/current
 */
export async function saveStudyStateToCloud(userId: string, state: StudyState): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/studyData/current`;
  const rawPayload = {
    userId,
    profile: state.profile || { name: '', profession: '', avatarColor: '#0d9488' },
    subjects: state.subjects || [],
    goals: state.goals || [],
    timetable: state.timetable || [],
    habits: state.habits || [],
    habitLogs: state.habitLogs || {},
    studySessions: state.studySessions || [],
    notes: state.notes || [],
    examCountdown: state.examCountdown || null,
    settings: state.settings || {
      dailyTargetHours: 3.5,
      pomodoroWorkMinutes: 25,
      pomodoroShortBreakMinutes: 5,
      pomodoroLongBreakMinutes: 15,
      soundEnabled: true,
      ambientNoise: 'off',
      theme: 'system',
    },
    deletedIds: state.deletedIds || [],
    updatedAt: new Date().toISOString(),
  };

  const safePayload = sanitizeForFirestore(rawPayload);

  try {
    await setDoc(doc(db, 'users', userId, 'studyData', 'current'), safePayload);
  } catch (error) {
    console.error('saveStudyStateToCloud error:', error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch cloud state once
 */
export async function getCloudStudyState(userId: string): Promise<StudyState | null> {
  if (!userId) return null;
  const path = `users/${userId}/studyData/current`;
  try {
    const snap = await getDoc(doc(db, 'users', userId, 'studyData', 'current'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      profile: data.profile || { name: '', profession: '', avatarColor: '#0d9488' },
      subjects: Array.isArray(data.subjects)
        ? data.subjects.map((s: any) => ({
            ...s,
            code: s.code || undefined,
            notes: s.notes || undefined,
          }))
        : [],
      goals: Array.isArray(data.goals)
        ? data.goals.map((g: any) => ({
            ...g,
            notes: g.notes || undefined,
            estimatedMinutes: g.estimatedMinutes || undefined,
            completedAt: g.completedAt || undefined,
          }))
        : [],
      timetable: Array.isArray(data.timetable)
        ? data.timetable.map((t: any) => ({
            ...t,
            title: t.title || undefined,
            location: t.location || undefined,
          }))
        : [],
      habits: Array.isArray(data.habits)
        ? data.habits.map((h: any) => ({
            ...h,
            category: h.category || undefined,
            description: h.description || undefined,
            icon: h.icon || undefined,
          }))
        : [],
      habitLogs: data.habitLogs || {},
      studySessions: Array.isArray(data.studySessions)
        ? data.studySessions.map((ss: any) => ({
            ...ss,
            note: ss.note || undefined,
          }))
        : [],
      notes: Array.isArray(data.notes)
        ? data.notes.map((n: any) => ({
            ...n,
            subjectId: n.subjectId || undefined,
          }))
        : [],
      examCountdown: data.examCountdown
        ? {
            title: data.examCountdown.title || '',
            targetDate: data.examCountdown.targetDate || '',
            subjectId: data.examCountdown.subjectId || undefined,
          }
        : null,
      settings: data.settings || {
        dailyTargetHours: 3.5,
        pomodoroWorkMinutes: 25,
        pomodoroShortBreakMinutes: 5,
        pomodoroLongBreakMinutes: 15,
        soundEnabled: true,
        ambientNoise: 'off',
        theme: 'system',
      },
      deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
    };
  } catch (error) {
    console.warn('getCloudStudyState notice:', error);
    return null;
  }
}

/**
 * Real-time listener for multi-device sync
 */
export function subscribeToCloudStudyState(
  userId: string,
  onUpdate: (state: StudyState) => void,
  onError?: (error: unknown) => void
) {
  if (!userId) return () => {};
  const path = `users/${userId}/studyData/current`;

  return onSnapshot(
    doc(db, 'users', userId, 'studyData', 'current'),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const incomingState: StudyState = {
          profile: data.profile || { name: '', profession: '', avatarColor: '#0d9488' },
          subjects: Array.isArray(data.subjects)
            ? data.subjects.map((s: any) => ({
                ...s,
                code: s.code || undefined,
                notes: s.notes || undefined,
              }))
            : [],
          goals: Array.isArray(data.goals)
            ? data.goals.map((g: any) => ({
                ...g,
                notes: g.notes || undefined,
                estimatedMinutes: g.estimatedMinutes || undefined,
                completedAt: g.completedAt || undefined,
              }))
            : [],
          timetable: Array.isArray(data.timetable)
            ? data.timetable.map((t: any) => ({
                ...t,
                title: t.title || undefined,
                location: t.location || undefined,
              }))
            : [],
          habits: Array.isArray(data.habits)
            ? data.habits.map((h: any) => ({
                ...h,
                category: h.category || undefined,
                description: h.description || undefined,
                icon: h.icon || undefined,
              }))
            : [],
          habitLogs: data.habitLogs || {},
          studySessions: Array.isArray(data.studySessions)
            ? data.studySessions.map((ss: any) => ({
                ...ss,
                note: ss.note || undefined,
              }))
            : [],
          notes: Array.isArray(data.notes)
            ? data.notes.map((n: any) => ({
                ...n,
                subjectId: n.subjectId || undefined,
              }))
            : [],
          examCountdown: data.examCountdown
            ? {
                title: data.examCountdown.title || '',
                targetDate: data.examCountdown.targetDate || '',
                subjectId: data.examCountdown.subjectId || undefined,
              }
            : null,
          settings: data.settings || {
            dailyTargetHours: 3.5,
            pomodoroWorkMinutes: 25,
            pomodoroShortBreakMinutes: 5,
            pomodoroLongBreakMinutes: 15,
            soundEnabled: true,
            ambientNoise: 'off',
            theme: 'system',
          },
          deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
        };
        onUpdate(incomingState);
      }
    },
    (error) => {
      console.warn('subscribeToCloudStudyState notice:', error);
      if (onError) onError(error);
    }
  );
}
