import React, { useState, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { TimetableBlock, DayOfWeek } from '../../types';
import { getTodayString, getDayOfWeek } from '../../utils/date';
import { Plus, Trash2, Edit2, X, Clock, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { playSoftClick } from '../../utils/audio';
import { useBackHandler } from '../../hooks/useBackHandler';

const DAYS: { key: DayOfWeek; label: string; full: string }[] = [
  { key: 'mon', label: 'Mon', full: 'Monday' },
  { key: 'tue', label: 'Tue', full: 'Tuesday' },
  { key: 'wed', label: 'Wed', full: 'Wednesday' },
  { key: 'thu', label: 'Thu', full: 'Thursday' },
  { key: 'fri', label: 'Fri', full: 'Friday' },
  { key: 'sat', label: 'Sat', full: 'Saturday' },
  { key: 'sun', label: 'Sun', full: 'Sunday' },
];

// Display hours from 07:00 to 22:00
const TIME_SLOTS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00',
];

export const TimetableView: React.FC = () => {
  const { state, todayStr, addTimetableBlock, updateTimetableBlock, deleteTimetableBlock, getSubject } = useStudy();

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const todayDayOfWeek = getDayOfWeek(todayStr);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayDayOfWeek);

  // Current time state to highlight active block
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  useBackHandler(isModalOpen, () => setIsModalOpen(false), 'timetable-modal');
  const [editingBlock, setEditingBlock] = useState<TimetableBlock | null>(null);
  const [subjectId, setSubjectId] = useState(state.subjects[0]?.id || '');
  const [day, setDay] = useState<DayOfWeek>(selectedDay);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');

  const isCurrentBlock = (block: TimetableBlock) => {
    if (block.day !== todayDayOfWeek) return false;
    return currentTime >= block.startTime && currentTime <= block.endTime;
  };

  const handleOpenAdd = (defaultDay?: DayOfWeek) => {
    setEditingBlock(null);
    setSubjectId(state.subjects[0]?.id || '');
    setDay(defaultDay || selectedDay);
    setStartTime('09:00');
    setEndTime('10:30');
    setTitle('');
    setLocation('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (block: TimetableBlock) => {
    setEditingBlock(block);
    setSubjectId(block.subjectId);
    setDay(block.day);
    setStartTime(block.startTime);
    setEndTime(block.endTime);
    setTitle(block.title || '');
    setLocation(block.location || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !startTime || !endTime) return;

    if (editingBlock) {
      updateTimetableBlock(editingBlock.id, {
        subjectId,
        day,
        startTime,
        endTime,
        title: title.trim() || undefined,
        location: location.trim() || undefined,
      });
    } else {
      addTimetableBlock({
        subjectId,
        day,
        startTime,
        endTime,
        title: title.trim() || undefined,
        location: location.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 break-words">
            Study Timetable
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 break-words">
            Weekly class schedule, seminar times, and structured study blocks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 bg-neutral-200/60 dark:bg-neutral-800 rounded-xl text-xs font-medium shrink-0">
            <button
              onClick={() => {
                playSoftClick();
                setViewMode('week');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => {
                playSoftClick();
                setViewMode('day');
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              Day View
            </button>
          </div>

          <button
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Study Block</span>
          </button>
        </div>
      </div>

      {/* Week View Grid */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-[#1A1D23] rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Header row: Days of week */}
            <div className="grid grid-cols-7 border-b border-neutral-200/80 dark:border-neutral-800/80">
              {DAYS.map((d) => {
                const isToday = d.key === todayDayOfWeek;
                const count = state.timetable.filter((b) => b.day === d.key).length;
                return (
                  <div
                    key={d.key}
                    className={`py-3 px-3 text-center border-r last:border-r-0 border-neutral-200/60 dark:border-neutral-800/60 ${
                      isToday ? 'bg-teal-50/60 dark:bg-teal-950/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`text-xs font-bold ${isToday ? 'text-teal-700 dark:text-teal-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                        {d.label}
                      </span>
                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {count} {count === 1 ? 'block' : 'blocks'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Timetable Columns */}
            <div className="grid grid-cols-7 min-h-[440px] divide-x divide-neutral-200/60 dark:divide-neutral-800/60">
              {DAYS.map((d) => {
                const isToday = d.key === todayDayOfWeek;
                const dayBlocks = state.timetable
                  .filter((b) => b.day === d.key)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div
                    key={d.key}
                    className={`p-2.5 space-y-2 flex flex-col justify-start ${
                      isToday ? 'bg-teal-50/20 dark:bg-teal-950/10' : ''
                    }`}
                  >
                    {dayBlocks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-10 opacity-30">
                        <span className="text-[10px] text-neutral-400 text-center">Empty day</span>
                      </div>
                    ) : (
                      dayBlocks.map((block) => {
                        const subject = getSubject(block.subjectId);
                        const isNow = isCurrentBlock(block);

                        return (
                          <div
                            key={block.id}
                            className={`group relative p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                              isNow
                                ? 'ring-2 ring-teal-500 shadow-md bg-white dark:bg-neutral-800 border-teal-500/40'
                                : 'bg-neutral-50/80 dark:bg-neutral-800/40 border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700'
                            }`}
                          >
                            <div>
                              {isNow && (
                                <div className="text-[9px] font-bold tracking-wider uppercase text-teal-600 dark:text-teal-400 mb-1">
                                  Current Session
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 mb-1">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: subject?.color || '#0d9488' }}
                                />
                                <span className="font-semibold text-neutral-900 dark:text-neutral-100 break-words leading-tight">
                                  {block.title || subject?.name || 'Class'}
                                </span>
                              </div>

                              {subject && (
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 break-words leading-tight mb-1">
                                  {subject.name}
                                </p>
                              )}

                              <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                                <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                                <span>{block.startTime}–{block.endTime}</span>
                              </div>

                              {block.location && (
                                <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-1 break-words">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span>{block.location}</span>
                                </div>
                              )}
                            </div>

                            {/* Hover Actions */}
                            <div className="flex items-center justify-end gap-1 pt-1.5 mt-1 border-t border-neutral-200/50 dark:border-neutral-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEdit(block)}
                                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteTimetableBlock(block.id)}
                                className="p-1 rounded text-neutral-400 hover:text-red-500"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          {/* Day Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {DAYS.map((d) => {
              const isSelected = d.key === selectedDay;
              const isToday = d.key === todayDayOfWeek;
              return (
                <button
                  key={d.key}
                  onClick={() => {
                    playSoftClick();
                    setSelectedDay(d.key);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60 hover:bg-neutral-50'
                  }`}
                >
                  <span>{d.full}</span>
                  {isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Timeline representation for selected day */}
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs space-y-3">
            {state.timetable.filter((b) => b.day === selectedDay).length === 0 ? (
              <div className="text-center py-12 text-neutral-400 text-xs space-y-2">
                <p>No study blocks scheduled for {DAYS.find((d) => d.key === selectedDay)?.full}.</p>
                <button
                  onClick={() => handleOpenAdd(selectedDay)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 border border-teal-500/40 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Block</span>
                </button>
              </div>
            ) : (
              state.timetable
                .filter((b) => b.day === selectedDay)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((block) => {
                  const subject = getSubject(block.subjectId);
                  const isNow = isCurrentBlock(block);

                  return (
                    <div
                      key={block.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                        isNow
                          ? 'border-teal-500 bg-teal-50/20 dark:bg-teal-950/20 shadow-xs ring-1 ring-teal-500/50'
                          : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200/60 dark:border-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: subject?.color || '#0d9488' }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                              {block.title || subject?.name || 'Study Block'}
                            </h3>
                            {isNow && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950 px-2 py-0.5 rounded-md">
                                In Progress Now
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {subject && <span>{subject.name}</span>}
                            {block.location && (
                              <>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-neutral-400" />
                                  {block.location}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-xs font-mono font-medium tabular-nums text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                          {block.startTime} – {block.endTime}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(block)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTimetableBlock(block.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Block Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {editingBlock ? 'Edit Schedule Block' : 'Add Schedule Block'}
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
                  Subject *
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
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
                  Day of Week *
                </label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value as DayOfWeek)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                >
                  {DAYS.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.full}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Block Title / Activity (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Architecture Lecture, Lab Sprint, Problem Set"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Location / Room / Platform (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Library 3rd Floor, Hall B, Zoom"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
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
                  {editingBlock ? 'Update Block' : 'Add Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
