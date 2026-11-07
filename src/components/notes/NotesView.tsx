import React, { useState } from 'react';
import { useStudy } from '../../context/StudyContext';
import { Note } from '../../types';
import { formatDateShort } from '../../utils/date';
import { Plus, Pin, Trash2, Edit2, Copy, Check, Search, FileText, X } from 'lucide-react';
import { playSoftClick } from '../../utils/audio';
import { useBackHandler } from '../../hooks/useBackHandler';

export const NotesView: React.FC = () => {
  const { state, addNote, updateNote, deleteNote, togglePinNote, getSubject } = useStudy();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Active note editor state
  const [activeNoteId, setActiveNoteId] = useState<string | null>(state.notes[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);

  useBackHandler(isEditing, () => setIsEditing(false), 'note-editing');

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteSubjectId, setNoteSubjectId] = useState<string>('');

  const activeNote = state.notes.find((n) => n.id === activeNoteId);

  const filteredNotes = state.notes
    .filter((n) => {
      if (selectedSubjectId !== 'all' && n.subjectId !== selectedSubjectId) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const handleCreateNew = () => {
    playSoftClick();
    const created = addNote({
      title: 'Untitled Note',
      content: '',
      subjectId: selectedSubjectId !== 'all' ? selectedSubjectId : undefined,
      isPinned: false,
    });
    setActiveNoteId(created.id);
    setTitle(created.title);
    setContent(created.content);
    setNoteSubjectId(created.subjectId || '');
    setIsEditing(true);
  };

  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setNoteSubjectId(note.subjectId || '');
    setIsEditing(false);
  };

  const handleSaveActiveNote = () => {
    if (!activeNoteId) return;
    updateNote(activeNoteId, {
      title: title.trim() || 'Untitled Note',
      content,
      subjectId: noteSubjectId || undefined,
    });
    setIsEditing(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNoteId(id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Quick Pad & Study Notes
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Formulas, algorithm proofs, key derivations, and quick conceptual scratchpad.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Main Split Layout: Notes Sidebar (Left) & Note Reader/Editor (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[580px]">
        {/* Left Column: Note List (4 cols) */}
        <div className="md:col-span-5 lg:col-span-4 bg-white dark:bg-[#1A1D23] rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col overflow-hidden">
          {/* Search & Subject filter */}
          <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search notes or formulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
              />
            </div>

            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200"
            >
              <option value="all">All Subjects</option>
              {state.subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scrollable Note Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60 p-2 space-y-1">
            {filteredNotes.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No matching notes found.
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = note.id === activeNoteId;
                const subject = note.subjectId ? getSubject(note.subjectId) : null;

                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/80'
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4
                        className={`text-xs font-semibold break-words leading-snug flex-1 ${
                          isSelected
                            ? 'text-teal-900 dark:text-teal-200 font-bold'
                            : 'text-neutral-900 dark:text-neutral-100'
                        }`}
                      >
                        {note.title}
                      </h4>
                      {note.isPinned && (
                        <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-3">
                      {note.content || 'Empty note...'}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-neutral-400">
                      {subject ? (
                        <span className="font-medium break-words" style={{ color: subject.color }}>
                          {subject.name}
                        </span>
                      ) : (
                        <span>General</span>
                      )}
                      <span className="font-mono">{formatDateShort(note.updatedAt.slice(0, 10))}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Note Reader / Full Editor (8 cols) */}
        <div className="md:col-span-7 lg:col-span-8 bg-white dark:bg-[#1A1D23] rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex flex-col p-6">
          {activeNote ? (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Header Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePinNote(activeNote.id)}
                    className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeNote.isPinned
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                        : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                    title={activeNote.isPinned ? 'Unpin note' : 'Pin note to top'}
                  >
                    <Pin className={`w-4 h-4 ${activeNote.isPinned ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => handleCopy(activeNote.content, activeNote.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                    title="Copy note content"
                  >
                    {copiedNoteId === activeNote.id ? (
                      <Check className="w-4 h-4 text-teal-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete note "${activeNote.title}"?`)) {
                        deleteNote(activeNote.id);
                        setActiveNoteId(null);
                      }
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <button
                      onClick={handleSaveActiveNote}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Done Editing</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setTitle(activeNote.title);
                        setContent(activeNote.content);
                        setNoteSubjectId(activeNote.subjectId || '');
                        setIsEditing(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Title & Subject tag */}
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note Title"
                    className="w-full text-lg font-bold bg-transparent text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-1 focus:outline-hidden focus:border-teal-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">Tag Subject:</span>
                    <select
                      value={noteSubjectId}
                      onChange={(e) => setNoteSubjectId(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="">None (General)</option>
                      {state.subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {activeNote.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400">
                    {activeNote.subjectId && (
                      <span className="font-semibold" style={{ color: getSubject(activeNote.subjectId)?.color }}>
                        {getSubject(activeNote.subjectId)?.name}
                      </span>
                    )}
                    <span>·</span>
                    <span>Updated {formatDateShort(activeNote.updatedAt.slice(0, 10))}</span>
                  </div>
                </div>
              )}

              {/* Body Textarea / Reader */}
              {isEditing ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your notes, markdown summaries, formulas, or reminders..."
                  className="flex-1 w-full p-3 font-mono text-xs leading-relaxed bg-neutral-50/60 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 rounded-xl resize-none text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              ) : (
                <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed bg-neutral-50/40 dark:bg-neutral-800/20 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800/50">
                  {activeNote.content || (
                    <span className="text-neutral-400 italic">No notes written yet. Click Edit to add formulas or notes.</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400">
              <FileText className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">Select or create a note to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
