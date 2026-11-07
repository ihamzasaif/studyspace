import React, { useState, useEffect, useRef } from 'react';
import { useStudy } from '../../context/StudyContext';
import { playChime, playSoftClick, startAmbientNoise, stopAmbientNoise } from '../../utils/audio';
import { useBackHandler } from '../../hooks/useBackHandler';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Volume1,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export const FocusTimerView: React.FC = () => {
  const { state, addStudySession, todayStr, getSubject } = useStudy();

  const [mode, setMode] = useState<TimerMode>('work');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(state.subjects[0]?.id || '');
  const [sessionCount, setSessionCount] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ambientSound, setAmbientSound] = useState<'off' | 'brown' | 'white' | 'rain'>('off');

  useBackHandler(isFullscreen, () => setIsFullscreen(false), 'timer-fullscreen');

  // Timer length in seconds based on settings
  const getDurationSeconds = (m: TimerMode) => {
    if (m === 'work') return state.settings.pomodoroWorkMinutes * 60;
    if (m === 'shortBreak') return state.settings.pomodoroShortBreakMinutes * 60;
    return state.settings.pomodoroLongBreakMinutes * 60;
  };

  const [timeLeft, setTimeLeft] = useState<number>(() => getDurationSeconds('work'));
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timeLeft when mode changes or settings change (if timer not running)
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(getDurationSeconds(mode));
    }
  }, [mode, state.settings.pomodoroWorkMinutes, state.settings.pomodoroShortBreakMinutes, state.settings.pomodoroLongBreakMinutes]);

  // Main countdown tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, selectedSubjectId, sessionCount, state.settings.soundEnabled]);

  // Handle session completion
  const handleSessionComplete = () => {
    setIsRunning(false);

    if (state.settings.soundEnabled) {
      playChime();
    }

    if (mode === 'work') {
      // Record completed study session
      const minutesSpent = state.settings.pomodoroWorkMinutes;
      addStudySession({
        subjectId: selectedSubjectId || state.subjects[0]?.id || 'general',
        date: todayStr,
        minutes: minutesSpent,
        mode: 'pomodoro',
        note: `Pomodoro Focus session #${sessionCount}`,
      });

      // Switch to break
      if (sessionCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(state.settings.pomodoroLongBreakMinutes * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(state.settings.pomodoroShortBreakMinutes * 60);
      }
      setSessionCount((prev) => prev + 1);
    } else {
      // Break completed, switch back to work
      setMode('work');
      setTimeLeft(state.settings.pomodoroWorkMinutes * 60);
    }
  };

  const handleStartPause = () => {
    playSoftClick();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    playSoftClick();
    setIsRunning(false);
    setTimeLeft(getDurationSeconds(mode));
  };

  const handleSkip = () => {
    playSoftClick();
    setIsRunning(false);
    if (mode === 'work') {
      setMode('shortBreak');
    } else {
      setMode('work');
    }
  };

  const switchMode = (newMode: TimerMode) => {
    playSoftClick();
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDurationSeconds(newMode));
  };

  const handleAmbientChange = (type: 'off' | 'brown' | 'white' | 'rain') => {
    setAmbientSound(type);
    if (type === 'off') {
      stopAmbientNoise();
    } else {
      startAmbientNoise(type);
    }
  };

  // Cleanup ambient noise on unmount
  useEffect(() => {
    return () => {
      stopAmbientNoise();
    };
  }, []);

  // Format MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalDuration = getDurationSeconds(mode);
  const progressRatio = (totalDuration - timeLeft) / totalDuration;
  const strokeDashoffset = 754 * (1 - progressRatio); // 2 * PI * r (r=120 -> circumference = 753.98)

  const activeSubject = getSubject(selectedSubjectId);

  return (
    <div
      className={`transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#F8F9FA] dark:bg-[#121417] flex flex-col items-center justify-center p-6'
          : 'max-w-3xl mx-auto space-y-6 pb-12'
      }`}
    >
      {/* Top Banner (only when not fullscreen) */}
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Focus Pomodoro Timer
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              Dedicated deep work intervals. Sessions are automatically logged to your subject hours.
            </p>
          </div>

          <button
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/60 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen Mode</span>
          </button>
        </div>
      )}

      {/* Main Timer Glass Container */}
      <div className="w-full max-w-xl mx-auto bg-white dark:bg-[#1A1D23] rounded-3xl p-6 sm:p-10 border border-neutral-200/80 dark:border-neutral-800/80 shadow-sm flex flex-col items-center relative">
        {/* Fullscreen exit button if fullscreen */}
        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Exit Fullscreen"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-semibold mb-8">
          <button
            onClick={() => switchMode('work')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${
              mode === 'work'
                ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Focus ({state.settings.pomodoroWorkMinutes}m)
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${
              mode === 'shortBreak'
                ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Short Break ({state.settings.pomodoroShortBreakMinutes}m)
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${
              mode === 'longBreak'
                ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            Long Break ({state.settings.pomodoroLongBreakMinutes}m)
          </button>
        </div>

        {/* Subject Picker for this session */}
        <div className="flex items-center gap-2 mb-6 text-xs">
          <span className="text-neutral-500 font-medium">Study Subject:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium focus:outline-hidden disabled:opacity-60 cursor-pointer"
          >
            {state.subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Circular Countdown Display */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="50%"
              cy="50%"
              r="120"
              className="stroke-neutral-100 dark:stroke-neutral-800"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Active progress ring */}
            <circle
              cx="50%"
              cy="50%"
              r="120"
              className="stroke-teal-600 dark:stroke-teal-400 transition-all duration-1000 ease-linear"
              strokeWidth="10"
              strokeDasharray="754"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Central Time and Status */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-5xl sm:text-6xl font-bold font-mono tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
              {timeFormatted}
            </span>
            <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 mt-2 uppercase tracking-wider">
              {mode === 'work' ? `Session #${sessionCount}` : 'Rest & Rehydrate'}
            </span>
            {activeSubject && (
              <span
                className="text-[11px] font-medium mt-1 break-words max-w-[220px] px-2 leading-tight"
                style={{ color: activeSubject.color }}
              >
                {activeSubject.name}
              </span>
            )}
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-4 mt-8">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all hover:scale-105"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleStartPause}
            className={`px-8 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center gap-2 shadow-sm transition-all hover:scale-105 ${
              isRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={handleSkip}
            className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all hover:scale-105"
            title="Skip to next session"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient Sound Controller */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 w-full justify-center flex-wrap">
          <span className="text-xs text-neutral-500 flex items-center gap-1.5 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Calm Background Noise:</span>
          </span>

          <div className="flex items-center gap-1">
            {(['off', 'brown', 'white', 'rain'] as const).map((soundType) => (
              <button
                key={soundType}
                onClick={() => handleAmbientChange(soundType)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                  ambientSound === soundType
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                }`}
              >
                {soundType === 'off' ? 'Mute' : soundType}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
