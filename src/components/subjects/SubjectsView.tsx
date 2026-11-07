import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { Subject } from '../../types';
import { COLOR_PALETTE } from '../../utils/storage';
import { Plus, Edit2, Trash2, Clock, CheckCircle2, ChevronRight, X, BookOpen } from 'lucide-react';
import { playSoftClick } from '../../utils/audio';
import { useBackHandler } from '../../hooks/useBackHandler';

export const SubjectsView: React.FC = () => {
  const {
    state,
    addSubject,
    updateSubject,
    deleteSubject,
    addStudySession,
    setActiveTab,
    todayStr,
  } = useStudy();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0].hex);
  const [notes, setNotes] = useState('');

  // Quick manual study log modal
  const [logTimeSubject, setLogTimeSubject] = useState<Subject | null>(null);
  const [logMinutes, setLogMinutes] = useState(30);
  const [logNote, setLogNote] = useState('');

  // Selected subject for expanded drill-down view
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  useBackHandler(isModalOpen, () => setIsModalOpen(false), 'subject-modal');
  useBackHandler(Boolean(logTimeSubject), () => setLogTimeSubject(null), 'log-time-modal');
  useBackHandler(Boolean(selectedSubId), () => setSelectedSubId(null), 'subject-detail');

  const openAddModal = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)].hex);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code || '');
    setColor(sub.color);
    setNotes(sub.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: name.trim(),
        code: code.trim() || undefined,
        color,
        notes: notes.trim() || undefined,
      });
    } else {
      addSubject({
        name: name.trim(),
        code: code.trim() || undefined,
        color,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleLogTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTimeSubject || logMinutes <= 0) return;

    addStudySession({
      subjectId: logTimeSubject.id,
      date: todayStr,
      minutes: Number(logMinutes),
      mode: 'manual',
      note: logNote.trim() || 'Manual study log',
    });

    setLogTimeSubject(null);
    setLogMinutes(30);
    setLogNote('');
  };

  const activeSelectedSub = state.subjects.find((s) => s.id === selectedSubId);
  const selectedSubGoals = activeSelectedSub ? state.goals.filter((g) => g.subjectId === activeSelectedSub.id) : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Subjects & Courses
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Organize study materials, track hours, and monitor completion rates.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Subject</span>
        </button>
      </div>

      {/* Drill-down Sub-view if a subject is expanded */}
      {activeSelectedSub && (
        <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: activeSelectedSub.color }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {activeSelectedSub.name}
                  </h2>
                  {activeSelectedSub.code && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {activeSelectedSub.code}
                    </span>
                  )}
                </div>
                {activeSelectedSub.notes && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {activeSelectedSub.notes}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedSubId(null)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics for this subject */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
              <span className="text-xs text-neutral-500">Total Hours</span>
              <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100 mt-1">
                {(
                  state.studySessions
                    .filter((s) => s.subjectId === activeSelectedSub.id)
                    .reduce((sum, s) => sum + s.minutes, 0) / 60
                ).toFixed(1)}
                h
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
              <span className="text-xs text-neutral-500">Completed Goals</span>
              <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100 mt-1">
                {selectedSubGoals.filter((g) => g.completed).length}/{selectedSubGoals.length}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60">
              <span className="text-xs text-neutral-500">Scheduled Blocks</span>
              <p className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100 mt-1">
                {state.timetable.filter((t) => t.subjectId === activeSelectedSub.id).length}
              </p>
            </div>
          </div>

          {/* Goals for this subject */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Goals for this Subject ({selectedSubGoals.length})
              </span>
              <button
                onClick={() => {
                  playSoftClick();
                  setActiveTab('goals');
                }}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
              >
                Go to Goals Page &rarr;
              </button>
            </div>

            {selectedSubGoals.length === 0 ? (
              <p className="text-xs text-neutral-400 py-3">No goals created for this subject yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedSubGoals.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 text-xs"
                  >
                    <span
                      className={`truncate max-w-[70%] ${
                        g.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200 font-medium'
                      }`}
                    >
                      {g.title}
                    </span>
                    <span className="text-neutral-400 font-mono">{g.date}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.subjects.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-[#1A1D23] rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 p-8 space-y-3">
            <BookOpen className="w-10 h-10 text-neutral-400 mx-auto" />
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
              No subjects added yet
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Add your courses or topics to organize goals, schedule study blocks, and track your focus hours.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Subject</span>
            </button>
          </div>
        ) : (
          state.subjects.map((sub) => {
            const subGoals = state.goals.filter((g) => g.subjectId === sub.id);
            const completedCount = subGoals.filter((g) => g.completed).length;
            const percentage = subGoals.length > 0 ? Math.round((completedCount / subGoals.length) * 100) : 0;
            const subSessions = state.studySessions.filter((s) => s.subjectId === sub.id);
            const hoursStudied = (
              subSessions.reduce((sum, s) => sum + s.minutes, 0) / 60
            ).toFixed(1);

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-[#1A1D23] rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <div>
                        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                          {sub.name}
                        </h3>
                        {sub.code && (
                          <span className="text-[11px] font-mono font-medium text-neutral-500 dark:text-neutral-400">
                            {sub.code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(sub)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Edit subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete subject "${sub.name}" and associated entries?`)) {
                            deleteSubject(sub.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Delete subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {sub.notes && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 mb-3">
                      {sub.notes}
                    </p>
                  )}

                  {/* Metrics bar */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-800/50 text-xs">
                    <div>
                      <span className="text-[11px] text-neutral-400">Hours Studied</span>
                      <p className="font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {hoursStudied}h
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-400">Goals Done</span>
                      <p className="font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {completedCount}/{subGoals.length}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Goal Progress</span>
                      <span className="font-semibold tabular-nums">{percentage}%</span>
                    </div>
                    <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%`, backgroundColor: sub.color }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => {
                      setLogTimeSubject(sub);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Log Time</span>
                  </button>

                  <button
                    onClick={() => setSelectedSubId(sub.id === selectedSubId ? null : sub.id)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="View details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Course Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS 450"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTE.map((pal) => (
                    <button
                      key={pal.hex}
                      type="button"
                      onClick={() => setColor(pal.hex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        color === pal.hex ? 'ring-2 ring-offset-2 ring-neutral-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: pal.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Topic Notes / Focus Area (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Key topics, exam dates, or syllabus notes"
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
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Quick Log Time Modal */}
      {logTimeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: logTimeSubject.color }}
                />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Log Study Time: {logTimeSubject.name}
                </h3>
              </div>
              <button
                onClick={() => setLogTimeSubject(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogTimeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Duration (minutes)
                </label>
                <div className="flex items-center gap-2">
                  {[15, 30, 45, 60, 90].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLogMinutes(m)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        logMinutes === m
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={logMinutes}
                  onChange={(e) => setLogMinutes(Number(e.target.value))}
                  className="mt-2 w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Study Note / Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4 review, problem set 2"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLogTimeSubject(null)}
                  className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                >
                  Log {logMinutes} Minutes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
