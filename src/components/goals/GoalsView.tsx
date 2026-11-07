import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { Goal, Priority } from '../../types';
import {
  CheckCircle2,
  Circle,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { formatDateDisplay, addDays, getTodayString } from '../../utils/date';
import { playSoftClick } from '../../utils/audio';
import { useBackHandler } from '../../hooks/useBackHandler';

export const GoalsView: React.FC = () => {
  const {
    state,
    todayStr,
    addGoal,
    updateGoal,
    toggleGoal,
    deleteGoal,
    reorderGoals,
    carryOverUnfinishedGoals,
    getSubject,
  } = useStudy();

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'done'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  useBackHandler(isModalOpen, () => setIsModalOpen(false), 'goal-modal');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id || '');
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>(45);

  // Banner message for carry-over
  const [carryOverMessage, setCarryOverMessage] = useState<string | null>(null);

  // All goals for current selected date
  const dateGoals = state.goals
    .filter((g) => g.date === selectedDate)
    .sort((a, b) => a.order - b.order);

  // Filtered goals
  const filteredGoals = dateGoals.filter((g) => {
    if (filterSubject !== 'all' && g.subjectId !== filterSubject) return false;
    if (filterStatus === 'pending' && g.completed) return false;
    if (filterStatus === 'done' && !g.completed) return false;
    return true;
  });

  const completedCount = dateGoals.filter((g) => g.completed).length;
  const totalCount = dateGoals.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setTitle('');
    setSubjectId(state.subjects[0]?.id || '');
    setPriority('medium');
    setNotes('');
    setEstimatedMinutes(45);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setSubjectId(goal.subjectId);
    setPriority(goal.priority);
    setNotes(goal.notes || '');
    setEstimatedMinutes(goal.estimatedMinutes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId) return;

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        title: title.trim(),
        subjectId,
        priority,
        notes: notes.trim() || undefined,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      });
    } else {
      addGoal({
        title: title.trim(),
        subjectId,
        date: selectedDate,
        completed: false,
        priority,
        notes: notes.trim() || undefined,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredGoals.length) return;

    const newOrder = [...filteredGoals];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    reorderGoals(
      selectedDate,
      newOrder.map((g) => g.id)
    );
  };

  const handleCarryOver = () => {
    const count = carryOverUnfinishedGoals(selectedDate);
    if (count > 0) {
      setCarryOverMessage(
        `Transferred ${count} pending goal${count > 1 ? 's' : ''} to tomorrow (${formatDateDisplay(
          addDays(selectedDate, 1)
        ).split(',')[0]}).`
      );
    } else {
      setCarryOverMessage('All goals for this date are already completed!');
    }
    setTimeout(() => setCarryOverMessage(null), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Date Navigation & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Daily Goals Planner
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Break your study sessions into clear, verifiable outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Carry-over Button */}
          <button
            onClick={handleCarryOver}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/60 shadow-xs transition-colors shrink-0"
            title="Carry unfinished goals over to tomorrow"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Carry Over Unfinished</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Date Navigator Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-[#1A1D23] rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-semibold bg-transparent text-neutral-900 dark:text-neutral-100 border-none cursor-pointer focus:outline-hidden"
            />
            <span className="text-xs text-neutral-500">
              ({formatDateDisplay(selectedDate)})
            </span>
          </div>

          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Date Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedDate(addDays(todayStr, -1))}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              selectedDate === addDays(todayStr, -1)
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              selectedDate === todayStr
                ? 'bg-teal-600 text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDate(addDays(todayStr, 1))}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              selectedDate === addDays(todayStr, 1)
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Temporary Alert Banner for carry-over */}
      {carryOverMessage && (
        <div className="flex items-center justify-between p-3.5 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800 rounded-xl text-xs">
          <span>{carryOverMessage}</span>
          <button onClick={() => setCarryOverMessage(null)} className="text-teal-600 hover:text-teal-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Progress & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        {/* Progress Fraction */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            Progress: <strong className="text-neutral-900 dark:text-neutral-100 font-bold tabular-nums">{completedCount}/{totalCount}</strong> ({completionPercent}%)
          </span>
          <div className="w-24 bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 dark:bg-teal-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Filter Controls (Segmented Tabs) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Subject Filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200"
          >
            <option value="all">All Subjects</option>
            {state.subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center p-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('done')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterStatus === 'done'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-2.5">
        {filteredGoals.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#1A1D23] rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-8 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {totalCount === 0 ? 'No goals scheduled for this day' : 'No goals match your active filters'}
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Plan out key formulas to master, textbook problem sets, or revision tasks.
            </p>
            {totalCount === 0 && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Goal for {formatDateDisplay(selectedDate).split(',')[0]}</span>
              </button>
            )}
          </div>
        ) : (
          filteredGoals.map((goal, index) => {
            const subject = getSubject(goal.subjectId);
            return (
              <div
                key={goal.id}
                className={`group flex items-start justify-between gap-3 p-4 rounded-2xl border transition-all ${
                  goal.completed
                    ? 'bg-neutral-50/70 dark:bg-neutral-800/20 border-neutral-200/50 dark:border-neutral-800/50'
                    : 'bg-white dark:bg-[#1A1D23] border-neutral-200/80 dark:border-neutral-800/80 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {/* Left checkmark and content */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => {
                      playSoftClick();
                      toggleGoal(goal.id);
                    }}
                    className="mt-0.5 text-neutral-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors shrink-0"
                    aria-label={goal.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 fill-teal-100 dark:fill-teal-950/40" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium transition-colors ${
                        goal.completed
                          ? 'line-through text-neutral-400 dark:text-neutral-500'
                          : 'text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      {goal.title}
                    </p>

                    {goal.notes && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {goal.notes}
                      </p>
                    )}

                    {/* Metadata line without pills */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {subject && (
                        <span className="flex items-center gap-1 font-medium" style={{ color: subject.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                          {subject.name}
                        </span>
                      )}
                      {goal.estimatedMinutes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{goal.estimatedMinutes} mins est.</span>
                        </>
                      )}
                      {goal.priority !== 'medium' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              goal.priority === 'high'
                                ? 'text-rose-600 dark:text-rose-400 font-medium'
                                : 'text-neutral-400'
                            }
                          >
                            {goal.priority === 'high' ? 'High Priority' : 'Low Priority'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls: Move Up/Down, Edit, Delete */}
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-30 disabled:pointer-events-none"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === filteredGoals.length - 1}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 disabled:opacity-30 disabled:pointer-events-none"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(goal)}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title="Edit goal"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-red-600"
                    title="Delete goal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {editingGoal ? 'Edit Goal' : 'Add Daily Goal'}
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
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master dynamic programming knapsack variant"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Subject *
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  >
                    {state.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Estimated Minutes (Optional)
                </label>
                <input
                  type="number"
                  min="5"
                  max="360"
                  placeholder="e.g. 45"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Notes & Details (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Textbook problem numbers, reference links, or test criteria"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  {editingGoal ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
