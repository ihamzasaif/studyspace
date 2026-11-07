import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { X, Download, Upload, RotateCcw, Trash2, Bell, Clock, Calendar, Check } from 'lucide-react';
import { playSoftClick } from '../../utils/audio';
import { useBackHandler } from '../../hooks/useBackHandler';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  useBackHandler(isOpen, onClose, 'settings-modal');

  const { state, updateSettings, setExamCountdown, resetToSampleData, clearData, exportData, importData } = useStudy();

  const [dailyTarget, setDailyTarget] = useState(state.settings.dailyTargetHours);
  const [workMin, setWorkMin] = useState(state.settings.pomodoroWorkMinutes);
  const [shortBreakMin, setShortBreakMin] = useState(state.settings.pomodoroShortBreakMinutes);
  const [longBreakMin, setLongBreakMin] = useState(state.settings.pomodoroLongBreakMinutes);
  const [soundEnabled, setSoundEnabled] = useState(state.settings.soundEnabled);

  // Exam Countdown local edit
  const [examTitle, setExamTitle] = useState(state.examCountdown?.title || '');
  const [examDate, setExamDate] = useState(state.examCountdown?.targetDate || '');
  const [examSubjectId, setExamSubjectId] = useState(state.examCountdown?.subjectId || '');

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    playSoftClick();

    updateSettings({
      dailyTargetHours: Number(dailyTarget),
      pomodoroWorkMinutes: Number(workMin),
      pomodoroShortBreakMinutes: Number(shortBreakMin),
      pomodoroLongBreakMinutes: Number(longBreakMin),
      soundEnabled,
    });

    if (examTitle.trim() && examDate) {
      setExamCountdown({
        title: examTitle.trim(),
        targetDate: examDate,
        subjectId: examSubjectId || undefined,
      });
    } else if (!examTitle.trim() && !examDate) {
      setExamCountdown(null);
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        importData(content);
        alert('Data successfully imported!');
        onClose();
      } catch {
        alert('Failed to import file. Please ensure it is a valid Study Room backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 id="settings-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Study Room Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveSettings} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Daily Study Target */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Daily Study Target (hours)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0.5"
                max="16"
                step="0.5"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(Number(e.target.value))}
                className="w-28 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50"
              />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                Shows in your dashboard circular goal progress
              </span>
            </div>
          </div>

          {/* Pomodoro Timer Lengths */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Pomodoro Durations (minutes)</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Focus</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={workMin}
                  onChange={(e) => setWorkMin(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Short Break</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={shortBreakMin}
                  onChange={(e) => setShortBreakMin(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">Long Break</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={longBreakMin}
                  onChange={(e) => setLongBreakMin(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>

          {/* Sound & Notifications */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded-sm text-teal-600 focus:ring-teal-500 border-neutral-300 dark:border-neutral-700"
              />
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <Bell className="w-4 h-4 text-neutral-500" />
                <span>Play completion chime at end of focus session</span>
              </div>
            </label>
          </div>

          {/* Exam Countdown Settings */}
          <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Target Exam Countdown</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="e.g. Final Semester Examinations"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
                <select
                  value={examSubjectId}
                  onChange={(e) => setExamSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                >
                  <option value="">All / General Exam</option>
                  {state.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Data Backup & Reset */}
          <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Backup & Data Management
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportData}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Data (JSON)
              </button>

              <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                Import Data (JSON)
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {confirmReset ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetToSampleData();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Load Demo Data
                </button>
              )}

              {confirmClear ? (
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      clearData();
                      setConfirmClear(false);
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Erase All
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All Data
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Saved
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
