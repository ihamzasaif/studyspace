import React, { useState, useEffect } from 'react';
import { useStudy } from '../../context/StudyContext';
import { COLOR_PALETTE } from '../../utils/storage';
import { X, User, Briefcase, GraduationCap, Target, Check, Sparkles } from 'lucide-react';
import { playSoftClick } from '../../utils/audio';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { state, updateProfile } = useStudy();

  const [name, setName] = useState(state.profile.name || '');
  const [profession, setProfession] = useState(state.profile.profession || '');
  const [institution, setInstitution] = useState(state.profile.institution || '');
  const [targetGoal, setTargetGoal] = useState(state.profile.targetGoal || '');
  const [avatarColor, setAvatarColor] = useState(state.profile.avatarColor || '#0d9488');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(state.profile.name || '');
      setProfession(state.profile.profession || '');
      setInstitution(state.profile.institution || '');
      setTargetGoal(state.profile.targetGoal || '');
      setAvatarColor(state.profile.avatarColor || '#0d9488');
    }
  }, [isOpen, state.profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSoftClick();

    updateProfile({
      name: name.trim(),
      profession: profession.trim(),
      institution: institution.trim() || undefined,
      targetGoal: targetGoal.trim() || undefined,
      avatarColor,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const getInitials = () => {
    if (!name.trim()) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h2 id="profile-modal-title" className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              Personal Study Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Identity Preview Card */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-xs shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {getInitials()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                {name.trim() || 'Your Name'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                {profession.trim() || 'Add profession / field of study'}
              </p>
              {institution.trim() && (
                <p className="text-[11px] text-teal-600 dark:text-teal-400 truncate mt-0.5">
                  {institution.trim()}
                </p>
              )}
            </div>
          </div>

          {/* Avatar Color Selector */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Avatar Theme Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map((pal) => (
                <button
                  key={pal.hex}
                  type="button"
                  onClick={() => setAvatarColor(pal.hex)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    avatarColor === pal.hex
                      ? 'ring-2 ring-offset-2 ring-neutral-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: pal.hex }}
                />
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Your Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. Hamza Tariq"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>

          {/* Profession / Role */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Profession / Study Discipline *
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. Computer Science Student, Medical Aspirant, Researcher"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500/50"
              />
            </div>
          </div>

          {/* Institution / University */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Institution / College / Workspace (Optional)
            </label>
            <div className="relative">
              <GraduationCap className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Faculty of Engineering, Independent Learner"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Core Target Goal */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Current Academic or Study Ambition (Optional)
            </label>
            <div className="relative">
              <Target className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Prepare for Semester Finals & master System Design"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Displayed as a quiet reminder at the top of your dashboard.
            </p>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Profile Saved</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
