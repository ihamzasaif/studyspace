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
  Coffee,
  Check,
  Clock,
  Timer,
  Save,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

export const FocusTimerView: React.FC = () => {
  const {
    state,
    getSubject,
    todayGoals,
    todayCompletedGoalsCount,
    toggleGoal,
    todayStr,
    todayStudyMinutes,
    studyStreak,
    // Timer System Mode
    timerSystemMode,
    setTimerSystemMode,
    // Normal Study Timer
    normalElapsedSeconds,
    isNormalRunning,
    normalSubjectId,
    setNormalSubjectId,
    startNormalTimer,
    pauseNormalTimer,
    toggleNormalTimer,
    resetNormalTimer,
    saveNormalSession,
    normalFormatted,
    // Break System
    isNormalOnBreak,
    normalBreakCountdown,
    normalBreakTotalSeconds,
    isNormalBreakRunning,
    totalSessionBreakSeconds,
    startBreak,
    pauseBreak,
    resumeBreak,
    skipBreak,
    breakFormatted,
    // Pomodoro Timer
    timerMode,
    timerTimeLeft,
    isTimerRunning,
    timerSessionCount,
    timerSubjectId,
    timerFormatted,
    timerProgressRatio,
    toggleTimerRunning,
    resetTimer,
    skipTimer,
    switchTimerMode,
    setTimerSubjectId,
    // Ambient sound
    ambientSound,
    ambientVolume,
    setAmbientSoundMode,
    setAmbientVolumeLevel,
  } = useStudy();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSaveNoteInput, setShowSaveNoteInput] = useState(false);
  const [sessionNote, setSessionNote] = useState('');

  useBackHandler(isFullscreen, () => setIsFullscreen(false), 'timer-fullscreen');

  // Currently active subject for either mode
  const currentSubjectId = timerSystemMode === 'normal' ? normalSubjectId : timerSubjectId;
  const activeSubject = getSubject(currentSubjectId) || state.subjects[0];

  // Exam Countdown details
  const examInfo = state.examCountdown ? getDaysRemaining(state.examCountdown.targetDate) : null;
  const examSubject = state.examCountdown?.subjectId ? getSubject(state.examCountdown.subjectId) : null;

  // Circular progress for Pomodoro
  const CIRCLE_CIRCUMFERENCE = 660;
  const pomodoroStrokeOffset = CIRCLE_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, timerProgressRatio)));

  // Break progress ratio
  const breakProgressRatio = normalBreakTotalSeconds > 0
    ? (normalBreakTotalSeconds - normalBreakCountdown) / normalBreakTotalSeconds
    : 0;

  const handleResetClick = () => {
    if (timerSystemMode === 'normal') {
      if (normalElapsedSeconds >= 60) {
        setShowResetConfirm(true);
      } else {
        resetNormalTimer();
      }
    } else {
      resetTimer();
    }
  };

  const handleConfirmSaveAndReset = () => {
    saveNormalSession(sessionNote.trim() || undefined);
    setShowResetConfirm(false);
    setShowSaveNoteInput(false);
    setSessionNote('');
  };

  const handleConfirmDiscard = () => {
    resetNormalTimer();
    setShowResetConfirm(false);
    setShowSaveNoteInput(false);
    setSessionNote('');
  };

  const handleDirectSave = () => {
    saveNormalSession(sessionNote.trim() || undefined);
    setShowSaveNoteInput(false);
    setSessionNote('');
  };

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
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Timer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Focus Room</span>
            </h1>

            {/* Mode Selector Switcher */}
            <div className="flex items-center p-0.5 bg-neutral-200/70 dark:bg-neutral-800/80 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTimerSystemMode('normal')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  timerSystemMode === 'normal'
                    ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Normal Timer
              </button>
              <button
                type="button"
                onClick={() => setTimerSystemMode('pomodoro')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  timerSystemMode === 'pomodoro'
                    ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                Pomodoro
              </button>
            </div>
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

        {/* Right / Center Panel: The Main Timer (The Dominant Visual Focus) */}
        <div className="flex-1 flex flex-col justify-between items-center bg-white dark:bg-[#1A1D23] rounded-3xl p-3.5 sm:p-5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs min-h-0 overflow-hidden relative">
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

          {/* Top Row inside Timer: Mode Badge & Subject Selector */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            {/* Status Pill */}
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                  timerSystemMode === 'normal'
                    ? isNormalOnBreak
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : isNormalRunning
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                    : timerMode === 'work'
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                {timerSystemMode === 'normal' ? (
                  isNormalOnBreak ? (
                    <>
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>Break Active</span>
                    </>
                  ) : isNormalRunning ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      <span>Study Stopwatch (Live)</span>
                    </>
                  ) : normalElapsedSeconds > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-neutral-400" />
                      <span>Study Paused</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Normal Study Timer</span>
                    </>
                  )
                ) : (
                  <>
                    <Timer className="w-3.5 h-3.5" />
                    <span>{timerMode === 'work' ? 'Pomodoro Focus' : 'Pomodoro Break'}</span>
                  </>
                )}
              </span>

              {/* Pomodoro Sub-Mode Selectors (only visible when in Pomodoro system mode) */}
              {timerSystemMode === 'pomodoro' && (
                <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => switchTimerMode('work')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      timerMode === 'work'
                        ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Focus ({state.settings.pomodoroWorkMinutes}m)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTimerMode('shortBreak')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      timerMode === 'shortBreak'
                        ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Short ({state.settings.pomodoroShortBreakMinutes}m)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTimerMode('longBreak')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      timerMode === 'longBreak'
                        ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Long ({state.settings.pomodoroLongBreakMinutes}m)
                  </button>
                </div>
              )}
            </div>

            {/* Subject Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-400 font-medium hidden sm:inline">Subject:</span>
              <div className="relative flex items-center">
                {activeSubject && (
                  <span
                    className="w-2.5 h-2.5 rounded-full absolute left-2.5 pointer-events-none"
                    style={{ backgroundColor: activeSubject.color }}
                  />
                )}
                <select
                  value={currentSubjectId}
                  onChange={(e) => {
                    const id = e.target.value;
                    if (timerSystemMode === 'normal') {
                      setNormalSubjectId(id);
                    } else {
                      setTimerSubjectId(id);
                    }
                  }}
                  className="pl-7 pr-3 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-semibold focus:outline-hidden cursor-pointer max-w-[170px] truncate"
                >
                  {state.subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CENTRAL TIMER DISPLAY (Clean, Premium, Distraction-Free) */}
          {/* ======================================================== */}
          <div className="my-auto flex flex-col items-center justify-center w-full px-2 py-1 shrink-0">
            {timerSystemMode === 'normal' ? (
              /* --- NORMAL TIMER MODE --- */
              isNormalOnBreak ? (
                /* 1. Normal Break Active View */
                <div className="flex flex-col items-center text-center animate-fadeIn w-full max-w-md">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-2">
                    <Coffee className="w-3.5 h-3.5 animate-bounce" />
                    <span>Break in Progress ({Math.round(normalBreakTotalSeconds / 60)} Minutes)</span>
                  </div>

                  {/* Large Break Countdown Display */}
                  <div className="text-5xl sm:text-6xl lg:text-7xl font-bold font-mono tracking-tight tabular-nums text-amber-600 dark:text-amber-400 my-1 drop-shadow-xs">
                    {breakFormatted}
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1">
                    Study session paused at <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{normalFormatted}</span>. Your study progress is preserved.
                  </p>

                  {/* Break Progress Line */}
                  <div className="w-48 sm:w-60 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-linear"
                      style={{ width: `${Math.min(100, Math.max(0, breakProgressRatio * 100))}%` }}
                    />
                  </div>

                  {/* Break Controls */}
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={isNormalBreakRunning ? pauseBreak : resumeBreak}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform hover:scale-105 cursor-pointer"
                    >
                      {isNormalBreakRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Pause Break</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Resume Break</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={skipBreak}
                      className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="End break and return to study session"
                    >
                      <span>End Break & Study</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* 2. Normal Study Stopwatch Active View */
                <div className="flex flex-col items-center text-center w-full max-w-lg">
                  {/* Subtle status tag */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 tracking-wide uppercase">
                      Continuous Study Stopwatch
                    </span>
                    {activeSubject && (
                      <span
                        className="text-xs font-bold flex items-center gap-1"
                        style={{ color: activeSubject.color }}
                      >
                        · {activeSubject.name}
                      </span>
                    )}
                  </div>

                  {/* Large 00:00:00 Digital Stopwatch Display */}
                  <div
                    className={`text-5xl sm:text-6xl lg:text-7xl font-bold font-mono tracking-tight tabular-nums transition-all ${
                      isNormalRunning
                        ? 'text-teal-700 dark:text-teal-400 scale-[1.02]'
                        : normalElapsedSeconds > 0
                        ? 'text-neutral-800 dark:text-neutral-200'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {normalFormatted}
                  </div>

                  {/* Elapsed hint */}
                  <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 mt-1">
                    {isNormalRunning ? (
                      <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                        Focus session actively counting
                      </span>
                    ) : normalElapsedSeconds > 0 ? (
                      'Session paused — click Resume or Save'
                    ) : (
                      'Press Start to begin tracking study time'
                    )}
                  </span>

                  {/* Primary Stopwatch Controls: Start / Pause / Resume, Reset, Finish & Save */}
                  <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={handleResetClick}
                      disabled={normalElapsedSeconds === 0 && !isNormalRunning}
                      className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-40 disabled:hover:scale-100 transition-all hover:scale-105 cursor-pointer"
                      title="Reset Session"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Main Start / Pause / Resume Button */}
                    <button
                      type="button"
                      onClick={toggleNormalTimer}
                      className={`px-8 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center gap-2 shadow-sm transition-all hover:scale-105 cursor-pointer ${
                        isNormalRunning
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                    >
                      {isNormalRunning ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : normalElapsedSeconds > 0 ? (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Resume Studying</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Start Studying</span>
                        </>
                      )}
                    </button>

                    {/* Finish & Save Session Button */}
                    <button
                      type="button"
                      onClick={() => setShowSaveNoteInput(true)}
                      disabled={normalElapsedSeconds < 30}
                      className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer"
                      title={normalElapsedSeconds >= 30 ? 'Save completed session to your study history' : 'Study for at least 1 minute to save'}
                    >
                      <Check className="w-4 h-4" />
                      <span>Finish & Save</span>
                    </button>
                  </div>

                  {/* Break Buttons Immediately Below the Main Timer (As Requested) */}
                  <div className="w-full mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col items-center">
                    <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Coffee className="w-3.5 h-3.5 text-amber-500" />
                      <span>Take a Break (Timer Pauses Automatically)</span>
                    </span>

                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
                      <button
                        type="button"
                        onClick={() => startBreak(5)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                      >
                        <Coffee className="w-3 h-3 text-amber-600" />
                        <span>5-Min Break</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startBreak(10)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                      >
                        <Coffee className="w-3 h-3 text-amber-600" />
                        <span>10-Min Break</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startBreak(15)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                      >
                        <Coffee className="w-3 h-3 text-amber-600" />
                        <span>15-Min Break</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* --- POMODORO TIMER MODE (Preserved) --- */
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-44 h-44 sm:w-52 sm:h-52 lg:w-56 lg:h-56 flex items-center justify-center my-auto shrink-0">
                  <svg viewBox="0 0 240 240" className="w-full h-full transform -rotate-90">
                    <circle
                      cx="120"
                      cy="120"
                      r="105"
                      className="stroke-neutral-100 dark:stroke-neutral-800"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="120"
                      cy="120"
                      r="105"
                      className="stroke-teal-600 dark:stroke-teal-400 transition-all duration-1000 ease-linear"
                      strokeWidth="8"
                      strokeDasharray={CIRCLE_CIRCUMFERENCE}
                      strokeDashoffset={pomodoroStrokeOffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>

                  <div className="absolute flex flex-col items-center justify-center text-center px-4">
                    <span className="text-4xl sm:text-5xl font-bold font-mono tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
                      {timerFormatted}
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 mt-1 uppercase tracking-wider">
                      {timerMode === 'work' ? `Interval #${timerSessionCount}` : 'Rest & Rehydrate'}
                    </span>
                    {activeSubject && (
                      <span
                        className="text-xs font-medium mt-0.5 truncate max-w-[170px]"
                        style={{ color: activeSubject.color }}
                      >
                        {activeSubject.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pomodoro Action Buttons */}
                <div className="flex items-center gap-4 mt-3">
                  <button
                    type="button"
                    onClick={resetTimer}
                    className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all hover:scale-105 cursor-pointer"
                    title="Reset Pomodoro"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
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
                    type="button"
                    onClick={skipTimer}
                    className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all hover:scale-105 cursor-pointer"
                    title="Skip to next session"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* SMALL DAILY STUDY STATISTICS BELOW THE TIMER (Required)  */}
          {/* ======================================================== */}
          <div className="w-full max-w-xl mx-auto py-2 px-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60 shrink-0 mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center divide-y sm:divide-y-0 sm:divide-x divide-neutral-200/50 dark:divide-neutral-700/50">
              {/* Metric 1: Today Studied */}
              <div className="px-2 pt-1 sm:pt-0">
                <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                  Today's Total
                </span>
                <p className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {(todayStudyMinutes / 60).toFixed(1)}h{' '}
                  <span className="text-[10px] text-neutral-400 font-normal">/ {state.settings.dailyTargetHours}h</span>
                </p>
              </div>

              {/* Metric 2: Current Session Study Time */}
              <div className="px-2 pt-1 sm:pt-0">
                <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                  This Session
                </span>
                <p className="text-xs font-bold font-mono text-teal-600 dark:text-teal-400 tabular-nums">
                  {timerSystemMode === 'normal'
                    ? `${Math.floor(normalElapsedSeconds / 60)}m ${normalElapsedSeconds % 60}s`
                    : `${timerFormatted}`}
                </p>
              </div>

              {/* Metric 3: Session Break Time */}
              <div className="px-2 pt-1 sm:pt-0">
                <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                  Breaks Taken
                </span>
                <p className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                  {Math.floor(totalSessionBreakSeconds / 60)}m logged
                </p>
              </div>

              {/* Metric 4: Streak */}
              <div className="px-2 pt-1 sm:pt-0">
                <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                  Study Streak
                </span>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{studyStreak} {studyStreak === 1 ? 'day' : 'days'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* BOTTOM AMBIENT NOISE BAR                                 */}
          {/* ======================================================== */}
          <div className="flex flex-col items-center gap-1.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 w-full shrink-0 mt-1">
            <div className="flex items-center justify-between w-full max-w-sm px-1">
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
                {ambientSound !== 'off' ? (
                  <Volume2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                )}
                <span>Calm Background Noise</span>
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

      {/* ======================================================== */}
      {/* RESET CONFIRMATION MODAL (Safeguards accumulated work)    */}
      {/* ======================================================== */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl max-w-sm w-full p-5 border border-neutral-200 dark:border-neutral-800 shadow-xl animate-scaleIn">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Reset Current Study Session?
              </h3>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
              You have tracked <span className="font-bold font-mono text-neutral-900 dark:text-neutral-100">{normalFormatted}</span> of study time. Would you like to save this session to your study history or discard it?
            </p>

            <div className="flex flex-col gap-2 mt-4">
              <button
                type="button"
                onClick={handleConfirmSaveAndReset}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to History & Reset</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="w-full py-2 px-4 rounded-xl bg-neutral-100 hover:bg-rose-50 dark:bg-neutral-800 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                Discard Study Time
              </button>

              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-1.5 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SAVE SESSION MODAL (Optional Note Prompt)                */}
      {/* ======================================================== */}
      {showSaveNoteInput && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl max-w-sm w-full p-5 border border-neutral-200 dark:border-neutral-800 shadow-xl animate-scaleIn">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Log Completed Study Session
              </h3>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2">
              Great work! You studied <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">{normalFormatted}</span> for <span className="font-semibold text-neutral-900 dark:text-neutral-100">{activeSubject?.name || 'your subject'}</span>.
            </p>

            <div className="mt-3">
              <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1">
                Optional session note:
              </label>
              <input
                type="text"
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder="e.g. Completed Chapter 4 exercises..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowSaveNoteInput(false)}
                className="flex-1 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDirectSave}
                className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
