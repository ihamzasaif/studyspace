import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { Habit } from '../../types';
import { calculateHabitStreak, getPastNDays, formatDateShort, addDays } from '../../utils/date';
import { Plus, Check, Flame, Trash2, Edit2, X, Sparkles } from 'lucide-react';
import { playSoftClick } from '../../utils/audio';

export const HabitsView: React.FC = () => {
  const { state, todayStr, addHabit, updateHabit, deleteHabit, toggleHabitDay } = useStudy();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // 30 days past array for heatmap
  const past30Days = getPastNDays(30);

  // Past 7 days for quick checkboxes table
  const past7Days = getPastNDays(7);

  const handleOpenAdd = () => {
    setEditingHabit(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: Habit) => {
    setEditingHabit(h);
    setName(h.name);
    setDescription(h.description || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingHabit) {
      updateHabit(editingHabit.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } else {
      addHabit({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Daily Study Habits
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Build unshakeable study routines and track your daily consistency.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* 30-Day Consistency Heatmap Matrix */}
      <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              30-Day Habit Completion Heatmap
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-neutral-100 dark:bg-neutral-800" />
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-200 dark:bg-teal-900/60" />
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-400 dark:bg-teal-700" />
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 dark:bg-teal-500" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pt-2">
          <div className="min-w-[620px]">
            <div className="grid grid-cols-30 gap-1.5">
              {past30Days.map((dateStr) => {
                const logs = state.habitLogs[dateStr] || [];
                const completedCount = logs.length;
                const totalHabits = state.habits.length || 1;
                const ratio = completedCount / totalHabits;

                let colorClass = 'bg-neutral-100 dark:bg-neutral-800/80';
                if (ratio >= 0.75) colorClass = 'bg-teal-600 dark:bg-teal-500 text-white';
                else if (ratio >= 0.5) colorClass = 'bg-teal-400 dark:bg-teal-600 text-white';
                else if (ratio > 0) colorClass = 'bg-teal-200 dark:bg-teal-900/80 text-teal-900 dark:text-teal-200';

                const isToday = dateStr === todayStr;

                return (
                  <div key={dateStr} className="flex flex-col items-center">
                    <div
                      className={`w-4.5 h-7 rounded-sm flex items-center justify-center text-[9px] font-mono transition-transform hover:scale-125 cursor-pointer ${colorClass} ${
                        isToday ? 'ring-2 ring-teal-500 ring-offset-1' : ''
                      }`}
                      title={`${dateStr}: ${completedCount} of ${state.habits.length} habits completed`}
                    >
                      {completedCount > 0 ? completedCount : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Date range footer labels */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-2 font-mono">
              <span>{formatDateShort(past30Days[0])}</span>
              <span>15 days ago</span>
              <span>Today ({formatDateShort(todayStr)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Habits List with 7-Day Quick Checkoff Table */}
      <div className="bg-white dark:bg-[#1A1D23] rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Active Habits & 7-Day History
          </h2>
          <span className="text-xs text-neutral-500">
            Click any cell to toggle completion for that day
          </span>
        </div>

        {state.habits.length === 0 ? (
          <div className="text-center py-12 p-8 space-y-3">
            <Sparkles className="w-8 h-8 text-neutral-400 mx-auto" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No habits created yet
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Start with simple daily anchors: 45 min deep work, flashcard drill, or active problem solving.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Your First Habit</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-800/20">
                  <th className="py-3 px-4 font-semibold text-neutral-600 dark:text-neutral-300 min-w-[200px]">
                    Habit Name
                  </th>
                  <th className="py-3 px-3 font-semibold text-neutral-600 dark:text-neutral-300 text-center w-24">
                    Streak
                  </th>
                  {past7Days.map((d) => {
                    const isToday = d === todayStr;
                    return (
                      <th
                        key={d}
                        className={`py-3 px-2 font-semibold text-center w-12 ${
                          isToday ? 'text-teal-700 dark:text-teal-400 font-bold' : 'text-neutral-500'
                        }`}
                      >
                        {formatDateShort(d).split(' ')[1] || d.slice(-2)}
                        <span className="block text-[9px] font-normal text-neutral-400">
                          {isToday ? 'Today' : addDays(d, 0).slice(5)}
                        </span>
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 font-semibold text-neutral-600 dark:text-neutral-300 text-right w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {state.habits.map((habit) => {
                  const streakInfo = calculateHabitStreak(habit.id, state.habitLogs);

                  return (
                    <tr
                      key={habit.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
                    >
                      {/* Name & description */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {habit.name}
                        </p>
                        {habit.description && (
                          <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                            {habit.description}
                          </p>
                        )}
                      </td>

                      {/* Streak counter */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{streakInfo.current}d</span>
                        </div>
                      </td>

                      {/* Past 7 days checkoff cells */}
                      {past7Days.map((dateStr) => {
                        const isDone = (state.habitLogs[dateStr] || []).includes(habit.id);
                        const isToday = dateStr === todayStr;

                        return (
                          <td key={dateStr} className="py-3 px-2 text-center">
                            <button
                              onClick={() => {
                                playSoftClick();
                                toggleHabitDay(habit.id, dateStr);
                              }}
                              className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-teal-600 text-white shadow-xs scale-105'
                                  : isToday
                                  ? 'border-2 border-dashed border-teal-500/60 text-transparent hover:border-teal-600'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-transparent hover:bg-neutral-200'
                              }`}
                              title={`${habit.name} on ${dateStr}: ${isDone ? 'Completed' : 'Not done'}`}
                            >
                              <Check className={`w-3.5 h-3.5 ${isDone ? 'opacity-100' : 'opacity-0'}`} />
                            </button>
                          </td>
                        );
                      })}

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(habit)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete habit "${habit.name}"?`)) {
                                deleteHabit(habit.id);
                              }
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {editingHabit ? 'Edit Habit' : 'Create Study Habit'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Habit Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 60-min deep focus block before noon"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Routine Description / Cue (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Put phone in drawer, open notebook, write down 3 key proofs"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  {editingHabit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
