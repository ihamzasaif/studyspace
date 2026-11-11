import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { useBackHandler } from '../../hooks/useBackHandler';
import { getDaysRemaining, formatDateDisplay } from '../../utils/date';
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
  Circle,
  Calendar,
  CheckSquare,
  Sparkles,
  Flame,
} from 'lucide-react';

export const FocusTimerView: React.FC = () => {
  const {
    state,
    getSubject,
    todayGoals,
    todayCompletedGoalsCount,
    toggleGoal,
    todayStr,
    timerMode,
    isTimerRunning,
    timerSessionCount,
    timerSubjectId,
    ambientSound,
    ambientVolume,
    timerFormatted,
    timerProgressRatio,
    toggleTimerRunning,
    resetTimer,
    skipTimer,
    switchTimerMode,
    setTimerSubjectId,
    setAmbientSoundMode,
    setAmbientVolumeLevel,
  } = useStudy();

  const [isFullscreen, setIsFullscreen] = useState(false);
  useBackHandler(isFullscreen, () => setIsFullscreen(false), 'timer-fullscreen');

  const activeSubject = getSubject(timerSubjectId) || state.subjects[0];

  // Exam Countdown details
  const examInfo = state.examCountdown ? getDaysRemaining(state.examCountdown.targetDate) : null;
  const examSubject = state.examCountdown?.subjectId ? getSubject(state.examCountdown.subjectId) : null;

  // Circular progress: r=105 -> circumference ≈ 659.73
  const CIRCLE_CIRCUMFERENCE = 660;
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, timerProgressRatio)));

  return (
    <div
      className={`w-full transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#F8F9FA] dark:bg-[#121417] flex flex-col items-center justify-center p-4'
          : 'max-w-6xl mx-auto h-[calc(100vh-6.25rem)] max-h-[calc(100vh-6.25rem)] flex flex-col justify-between overflow-hidden gap-2.5 pb-1'
      }`}
    >
      {/* Top Banner (only when not fullscreen) */}
      {!isFullscreen && (
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Focus Pomodoro Timer
            </h1>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                timerMode === 'work'
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:indigo-300 border border-indigo-200 dark:border-indigo-800'
              }`}
            >
              {timerMode === 'work' ? 'Focus Interval' : 'Rest Break'}
            </span>
          </div>

          <button
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/60 shadow-xs transition-colors shrink-0"
            title="Expand to Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      )}

      {/* Main Content Area: Landscape Split on Desktop / Tablet (Zero Vertical Scroll) */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0 overflow-hidden items-stretch">
        {/* Left Side Panel: Target Exam & Today's Goals (Visible on Tablet & Desktop, Hidden on Mobile as requested) */}
        {!isFullscreen && (
          <div className="hidden md:flex flex-col gap-3 w-72 lg:w-80 shrink-0 min-h-0 overflow-hidden">
            {/* 1. Target Exam / Target Hours Card */}
            <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-3.5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs shrink-0">
              {state.examCountdown ? (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        Target Exam
                      </span>
                      <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                        {examInfo?.label}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate mt-0.5">
                      {state.examCountdown.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      <span>{formatDateDisplay(state.examCountdown.targetDate)}</span>
                      {examSubject && (
                        <>
                          <span>·</span>
                          <span className="truncate">{examSubject.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      Daily Study Target
                    </span>
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {state.settings.dailyTargetHours} Hours Goal
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                      Stay Consistent
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Today's Goals Checklist Panel */}
            <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1D23] rounded-2xl p-3.5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs min-h-0 overflow-hidden">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800/80 shrink-0">
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Today's Goals
                  </span>
                </div>
                <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
                  {todayCompletedGoalsCount}/{todayGoals.length} done
                </span>
              </div>

              {/* Scrollable list inside panel */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {todayGoals.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-6 text-neutral-400 text-xs">
                    <Sparkles className="w-5 h-5 text-neutral-300 dark:text-neutral-600 mb-1" />
                    <span>No goals scheduled for today.</span>
                  </div>
                ) : (
                  todayGoals.map((goal) => {
                    const sub = getSubject(goal.subjectId);
                    return (
                      <div
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={`flex items-start gap-2 p-2 rounded-xl border transition-colors cursor-pointer select-none ${
                          goal.completed
                            ? 'bg-neutral-50/60 dark:bg-neutral-800/20 border-neutral-200/50 dark:border-neutral-800/40 opacity-75'
                            : 'bg-white dark:bg-neutral-800/40 border-neutral-200/80 dark:border-neutral-800/80 hover:border-teal-500'
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 shrink-0"
                          aria-label={goal.completed ? 'Mark incomplete' : 'Mark completed'}
                        >
                          {goal.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 fill-teal-100 dark:fill-teal-950/40" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-medium truncate ${
                              goal.completed
                                ? 'line-through text-neutral-400 dark:text-neutral-500'
                                : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {goal.title}
                          </p>
                          {sub && (
                            <span
                              className="text-[10px] font-medium flex items-center gap-1 mt-0.5 truncate"
                              style={{ color: sub.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                              {sub.name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right / Center Panel: The Focus Timer (Compact & Zero Scroll) */}
        <div className="flex-1 flex flex-col justify-between items-center bg-white dark:bg-[#1A1D23] rounded-3xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs min-h-0 overflow-hidden relative">
          {/* Fullscreen exit button */}
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Exit Fullscreen"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          )}

          {/* Top Row: Mode Pills + Subject Selector */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            {/* Mode Selector Tabs */}
            <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-semibold">
              <button
                onClick={() => switchTimerMode('work')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  timerMode === 'work'
                    ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Focus ({state.settings.pomodoroWorkMinutes}m)
              </button>
              <button
                onClick={() => switchTimerMode('shortBreak')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  timerMode === 'shortBreak'
                    ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Short Break ({state.settings.pomodoroShortBreakMinutes}m)
              </button>
              <button
                onClick={() => switchTimerMode('longBreak')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  timerMode === 'longBreak'
                    ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Long Break ({state.settings.pomodoroLongBreakMinutes}m)
              </button>
            </div>

            {/* Subject Picker */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-400 font-medium hidden sm:inline">Subject:</span>
              <select
                value={timerSubjectId}
                onChange={(e) => setTimerSubjectId(e.target.value)}
                disabled={isTimerRunning}
                className="px-2.5 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-medium focus:outline-hidden disabled:opacity-60 cursor-pointer max-w-[160px] truncate"
              >
                {state.subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Central Circular Countdown: Scaled to fit in viewport without scroll */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-60 lg:h-60 flex items-center justify-center my-auto shrink-0">
            <svg viewBox="0 0 240 240" className="w-full h-full transform -rotate-90">
              {/* Background ring */}
              <circle
                cx="120"
                cy="120"
                r="105"
                className="stroke-neutral-100 dark:stroke-neutral-800"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Active progress ring */}
              <circle
                cx="120"
                cy="120"
                r="105"
                className="stroke-teal-600 dark:stroke-teal-400 transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Central Time and Status */}
            <div className="absolute flex flex-col items-center justify-center text-center px-4">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-bold font-mono tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
                {timerFormatted}
              </span>
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 mt-1 uppercase tracking-wider">
                {timerMode === 'work' ? `Session #${timerSessionCount}` : 'Rest & Rehydrate'}
              </span>
              {activeSubject && (
                <span
                  className="text-xs font-medium mt-0.5 truncate max-w-[180px]"
                  style={{ color: activeSubject.color }}
                >
                  {activeSubject.name}
                </span>
              )}
            </div>
          </div>

          {/* Primary Controls */}
          <div className="flex items-center gap-4 shrink-0 my-1">
            <button
              onClick={resetTimer}
              className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all hover:scale-105 cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTimerRunning}
              className={`px-7 py-3 rounded-2xl font-bold text-sm text-white flex items-center gap-2 shadow-sm transition-all hover:scale-105 cursor-pointer ${
                isTimerRunning ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : timerProgressRatio > 0 && timerProgressRatio < 1 ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{timerMode === 'work' ? 'Resume Focus' : 'Resume Break'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{timerMode === 'work' ? 'Start Focus' : 'Start Break'}</span>
                </>
              )}
            </button>

            <button
              onClick={skipTimer}
              className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all hover:scale-105 cursor-pointer"
              title="Skip to next session"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Ambient Noise Bar */}
          <div className="flex flex-col items-center gap-1.5 pt-3 border-t border-neutral-100 dark:border-neutral-800 w-full shrink-0">
            <div className="flex items-center justify-between w-full max-w-sm px-1">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
                {ambientSound !== 'off' ? (
                  <Volume2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>Background Noise</span>
                {ambientSound !== 'off' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wider">
                    Playing
                  </span>
                )}
              </span>

              {/* Volume Slider */}
              {ambientSound !== 'off' && (
                <div className="flex items-center gap-1">
                  <Volume1 className="w-3 h-3 text-neutral-400" />
                  <input
                    type="range"
                    min="0.08"
                    max="0.45"
                    step="0.02"
                    value={ambientVolume}
                    onChange={(e) => setAmbientVolumeLevel(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    title="Volume"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 flex-wrap justify-center">
              {([
                { key: 'off', label: 'Mute' },
                { key: 'brown', label: 'Brown' },
                { key: 'rain', label: 'Rain' },
                { key: 'waves', label: 'Waves' },
                { key: 'white', label: 'White' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAmbientSoundMode(key)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
                    ambientSound === key
                      ? 'bg-teal-700 text-white shadow-xs font-semibold'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700/60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
