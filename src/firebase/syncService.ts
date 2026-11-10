import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { StudyState } from '../types';

/**
 * Save user study state to Firestore under /users/{userId}/studyData/current
 */
export async function saveStudyStateToCloud(userId: string, state: StudyState): Promise<void> {
  if (!userId) return;
  const path = `users/${userId}/studyData/current`;
  const payload = {
    userId,
    profile: state.profile,
    subjects: state.subjects,
    goals: state.goals,
    timetable: state.timetable,
    habits: state.habits,
    habitLogs: state.habitLogs,
    studySessions: state.studySessions,
    notes: state.notes,
    examCountdown: state.examCountdown,
    settings: state.settings,
    deletedIds: state.deletedIds || [],
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', userId, 'studyData', 'current'), payload);
  } catch (error) {
    console.warn('saveStudyStateToCloud notice:', error);
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
      subjects: Array.isArray(data.subjects) ? data.subjects : [],
      goals: Array.isArray(data.goals) ? data.goals : [],
      timetable: Array.isArray(data.timetable) ? data.timetable : [],
      habits: Array.isArray(data.habits) ? data.habits : [],
      habitLogs: data.habitLogs || {},
      studySessions: Array.isArray(data.studySessions) ? data.studySessions : [],
      notes: Array.isArray(data.notes) ? data.notes : [],
      examCountdown: data.examCountdown || null,
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
          subjects: Array.isArray(data.subjects) ? data.subjects : [],
          goals: Array.isArray(data.goals) ? data.goals : [],
          timetable: Array.isArray(data.timetable) ? data.timetable : [],
          habits: Array.isArray(data.habits) ? data.habits : [],
          habitLogs: data.habitLogs || {},
          studySessions: Array.isArray(data.studySessions) ? data.studySessions : [],
          notes: Array.isArray(data.notes) ? data.notes : [],
          examCountdown: data.examCountdown || null,
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
