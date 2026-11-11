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
  AlertCircle,
  ChevronRight,
  Target,
  ArrowRight,
  X,
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
    activeGoalElapsedSeconds,
    setActiveGoalId,
    selectNextGoalAndResume,
    justCompletedGoalInfo,
    dismissJustCompletedGoal,
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
    finishPomodoroEarly,
  } = useStudy();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSaveNoteInput, setShowSaveNoteInput] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [showPomodoroFinishModal, setShowPomodoroFinishModal] = useState(false);
  const [pomodoroNote, setPomodoroNote] = useState('');

  // Mobile drawer / accordion state for Today's Goals
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

  // Currently active goal
  const activeGoal = state.goals.find((g) => g.id === activeGoalId);

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

  const formatGoalTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    }
    return `${String(mins).padStart(2, '0')}:${String(remainderSecs).padStart(2, '0')}`;
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
      {/* TOP HEADER BAR (Always visible, handles Fullscreen exit) */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 shrink-0 px-0.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Timer className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Focus Room</span>
            {isFullscreen && (
              <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300">
                Fullscreen Mode
              </span>
            )}
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

        {/* Fullscreen Toggle Buttons (Visible arrows & label to exit or enter) */}
        {isFullscreen ? (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl shadow-md transition-all hover:scale-105 shrink-0 cursor-pointer"
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
      {/* MAIN CONTENT AREA: Side-by-side on Desktop (both normal  */}
      {/* & fullscreen), clean responsive vertical stack on mobile */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 items-stretch mt-1">
        {/* ======================================================== */}
        {/* LEFT SIDE PANEL: Target Exam Card & Today's Goals        */}
        {/* (Always visible on Desktop, including inside Fullscreen) */}
        {/* ======================================================== */}
        <div className="hidden lg:flex flex-col gap-3 w-72 xl:w-80 shrink-0 min-h-0 overflow-hidden">
          {/* 1. Target Exam Card */}
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

          {/* 2. Today's Goals Checklist Panel with Glowing Active Goal Light */}
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

            {/* Goal Just Completed Notification Banner (Timer Paused Notification) */}
            {justCompletedGoalInfo && (
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 animate-fadeIn mb-2 shrink-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Goal Completed!</span>
                  </div>
                  <button
                    type="button"
                    onClick={dismissJustCompletedGoal}
                    className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 p-0.5"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] mt-1 font-medium text-emerald-800/90 dark:text-emerald-200/90">
                  <span className="font-bold">{justCompletedGoalInfo.goalTitle}</span>
                  {justCompletedGoalInfo.secondsSpent > 0 && (
                    <span> ({formatGoalTime(justCompletedGoalInfo.secondsSpent)})</span>
                  )}
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span>Timer paused. Select your next goal to resume!</span>
                </div>
              </div>
            )}

            {/* Scrollable list inside panel */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
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
                      className={`relative flex flex-col p-2.5 rounded-xl border transition-all ${
                        isGoalActive
                          ? 'border-emerald-500 ring-2 ring-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.35)] dark:shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-50/80 dark:bg-emerald-950/40'
                          : goal.completed
                          ? 'bg-neutral-50/60 dark:bg-neutral-800/20 border-neutral-200/50 dark:border-neutral-800/40 opacity-75'
                          : 'bg-white dark:bg-neutral-800/40 border-neutral-200/80 dark:border-neutral-800/80 hover:border-teal-400'
                      }`}
                    >
                      {/* Active Goal Glowing Light & Badge */}
                      {isGoalActive && (
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-emerald-200/70 dark:border-emerald-800/60">
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2.5 w-2.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                              Currently On This Goal
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                            {formatGoalTime(activeGoalElapsedSeconds)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-2.5">
                        {/* Checkbox: Ticking active goal pauses timer, records time, and prompts next goal */}
                        <button
                          type="button"
                          onClick={() => toggleGoal(goal.id)}
                          className="mt-0.5 text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0 transition-transform hover:scale-110 cursor-pointer"
                          aria-label={goal.completed ? 'Mark incomplete' : 'Mark completed'}
                          title={isGoalActive ? 'Tick to complete & log time on this goal' : 'Toggle goal'}
                        >
                          {goal.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/40" />
                          ) : isGoalActive ? (
                            <Circle className="w-4 h-4 text-emerald-500 hover:fill-emerald-100" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold leading-snug ${
                              goal.completed
                                ? 'line-through text-neutral-400 dark:text-neutral-500'
                                : isGoalActive
                                ? 'text-emerald-950 dark:text-emerald-100 font-bold'
                                : 'text-neutral-800 dark:text-neutral-200'
                            }`}
                          >
                            {goal.title}
                          </p>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {sub && (
                              <span
                                className="text-[10px] font-medium flex items-center gap-1 truncate"
                                style={{ color: sub.color }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: sub.color }}
                                />
                                {sub.name}
                              </span>
                            )}

                            {/* Recorded Time Spent on completed or logged goal */}
                            {goal.timeSpentSeconds && goal.timeSpentSeconds > 0 ? (
                              <span className="text-[10px] font-mono font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded-md tabular-nums">
                                ⏱️ {formatGoalTime(goal.timeSpentSeconds)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Select / Switch Goal Action */}
                      {!goal.completed && !isGoalActive && (
                        <div className="mt-2 pt-1.5 border-t border-neutral-100 dark:border-neutral-800/60 flex justify-end">
                          <button
                            type="button"
                            onClick={() => selectNextGoalAndResume(goal.id)}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Target className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                            <span>
                              {justCompletedGoalInfo ? 'Start Next Goal & Resume' : 'Switch to this goal'}
                            </span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT / CENTER PANEL: The Main Timer (Dominant Focus)    */}
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
                      <span>Break Active</span>
                    </>
                  ) : isNormalRunning ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                      <span>Study Active</span>
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
          {/* CENTRAL TIMER DISPLAY (Clean, Minimalist, Distraction-Free) */}
          {/* ======================================================== */}
          <div className="my-auto flex flex-col items-center justify-center w-full px-2 py-4 shrink-0">
            {/* Active Subject Pill with FULL Subject Name */}
            {activeSubject && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100/80 dark:bg-neutral-800/70 border border-neutral-200/60 dark:border-neutral-700/60 mb-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeSubject.color }} />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {activeSubject.code ? `${activeSubject.code} · ` : ''}{activeSubject.name}
                </span>
              </div>
            )}

            {/* Glowing Active Goal Pill in Center (Shows currently tracked goal) */}
            {activeGoal ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 mb-2 shadow-xs animate-fadeIn max-w-full">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] font-bold truncate max-w-[200px] sm:max-w-xs">
                  {activeGoal.title}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-800/60 tabular-nums">
                  {formatGoalTime(activeGoalElapsedSeconds)}
                </span>
              </div>
            ) : justCompletedGoalInfo ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 mb-2 text-xs font-semibold animate-pulse">
                <span>⏸️ Goal completed. Select your next goal to resume!</span>
              </div>
            ) : null}

            {timerSystemMode === 'normal' ? (
              /* --- NORMAL TIMER MODE --- */
              isNormalOnBreak ? (
                /* 1. Normal Break Active View */
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

                  {/* Break Controls */}
                  <div className="flex items-center gap-3 mt-5">
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
                    >
                      <span>End Break</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                /* 2. Normal Study Stopwatch Active View */
                <div className="flex flex-col items-center text-center w-full max-w-lg">
                  {/* Large 00:00:00 Digital Stopwatch Display */}
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

                  {/* Primary Stopwatch Controls: Reset, Start/Pause/Resume, Finish & Save */}
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

                    {/* Finish & Save Session Button */}
                    <button
                      type="button"
                      onClick={() => setShowSaveNoteInput(true)}
                      disabled={normalElapsedSeconds < 30}
                      className="px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer"
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
                      onClick={() => setShowPomodoroFinishModal(true)}
                      className="px-4 py-3 rounded-2xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer"
                      title="Finished early? Log your completed study time and start break"
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
          {/* MOBILE TODAY'S GOALS ACCORDION (Visible on screens < lg) */}
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
                {activeGoal && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
              <div className="flex items-center gap-1 text-neutral-500 text-[11px]">
                <span>
                  {todayCompletedGoalsCount}/{todayGoals.length} done
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMobileGoalsExpanded ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {isMobileGoalsExpanded && (
              <div className="mt-2 p-3 rounded-2xl bg-white dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 space-y-2 max-h-60 overflow-y-auto">
                {todayGoals.length === 0 ? (
                  <p className="text-center py-4 text-xs text-neutral-400">No goals scheduled for today.</p>
                ) : (
                  todayGoals.map((goal) => {
                    const isGoalActive = activeGoalId === goal.id;
                    const sub = getSubject(goal.subjectId);

                    return (
                      <div
                        key={goal.id}
                        className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1.5 transition-all ${
                          isGoalActive
                            ? 'border-emerald-500 ring-2 ring-emerald-500/80 bg-emerald-50/80 dark:bg-emerald-950/40'
                            : goal.completed
                            ? 'bg-neutral-50 dark:bg-neutral-800/20 opacity-75 border-neutral-200/60 dark:border-neutral-800/60'
                            : 'bg-white dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleGoal(goal.id)}
                              className="text-neutral-400 shrink-0"
                            >
                              {goal.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 dark:fill-emerald-950/40" />
                              ) : isGoalActive ? (
                                <Circle className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                            <span
                              className={`truncate font-semibold ${
                                goal.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'
                              }`}
                            >
                              {goal.title}
                            </span>
                          </div>

                          {isGoalActive && (
                            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                              {formatGoalTime(activeGoalElapsedSeconds)}
                            </span>
                          )}
                        </div>

                        {!goal.completed && !isGoalActive && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => selectNextGoalAndResume(goal.id)}
                              className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold text-[10px] flex items-center gap-1"
                            >
                              <span>Start this goal</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
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

      {/* ======================================================== */}
      {/* RESET CONFIRMATION MODAL                                 */}
      {/* ======================================================== */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl max-w-sm w-full p-5 border border-neutral-200 dark:border-neutral-800 shadow-xl animate-scaleIn">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Reset Study Session?
              </h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2">
              You have studied for{' '}
              <strong className="font-mono text-teal-600 dark:text-teal-400">
                {Math.floor(normalElapsedSeconds / 60)} minutes
              </strong>
              . Would you like to log this time before resetting?
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirmSaveAndReset}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Save to Study History & Reset
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="w-full py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-700 dark:text-neutral-300 hover:text-red-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                Discard Session & Reset
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-2 rounded-xl text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-xs font-medium cursor-pointer"
              >
                Keep Studying (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DIRECT FINISH / LOG SESSION MODAL                        */}
      {/* ======================================================== */}
      {showSaveNoteInput && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl max-w-sm w-full p-5 border border-neutral-200 dark:border-neutral-800 shadow-xl animate-scaleIn">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Check className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Finish Study Session
              </h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5">
              Logging{' '}
              <strong className="font-mono text-teal-600 dark:text-teal-400">
                {Math.max(1, Math.round(normalElapsedSeconds / 60))} minutes
              </strong>{' '}
              for <strong className="text-neutral-800 dark:text-neutral-200">{activeSubject?.name}</strong>.
            </p>

            <div className="mt-3">
              <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1">
                Session Note (Optional)
              </label>
              <input
                type="text"
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder="What did you accomplish?"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-hidden focus:border-teal-500"
              />
            </div>

            <div className="mt-4 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowSaveNoteInput(false)}
                className="px-3.5 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDirectSave}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save & Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* POMODORO FINISH EARLY MODAL                              */}
      {/* ======================================================== */}
      {showPomodoroFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl max-w-sm w-full p-5 border border-neutral-200 dark:border-neutral-800 shadow-xl animate-scaleIn">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Finish Pomodoro Early?
              </h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-2">
              Finished before the timer ended? We will log your completed study time and start your well-earned break!
            </p>

            <div className="mt-3">
              <label className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block mb-1">
                Session Note (Optional)
              </label>
              <input
                type="text"
                value={pomodoroNote}
                onChange={(e) => setPomodoroNote(e.target.value)}
                placeholder="E.g. Completed Chapter 4 review early"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="mt-4 flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowPomodoroFinishModal(false)}
                className="px-3.5 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold cursor-pointer"
              >
                Keep Studying
              </button>
              <button
                type="button"
                onClick={() => {
                  finishPomodoroEarly(pomodoroNote.trim() || undefined);
                  setShowPomodoroFinishModal(false);
                  setPomodoroNote('');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Finish & Log Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
