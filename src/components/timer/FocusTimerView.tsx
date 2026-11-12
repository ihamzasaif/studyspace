import React, { useState, useEffect } from 'react';
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
  ChevronRight,
} from 'lucide-react';

export const FocusTimerView: React.FC = () => {
  const {
    state,
    getSubject,
    todayGoals,
    todayCompletedGoalsCount,
    toggleGoal,
    todayStudyMinutes,
    studyStreak,
    // Active Goal tracking
    activeGoalId,
    selectNextGoalAndResume,
    // Timer System Mode
    timerSystemMode,
    setTimerSystemMode,
    // Normal Study Timer
    normalElapsedSeconds,
    isNormalRunning,
    normalSubjectId,
    setNormalSubjectId,
    toggleNormalTimer,
    resetNormalTimer,
    saveNormalSession,
    normalFormatted,
    // Break System
    isNormalOnBreak,
    normalBreakCountdown,
    normalBreakTotalSeconds,
    totalSessionBreakSeconds,
    startBreak,
    extendBreak,
    skipBreak,
    breakFormatted,
    // Pomodoro Timer
    timerMode,
    timerTimeLeft,
    isTimerRunning,
    timerSubjectId,
    timerFormatted,
    timerProgressRatio,
    toggleTimerRunning,
    resetTimer,
    skipTimer,
    switchTimerMode,
    setTimerSubjectId,
    finishPomodoroEarly,
  } = useStudy();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileGoalsExpanded, setIsMobileGoalsExpanded] = useState(false);

  useBackHandler(isFullscreen, () => setIsFullscreen(false), 'timer-fullscreen');

  // Keyboard shortcut: Press Escape to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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
  const breakProgressRatio =
    normalBreakTotalSeconds > 0
      ? (normalBreakTotalSeconds - normalBreakCountdown) / normalBreakTotalSeconds
      : 0;

  const handleResetClick = () => {
    if (timerSystemMode === 'normal') {
      resetNormalTimer();
    } else {
      resetTimer();
    }
  };

  const handleFinishClick = () => {
    if (timerSystemMode === 'normal') {
      if (normalElapsedSeconds > 0 || isNormalRunning) {
        saveNormalSession();
      }
    } else {
      finishPomodoroEarly();
    }
  };

  return (
    <div
      className={`w-full transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#F8F9FA] dark:bg-[#121417] p-3 sm:p-5 flex flex-col justify-between overflow-y-auto lg:overflow-hidden'
          : 'max-w-6xl mx-auto flex flex-col gap-3 pb-8 lg:pb-1 lg:h-[calc(100vh-6.5rem)] lg:max-h-[calc(100vh-6.5rem)] lg:justify-between lg:overflow-hidden'
      }`}
    >
      {/* ======================================================== */}
      {/* TOP HEADER BAR                                           */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0 px-0.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Timer className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Focus Room</span>
          </h1>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-0.5 bg-neutral-200/80 dark:bg-neutral-800/80 rounded-xl text-xs font-semibold">
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

        {/* Fullscreen Toggle Button */}
        {isFullscreen ? (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-md transition-all hover:scale-105 shrink-0 cursor-pointer"
            title="Exit Fullscreen (Esc)"
          >
            <Minimize2 className="w-4 h-4" />
            <span>Exit Fullscreen</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/60 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Expand to Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* MAIN CONTENT AREA: Left Panel (Goals/Exam) + Center Timer */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 items-stretch mt-1">
        {/* ======================================================== */}
        {/* LEFT SIDE PANEL: Target Exam & Today's Goals (Desktop)   */}
        {/* ======================================================== */}
        <div className="hidden lg:flex flex-col gap-3 w-72 xl:w-80 shrink-0 min-h-0 overflow-hidden">
          {/* Target Exam Card */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-3.5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs shrink-0">
            {state.examCountdown ? (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 mt-0.5">
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
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                  Stay Consistent
                </span>
              </div>
            )}
          </div>

          {/* Today's Goals (Simple, Clean, Distraction-Free) */}
          <div className="flex-1 flex flex-col bg-white dark:bg-[#1A1D23] rounded-2xl p-3.5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100 dark:border-neutral-800/80 shrink-0">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  Today's Goals
                </span>
              </div>
              <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
                {todayCompletedGoalsCount}/{todayGoals.length}
              </span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {todayGoals.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-6 text-neutral-400 text-xs">
                  <Sparkles className="w-5 h-5 text-neutral-300 dark:text-neutral-600 mb-1" />
                  <span>No goals scheduled for today.</span>
                </div>
              ) : (
                todayGoals.map((goal) => {
                  const sub = getSubject(goal.subjectId);
                  const isGoalActive = activeGoalId === goal.id;

                  return (
                    <div
                      key={goal.id}
                      onClick={() => {
                        if (!goal.completed && !isGoalActive) {
                          selectNextGoalAndResume(goal.id);
                        }
                      }}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                        isGoalActive
                          ? 'border-teal-500 dark:border-teal-400 bg-teal-50/70 dark:bg-teal-950/30 ring-1 ring-teal-500/60 shadow-xs'
                          : goal.completed
                          ? 'bg-neutral-50/50 dark:bg-neutral-800/20 border-neutral-200/50 dark:border-neutral-800/40 opacity-60'
                          : 'bg-white dark:bg-neutral-800/40 border-neutral-200/80 dark:border-neutral-800/80 hover:border-teal-400'
                      }`}
                      title={!goal.completed ? 'Click to select this goal' : undefined}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGoal(goal.id);
                          }}
                          className="text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 shrink-0 transition-transform hover:scale-110 cursor-pointer"
                          aria-label={goal.completed ? 'Mark incomplete' : 'Mark completed'}
                        >
                          {goal.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 fill-teal-100 dark:fill-teal-950/40" />
                          ) : isGoalActive ? (
                            <Circle className="w-4 h-4 text-teal-500 fill-teal-100 dark:fill-teal-950/40" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs truncate ${
                              goal.completed
                                ? 'line-through text-neutral-400 dark:text-neutral-500'
                                : isGoalActive
                                ? 'text-teal-950 dark:text-teal-100 font-bold'
                                : 'text-neutral-800 dark:text-neutral-200 font-medium'
                            }`}
                          >
                            {goal.title}
                          </p>

                          {sub && (
                            <span
                              className="text-[10px] font-medium flex items-center gap-1 mt-0.5 truncate"
                              style={{ color: sub.color }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: sub.color }}
                              />
                              {sub.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Simple status dot or time spent */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isGoalActive && (
                          <span
                            className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"
                            title="Active goal"
                          />
                        )}
                        {goal.timeSpentMinutes && goal.timeSpentMinutes > 0 ? (
                          <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 tabular-nums">
                            {goal.timeSpentMinutes}m
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER / RIGHT PANEL: Focus Timer Display                */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col justify-between items-center bg-white dark:bg-[#1A1D23] rounded-3xl p-4 sm:p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs min-h-0 relative">
          {/* Top Bar inside Timer Card: Status Indicator & Subject Selector */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 pb-2 border-b border-neutral-100 dark:border-neutral-800/60">
            {/* Status Pill */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                  timerSystemMode === 'normal'
                    ? isNormalOnBreak
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : isNormalRunning
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                      : normalElapsedSeconds > 0
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                    : timerMode === 'work'
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                {timerSystemMode === 'normal' ? (
                  isNormalOnBreak ? (
                    <>
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>Break</span>
                    </>
                  ) : isNormalRunning ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      <span>Studying</span>
                    </>
                  ) : normalElapsedSeconds > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Paused</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>Ready</span>
                    </>
                  )
                ) : (
                  <>
                    <Timer className="w-3.5 h-3.5" />
                    <span>{timerMode === 'work' ? 'Focus Session' : 'Rest Break'}</span>
                  </>
                )}
              </span>

              {/* Pomodoro Sub-Mode Selectors */}
              {timerSystemMode === 'pomodoro' && (
                <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => switchTimerMode('work')}
                    className={`px-2.5 py-0.5 rounded-md transition-colors ${
                      timerMode === 'work'
                        ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    Focus ({state.settings.pomodoroWorkMinutes}m)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTimerMode('shortBreak')}
                    className={`px-2.5 py-0.5 rounded-md transition-colors ${
                      timerMode === 'shortBreak'
                        ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    Short ({state.settings.pomodoroShortBreakMinutes}m)
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTimerMode('longBreak')}
                    className={`px-2.5 py-0.5 rounded-md transition-colors ${
                      timerMode === 'longBreak'
                        ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    Long ({state.settings.pomodoroLongBreakMinutes}m)
                  </button>
                </div>
              )}
            </div>

            {/* Subject Selector (Full Subject Name visible without truncation) */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-neutral-400 text-xs font-medium shrink-0">Subject:</span>
              <div className="relative flex items-center flex-1 sm:flex-initial min-w-[200px] max-w-full">
                {activeSubject && (
                  <span
                    className="w-2.5 h-2.5 rounded-full absolute left-2.5 pointer-events-none shrink-0"
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
                  className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-semibold focus:outline-hidden cursor-pointer"
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
          {/* CENTRAL DIGITAL CLOCK                                    */}
          {/* ======================================================== */}
          <div className="my-auto flex flex-col items-center justify-center w-full px-2 py-4 shrink-0">
            {/* Subject Badge */}
            {activeSubject && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100/80 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/60 mb-2.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeSubject.color }} />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {activeSubject.code ? `${activeSubject.code} · ` : ''}{activeSubject.name}
                </span>
              </div>
            )}

            {timerSystemMode === 'normal' ? (
              /* --- NORMAL TIMER MODE --- */
              isNormalOnBreak ? (
                /* 1. Break Active View (Clean with Extend Break option) */
                <div className="flex flex-col items-center text-center animate-fadeIn w-full max-w-md">
                  <div className="text-5xl sm:text-6xl md:text-7xl font-bold font-mono tracking-tight tabular-nums text-amber-600 dark:text-amber-400 my-1">
                    {breakFormatted}
                  </div>

                  {/* Break Progress Line */}
                  <div className="w-48 sm:w-60 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-linear"
                      style={{ width: `${Math.min(100, Math.max(0, breakProgressRatio * 100))}%` }}
                    />
                  </div>

                  {/* Break Controls: Extend Break (+5m) & End Break */}
                  <div className="flex items-center gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => extendBreak(5)}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform hover:scale-105 cursor-pointer"
                      title="Extend break time by 5 minutes"
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>+5m Extend Break</span>
                    </button>

                    <button
                      type="button"
                      onClick={skipBreak}
                      className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>End Break</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* 2. Normal Study Stopwatch Active View */
                <div className="flex flex-col items-center text-center w-full max-w-lg">
                  {/* Large Digital Stopwatch Display */}
                  <div
                    className={`text-5xl sm:text-6xl md:text-7xl font-bold font-mono tracking-tight tabular-nums transition-all ${
                      isNormalRunning
                        ? 'text-teal-700 dark:text-teal-400'
                        : normalElapsedSeconds > 0
                        ? 'text-neutral-800 dark:text-neutral-200'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {normalFormatted}
                  </div>

                  {/* Primary Stopwatch Controls: Reset, Start/Pause/Resume, Finish */}
                  <div className="flex items-center gap-2.5 sm:gap-4 mt-5 flex-wrap justify-center">
                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={handleResetClick}
                      disabled={normalElapsedSeconds === 0 && !isNormalRunning}
                      className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:hover:scale-100 transition-all hover:scale-105 cursor-pointer"
                      title="Reset Session"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Main Start / Pause / Resume Button */}
                    <button
                      type="button"
                      onClick={toggleNormalTimer}
                      className={`px-7 sm:px-8 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center gap-2 shadow-sm transition-all hover:scale-105 cursor-pointer ${
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
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Start</span>
                        </>
                      )}
                    </button>

                    {/* Finish & Save Session Button (100% Clickable, Direct Save & Log) */}
                    <button
                      type="button"
                      onClick={handleFinishClick}
                      disabled={normalElapsedSeconds === 0 && !isNormalRunning}
                      className="px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:hover:scale-100 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer"
                      title="Finish and log study session"
                    >
                      <Check className="w-4 h-4" />
                      <span>Finish</span>
                    </button>
                  </div>

                  {/* Clean Break Buttons Directly Below Timer */}
                  <div className="w-full mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => startBreak(5)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>5m Break</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startBreak(10)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>10m Break</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startBreak(15)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
                    >
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>15m Break</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* --- POMODORO TIMER MODE --- */
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
                    <span className="text-xs font-medium text-neutral-400 mt-1">
                      {timerMode === 'work' ? 'Focus Session' : 'Rest Break'}
                    </span>
                  </div>
                </div>

                {/* Pomodoro Controls */}
                <div className="flex items-center gap-2.5 sm:gap-3 mt-4 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={handleResetClick}
                    className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all hover:scale-105 cursor-pointer"
                    title="Reset Session"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={toggleTimerRunning}
                    className={`px-7 py-3 rounded-2xl font-bold text-sm text-white flex items-center gap-2 shadow-sm transition-all hover:scale-105 cursor-pointer ${
                      isTimerRunning
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-teal-600 hover:bg-teal-700'
                    }`}
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-4 h-4 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Start</span>
                      </>
                    )}
                  </button>

                  {timerMode === 'work' && (
                    <button
                      type="button"
                      onClick={handleFinishClick}
                      className="px-4 py-3 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer"
                      title="Finished early? Log study time and take a break"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finish</span>
                    </button>
                  )}

                  {timerMode !== 'work' && (
                    <button
                      type="button"
                      onClick={() => finishPomodoroEarly()}
                      className="px-4 py-3 rounded-2xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer"
                      title="End break and return to study focus"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>End Break</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={skipTimer}
                    className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all hover:scale-105 cursor-pointer"
                    title="Skip to next session"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* MOBILE TODAY'S GOALS ACCORDION                           */}
          {/* ======================================================== */}
          <div className="w-full lg:hidden my-2">
            <button
              type="button"
              onClick={() => setIsMobileGoalsExpanded(!isMobileGoalsExpanded)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-800/80 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Today's Goals</span>
              </div>
              <div className="flex items-center gap-1 text-neutral-500 text-[11px]">
                <span>
                  {todayCompletedGoalsCount}/{todayGoals.length}
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMobileGoalsExpanded ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {isMobileGoalsExpanded && (
              <div className="mt-2 p-2.5 rounded-2xl bg-white dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-1.5 max-h-60 overflow-y-auto">
                {todayGoals.length === 0 ? (
                  <p className="text-center py-4 text-xs text-neutral-400">No goals scheduled for today.</p>
                ) : (
                  todayGoals.map((goal) => {
                    const isGoalActive = activeGoalId === goal.id;
                    const sub = getSubject(goal.subjectId);

                    return (
                      <div
                        key={goal.id}
                        onClick={() => {
                          if (!goal.completed && !isGoalActive) {
                            selectNextGoalAndResume(goal.id);
                          }
                        }}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isGoalActive
                            ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/30 ring-1 ring-teal-500/50'
                            : goal.completed
                            ? 'bg-neutral-50 dark:bg-neutral-800/20 opacity-60 border-neutral-200/60 dark:border-neutral-800/60'
                            : 'bg-white dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGoal(goal.id);
                            }}
                            className="text-neutral-400 shrink-0"
                          >
                            {goal.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-teal-600 fill-teal-100 dark:fill-teal-950/40" />
                            ) : isGoalActive ? (
                              <Circle className="w-4 h-4 text-teal-500 fill-teal-100 dark:fill-teal-950/40" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <span
                            className={`truncate ${
                              goal.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200 font-medium'
                            }`}
                          >
                            {goal.title}
                          </span>
                        </div>

                        {sub && (
                          <span
                            className="text-[10px] font-medium shrink-0"
                            style={{ color: sub.color }}
                          >
                            {sub.code || sub.name}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* COMPACT DAILY STUDY STATISTICS STRIP                     */}
          {/* ======================================================== */}
          <div className="w-full max-w-xl mx-auto py-2 px-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60 shrink-0 mt-1">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center divide-y sm:divide-y-0 sm:divide-x divide-neutral-200/50 dark:divide-neutral-700/50">
              {/* Metric 1: Today Studied */}
              <div className="px-1 pt-1 sm:pt-0">
                <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                  Today
                </span>
                <p className="text-xs font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                  {(todayStudyMinutes / 60).toFixed(1)}h{' '}
                  <span className="text-[10px] text-neutral-400 font-normal">/ {state.settings.dailyTargetHours}h</span>
                </p>
              </div>

              {/* Metric 2: Current Session Study Time */}
              <div className="px-1 pt-1 sm:pt-0">
                <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                  Session
                </span>
                <p className="text-xs font-bold font-mono text-teal-600 dark:text-teal-400 tabular-nums">
                  {timerSystemMode === 'normal'
                    ? `${Math.floor(normalElapsedSeconds / 60)}m ${normalElapsedSeconds % 60}s`
                    : `${timerFormatted}`}
                </p>
              </div>

              {/* Metric 3: Session Break Time */}
              <div className="px-1 pt-1 sm:pt-0">
                <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                  Breaks
                </span>
                <p className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                  {Math.floor(totalSessionBreakSeconds / 60)}m
                </p>
              </div>

              {/* Metric 4: Streak */}
              <div className="px-1 pt-1 sm:pt-0">
                <span className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500 tracking-wider">
                  Streak
                </span>
                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{studyStreak}d</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
