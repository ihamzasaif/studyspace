import React, { useState, useMemo } from 'react';
import { useStudy } from '../../context/StudyContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from 'recharts';
import { getPastNDays, formatDateShort, calculateHabitStreak, formatMinutesHuman } from '../../utils/date';
import { Clock, CheckCircle2, Flame, Award, TrendingUp, Calendar } from 'lucide-react';
import { playSoftClick } from '../../utils/audio';

type RangeFilter = '7d' | '30d' | 'all';

export const StatsView: React.FC = () => {
  const { state, subjectStats, studyStreak, getSubject } = useStudy();
  const [range, setRange] = useState<RangeFilter>('7d');

  const daysCount = range === '7d' ? 7 : range === '30d' ? 30 : 60;
  const pastDays = useMemo(() => getPastNDays(daysCount), [daysCount]);

  // Daily study hours timeline data
  const studyHoursTimeline = useMemo(() => {
    return pastDays.map((dateStr) => {
      const minutes = state.studySessions
        .filter((s) => s.date === dateStr)
        .reduce((sum, s) => sum + s.minutes, 0);
      return {
        date: dateStr,
        label: formatDateShort(dateStr),
        hours: Number((minutes / 60).toFixed(1)),
      };
    });
  }, [pastDays, state.studySessions]);

  // Goal completion rate timeline
  const goalCompletionTimeline = useMemo(() => {
    return pastDays.map((dateStr) => {
      const dayGoals = state.goals.filter((g) => g.date === dateStr);
      const total = dayGoals.length;
      const done = dayGoals.filter((g) => g.completed).length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      return {
        date: dateStr,
        label: formatDateShort(dateStr),
        total,
        done,
        rate,
      };
    });
  }, [pastDays, state.goals]);

  // Subject distribution for Donut Chart
  const subjectDistribution = useMemo(() => {
    return state.subjects
      .map((sub) => {
        const sessions = state.studySessions.filter((s) => {
          if (range === 'all') return s.subjectId === sub.id;
          return s.subjectId === sub.id && pastDays.includes(s.date);
        });
        const minutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
        return {
          name: sub.name,
          color: sub.color,
          value: Number((minutes / 60).toFixed(1)),
        };
      })
      .filter((item) => item.value > 0);
  }, [state.subjects, state.studySessions, pastDays, range]);

  // Overall KPI totals
  const totalAllTimeMinutes = state.studySessions.reduce((acc, cur) => acc + cur.minutes, 0);
  const totalCompletedGoals = state.goals.filter((g) => g.completed).length;

  const totalRangeMinutes = state.studySessions
    .filter((s) => (range === 'all' ? true : pastDays.includes(s.date)))
    .reduce((acc, cur) => acc + cur.minutes, 0);
  const rangeDailyAverageMinutes = Math.round(totalRangeMinutes / daysCount);

  // Best habit streak across all habits
  const bestHabitStreak = useMemo(() => {
    let best = 0;
    state.habits.forEach((h) => {
      const { best: hBest } = calculateHabitStreak(h.id, state.habitLogs);
      if (hBest > best) best = hBest;
    });
    return best;
  }, [state.habits, state.habitLogs]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Study Analytics & Progress
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Visualize your study trends, subject balance, and consistency metrics.
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex items-center p-0.5 bg-neutral-200/60 dark:bg-neutral-800 rounded-xl text-xs font-semibold">
          {(['7d', '30d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                playSoftClick();
                setRange(r);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                range === r
                  ? 'bg-white dark:bg-neutral-900 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1D23] border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Total Study Time</span>
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100 mt-2">
            {formatMinutesHuman(totalAllTimeMinutes)}
          </p>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Across {state.studySessions.length} logged sessions
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1D23] border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Daily Average</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100 mt-2">
            {formatMinutesHuman(rangeDailyAverageMinutes)}/day
          </p>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Target: {state.settings.dailyTargetHours}h per day
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1D23] border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Completed Goals</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100 mt-2">
            {totalCompletedGoals}
          </p>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Out of {state.goals.length} total planned
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1A1D23] border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Streak Peak</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100 mt-2">
            {Math.max(studyStreak, bestHabitStreak)} days
          </p>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Current study streak: {studyStreak} days
          </span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Study Hours Over Time (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1A1D23] rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Daily Study Hours Trend
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Logged study duration per day
              </p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyHoursTimeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis
                  dataKey="label"
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
                <Tooltip
                  formatter={(val?: unknown) => [`${val ?? 0} hours`, 'Study Duration']}
                  labelFormatter={(lbl) => `Date: ${lbl}`}
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="hours" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Subject Hours Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1A1D23] rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Subject Distribution
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Proportion of focus time by course
            </p>
          </div>

          {subjectDistribution.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-neutral-400">
              No sessions recorded for this range.
            </div>
          ) : (
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {subjectDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val?: unknown) => [`${val ?? 0} hours`, 'Hours']}
                    contentStyle={{
                      backgroundColor: '#171717',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Subject Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            {subjectDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="break-words text-neutral-700 dark:text-neutral-300 font-medium leading-tight">{item.name}</span>
                </div>
                <span className="font-mono text-neutral-400 tabular-nums shrink-0">{item.value}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal Completion Rate Area Chart */}
      <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Goal Completion Consistency
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Percentage of scheduled goals ticked off per day
          </p>
        </div>

        <div className="h-52 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={goalCompletionTimeline} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
              <Tooltip
                formatter={(val?: unknown) => [`${val ?? 0}%`, 'Completion Rate']}
                contentStyle={{
                  backgroundColor: '#171717',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Area type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#goalGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
