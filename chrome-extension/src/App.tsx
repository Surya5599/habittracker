import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './supabase';
// import { AuthForm } from './components/AuthForm';
import { useHabits } from './hooks/useHabits';
import { useTheme } from './hooks/useTheme';
import { DailyNote, Task, DayData } from './types';
import { generateUUID } from './utils/uuid';
import { DailyCard } from './components/DailyCard';
import { ShareCustomizationModal, ColorScheme } from './components/ShareCustomizationModal';
import { SettingsModal } from './components/SettingsModal';
import { HabitManagerModal } from './components/HabitManagerModal';
import { generateShareCard, shareCard } from './utils/shareCardGenerator';
import { ExternalLink, LogOut, Settings, List, BarChart3 } from 'lucide-react';

const WEB_APP_URL = import.meta.env.PROD ? 'https://habicard.com' : 'http://localhost:3000';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<DailyNote>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // Share state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [habitManagerModalOpen, setHabitManagerModalOpen] = useState(false);
  const [shareData, setShareData] = useState<{
    date: Date;
    dayName: string;
    dateString: string;
    completedCount: number;
    totalCount: number;
    progress: number;
  } | null>(null);

  const { theme, setTheme } = useTheme();
  const {
    habits,
    completions,
    toggleCompletion,
    addHabit,
    updateHabit,
    removeHabit,
    setLoading: setHabitsLoading
  } = useHabits(session, false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (!initialSession) {
        setLoading(false);
        setHabitsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setLoading(false);
        setHabitsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setHabitsLoading]);

  // Load notes
  useEffect(() => {
    const loadData = async () => {
      if (session?.user?.id) {
        const { data: notesData, error: notesError } = await supabase
          .from('daily_notes')
          .select('date_key, content')
          .eq('user_id', session.user.id);

        if (!notesError && notesData) {
          const notesObj: DailyNote = {};
          notesData.forEach(note => {
            try {
              const parsed = JSON.parse(note.content);
              if (Array.isArray(parsed)) {
                notesObj[note.date_key] = { tasks: parsed };
              } else if (parsed && typeof parsed === 'object') {
                if ('tasks' in parsed) {
                  notesObj[note.date_key] = parsed as any;
                  // Casting to any or DayData because types.ts in extension assumes DayData now if I updated it.
                } else {
                  notesObj[note.date_key] = { tasks: [], ...parsed } as any;
                }
              } else {
                notesObj[note.date_key] = { tasks: [{ id: generateUUID(), text: String(parsed), completed: false }] };
              }
            } catch {
              if (note.content) {
                notesObj[note.date_key] = { tasks: [{ id: generateUUID(), text: note.content, completed: false }] };
              }
            }
          });
          setNotes(notesObj);
        }
      }
      setLoading(false);
    };
    if (session) loadData();
  }, [session]);

  const updateNote = async (dateKey: string, data: Partial<DayData>) => {
    setNotes(prev => {
      const current = prev[dateKey] || { tasks: [] };
      // Merge the partial data with existing data
      const updated = { ...current, ...data };
      return { ...prev, [dateKey]: updated };
    });

    if (session?.user?.id) {
      // We need the latest note object to save.
      // Since setNotes is async, we construct the object here.
      const currentNote = notes[dateKey] || { tasks: [] };
      const updatedNote = { ...currentNote, ...data };

      // Check if the note is completely empty
      const isEmpty = (!updatedNote.tasks || updatedNote.tasks.length === 0) && !updatedNote.mood && !updatedNote.journal;

      if (isEmpty) {
        await supabase
          .from('daily_notes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('date_key', dateKey);
      } else {
        await supabase
          .from('daily_notes')
          .upsert({
            user_id: session.user.id,
            date_key: dateKey,
            content: JSON.stringify(updatedNote)
          }, {
            onConflict: 'user_id,date_key'
          });
      }
    }
  };

  const handleShareClick = (data: { date: Date, dayName: string, dateString: string, completedCount: number, totalCount: number, progress: number }) => {
    setShareData(data);
    setShareModalOpen(true);
  };

  const handleShareConfirm = async (colorScheme: ColorScheme, message: string) => {
    if (!shareData) return;

    try {
      const blob = await generateShareCard({
        dayName: shareData.dayName,
        dateString: shareData.dateString,
        completedCount: shareData.completedCount,
        totalCount: shareData.totalCount,
        progress: shareData.progress,
        theme,
        colorScheme,
        message
      });
      await shareCard(blob, shareData.dayName);
    } catch (error) {
      console.error('Failed to share:', error);
      toast.error('Failed to share card');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const openFullSite = () => {
    chrome.tabs.create({ url: WEB_APP_URL });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#e5e5e5]">
        <div className="text-sm font-black uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 bg-[#e5e5e5] min-h-screen flex items-center justify-center">
        <Toaster position="top-center" />
        <div className="max-w-md w-full bg-white border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6 text-center">
          <img src="/habicard_logo.png" alt="HabiCard" className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#444] uppercase tracking-widest">
            Welcome to HabiCard
          </h2>
          <p className="text-sm text-stone-500">
            Sign in on the web to sync your habits.
          </p>
          <button
            onClick={() => {
              chrome.tabs.create({ url: `${WEB_APP_URL}/?source=extension` });
            }}
            className="w-full px-4 py-2 border-[2px] border-black text-sm font-black uppercase tracking-widest bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <span>Sign in to HabiCard</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="bg-[#e5e5e5] min-h-screen p-2 font-sans text-[#444]">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-2 px-1">
        <h1 className="text-xs font-black uppercase tracking-widest text-stone-500">Today's Focus</h1>
        <div className="flex gap-2">
          <button
            onClick={openFullSite}
            className="px-3 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
            title="View Analytics"
          >
            <BarChart3 size={12} strokeWidth={3} />
            Analytics
          </button>
          <button
            onClick={() => setHabitManagerModalOpen(true)}
            className="p-1 hover:bg-stone-200 rounded text-stone-500"
            title="Manage Habits"
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="p-1 hover:bg-stone-200 rounded text-stone-500"
            title="Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      <DailyCard
        date={currentDate}
        habits={habits}
        completions={completions}
        theme={theme}
        toggleCompletion={toggleCompletion}
        notes={notes}
        updateNote={updateNote}
        onShareClick={handleShareClick}
        onPrev={() => setCurrentDate(prev => {
          const d = new Date(prev);
          d.setDate(d.getDate() - 1);
          return d;
        })}
        onNext={() => setCurrentDate(prev => {
          const d = new Date(prev);
          d.setDate(d.getDate() + 1);
          return d;
        })}
        onDateSelect={(date) => setCurrentDate(date)}
        addHabit={async () => {
          const id = await addHabit(theme.primary);
          if (id) setEditingHabitId(id);
          return id;
        }}
        updateHabitName={(id, name) => updateHabit(id, { name })}
        removeHabit={removeHabit}
        editingHabitId={editingHabitId}
        setEditingHabitId={setEditingHabitId}
      />



      <ShareCustomizationModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onShare={handleShareConfirm}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentTheme={theme}
        onSelectTheme={setTheme}
      />

      <HabitManagerModal
        isOpen={habitManagerModalOpen}
        onClose={() => setHabitManagerModalOpen(false)}
        habits={habits}
        addHabit={addHabit}
        updateHabit={updateHabit}
        removeHabit={removeHabit}
        themePrimary={theme.primary}
      />
    </div>
  );
};

export default App;
