import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Target,
  Edit2,
  Check,
  BookOpen,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { formatDateDisplay, getDaysRemaining, getDayOfWeek } from '../../utils/date';
import { MOTIVATIONAL_LINES } from '../../utils/storage';
import { playSoftClick } from '../../utils/audio';

interface DashboardProps {
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenSettings, onOpenProfile }) => {
  const {
    state,
    setActiveTab,
    todayStr,
    todayStudyMinutes,
    todayGoals,
    todayCompletedGoalsCount,
    todayHabitsCompletedCount,
    studyStreak,
    weeklyStudyHours,
    toggleGoal,
    addGoal,
    getSubject,
  } = useStudy();

  const [quoteIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_LINES.length));
  const [quickGoalTitle, setQuickGoalTitle] = useState('');
  const [quickGoalSubject, setQuickGoalSubject] = useState(state.subjects[0]?.id || '');
  const [showAddGoal, setShowAddGoal] = useState(false);

  const studyHours = Number((todayStudyMinutes / 60).toFixed(1));
  const targetHours = state.settings.dailyTargetHours;
  const targetProgressPercent = Math.min(100, Math.round((studyHours / targetHours) * 100));

  // Current day timetable blocks
  const currentDayOfWeek = getDayOfWeek(todayStr);
  const todayTimetable = state.timetable
    .filter((b) => b.day === currentDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Exam countdown calculation
  const examInfo = state.examCountdown ? getDaysRemaining(state.examCountdown.targetDate) : null;
  const examSubject = state.examCountdown?.subjectId ? getSubject(state.examCountdown.subjectId) : null;

  // Handle adding quick goal
  const handleQuickAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickGoalTitle.trim() || !quickGoalSubject) return;

    addGoal({
      title: quickGoalTitle.trim(),
      subjectId: quickGoalSubject,
      date: todayStr,
      completed: false,
      priority: 'medium',
    });

    setQuickGoalTitle('');
    setShowAddGoal(false);
  };

  // Recharts custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { day: string; date: string; hours: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-neutral-800">
          <p className="font-medium">{data.day}</p>
          <p className="text-teal-300 font-mono mt-0.5">{data.hours} hours logged</p>
        </div>
      );
    }
    return null;
  };

  const hasProfile = Boolean(state.profile.name.trim());

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Greeting & Motivation Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
              {formatDateDisplay(todayStr)}
            </span>
            {hasProfile && state.profile.profession && (
              <>
                <span className="text-neutral-300 dark:text-neutral-700" aria-hidden="true">·</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {state.profile.profession}
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
            {hasProfile ? `Welcome, ${state.profile.name}` : 'Welcome to your Study Room'}
          </h1>

          {state.profile.targetGoal ? (
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1 font-medium">
              Target: <span className="text-teal-700 dark:text-teal-300">{state.profile.targetGoal}</span>
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 italic">
              "{MOTIVATIONAL_LINES[quoteIndex]}"
            </p>
          )}
        </div>

        {/* Profile Setup Reminder or Exam Countdown Card */}
        <div className="flex items-center gap-2 flex-wrap">
          {!hasProfile && (
            <button
              onClick={onOpenProfile}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-semibold hover:bg-teal-100 transition-colors shrink-0"
            >
              <span>+ Setup Your Profile</span>
            </button>
          )}

          {state.examCountdown ? (
            <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-[#1A1D23] rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs shrink-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Target Exam
                </span>
                <button
                  onClick={onOpenSettings}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  title="Edit exam"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 break-words">
                {state.examCountdown.title}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex-wrap">
                <span className="font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                  {examInfo?.label}
                </span>
                {examSubject && (
                  <>
                    <span>·</span>
                    <span className="break-words">{examSubject.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenSettings}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1A1D23] rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-500 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>+ Set Exam Countdown</span>
          </button>
        )}
        </div>
      </div>

      {/* 2. Today's Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Goals completed */}
        <div className="bg-white dark:bg-[#1A1D23] p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
            <span>Daily Goals</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
              {todayCompletedGoalsCount}
              <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">
                /{todayGoals.length}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {todayGoals.length > 0
                ? `${Math.round((todayCompletedGoalsCount / todayGoals.length) * 100)}% completed today`
                : 'No goals scheduled'}
            </p>
          </div>
        </div>

        {/* Study Hours & Progress */}
        <div className="bg-white dark:bg-[#1A1D23] p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
            <span>Study Logged</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
              {studyHours}h
              <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">
                /{targetHours}h
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-teal-600 dark:bg-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${targetProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Habits completed */}
        <div className="bg-white dark:bg-[#1A1D23] p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
            <span>Habits Checked</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
              {todayHabitsCompletedCount}
              <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500">
                /{state.habits.length}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {state.habits.length > 0
                ? `${Math.round((todayHabitsCompletedCount / state.habits.length) * 100)}% habits marked`
                : 'No habits added'}
            </p>
          </div>
        </div>

        {/* Study Streak */}
        <div className="bg-white dark:bg-[#1A1D23] p-4 sm:p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
            <span>Study Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
              {studyStreak}
              <span className="text-sm font-normal text-neutral-400 dark:text-neutral-500 ml-1">
                {studyStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Active consecutive study
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Today's Goals & Schedule vs Weekly Progress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Goals List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Goals Card */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Today's Goals
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {todayGoals.length === 0
                    ? 'No goals for today yet'
                    : `${todayCompletedGoalsCount} of ${todayGoals.length} completed`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddGoal(!showAddGoal)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Goal</span>
                </button>
                <button
                  onClick={() => {
                    playSoftClick();
                    setActiveTab('goals');
                  }}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  title="View all goals & carry-over"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inline Quick Add Goal */}
            {showAddGoal && (
              <form onSubmit={handleQuickAddGoal} className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl space-y-2 border border-neutral-200/60 dark:border-neutral-700/50">
                <input
                  type="text"
                  placeholder="What do you plan to accomplish?"
                  value={quickGoalTitle}
                  onChange={(e) => setQuickGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  autoFocus
                />
                <div className="flex items-center justify-between gap-2">
                  <select
                    value={quickGoalSubject}
                    onChange={(e) => setQuickGoalSubject(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200"
                  >
                    {state.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddGoal(false)}
                      className="px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                    >
                      Save Goal
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Goals List */}
            <div className="space-y-2">
              {todayGoals.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-xs">
                  Plan your first goal for today to build momentum.
                </div>
              ) : (
                todayGoals.map((goal) => {
                  const subject = getSubject(goal.subjectId);
                  return (
                    <div
                      key={goal.id}
                      onClick={() => {
                        playSoftClick();
                        toggleGoal(goal.id);
                      }}
                      className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        goal.completed
                          ? 'bg-neutral-50/60 dark:bg-neutral-800/20 border-neutral-200/50 dark:border-neutral-800/40 opacity-75'
                          : 'bg-white dark:bg-[#1A1D23] border-neutral-200/80 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 text-neutral-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors"
                        aria-label={goal.completed ? 'Mark incomplete' : 'Mark completed'}
                      >
                        {goal.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 fill-teal-100 dark:fill-teal-950/40" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium break-words transition-colors ${
                            goal.completed
                              ? 'line-through text-neutral-400 dark:text-neutral-500'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          {goal.title}
                        </p>

                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                          {subject && (
                            <span className="flex items-center gap-1 font-medium" style={{ color: subject.color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                              {subject.name}
                            </span>
                          )}
                          {goal.estimatedMinutes && (
                            <>
                              <span>·</span>
                              <span className="tabular-nums">{goal.estimatedMinutes}m</span>
                            </>
                          )}
                          {goal.priority === 'high' && (
                            <>
                              <span>·</span>
                              <span className="text-red-500 font-medium">Priority</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Today's Schedule / Timetable Preview */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Today's Schedule
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {todayTimetable.length} scheduled {todayTimetable.length === 1 ? 'block' : 'blocks'} for {formatDateDisplay(todayStr).split(',')[0]}
                </p>
              </div>

              <button
                onClick={() => {
                  playSoftClick();
                  setActiveTab('timetable');
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
              >
                <span>Full Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {todayTimetable.length === 0 ? (
              <div className="text-center py-6 text-neutral-400 dark:text-neutral-500 text-xs">
                No classes or study blocks scheduled for today.
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayTimetable.map((block) => {
                  const subject = getSubject(block.subjectId);
                  return (
                    <div
                      key={block.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-2.5 h-9 rounded-full shrink-0 mt-0.5 sm:mt-0"
                          style={{ backgroundColor: subject?.color || '#0d9488' }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 break-words leading-snug">
                            {block.title || subject?.name || 'Study Block'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap mt-0.5">
                            {subject && <span className="break-words font-medium">{subject.name}</span>}
                            {block.location && (
                              <>
                                <span>·</span>
                                <span className="break-words">{block.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-mono tabular-nums text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-200/60 dark:border-neutral-800/60 shrink-0 self-start sm:self-auto">
                        {block.startTime} – {block.endTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Weekly Study Hours Chart & Subject Progress (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weekly Chart */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Weekly Study Hours
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Monday to Sunday distribution
                </p>
              </div>

              <span className="text-xs font-medium tabular-nums text-teal-600 dark:text-teal-400">
                {weeklyStudyHours.reduce((acc, cur) => acc + cur.hours, 0).toFixed(1)}h total
              </span>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyStudyHours} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    unit="h"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {weeklyStudyHours.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isToday ? '#0d9488' : '#cbd5e1'}
                        className="dark:fill-opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subjects Progress Glance */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Subjects Overview
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Hours and goal progress
                </p>
              </div>

              <button
                onClick={() => {
                  playSoftClick();
                  setActiveTab('subjects');
                }}
                className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center gap-1"
              >
                <span>All Subjects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {state.subjects.slice(0, 4).map((sub) => {
                const subGoals = state.goals.filter((g) => g.subjectId === sub.id);
                const completed = subGoals.filter((g) => g.completed).length;
                const percentage = subGoals.length > 0 ? Math.round((completed / subGoals.length) * 100) : 0;
                const hours = (
                  state.studySessions
                    .filter((s) => s.subjectId === sub.id)
                    .reduce((sum, s) => sum + s.minutes, 0) / 60
                ).toFixed(1);

                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      playSoftClick();
                      setActiveTab('subjects');
                    }}
                    className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-800/50 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 break-words leading-snug">
                          {sub.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                        {hours}h studied
                      </span>
                    </div>

                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%`, backgroundColor: sub.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
