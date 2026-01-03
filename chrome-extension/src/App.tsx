import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './supabase';
// import { AuthForm } from './components/AuthForm';
import { useHabits } from './hooks/useHabits';
import { useTheme } from './hooks/useTheme';
import { DailyNote, Task } from './types';
import { generateUUID } from './utils/uuid';
import { DailyCard } from './components/DailyCard';
import { ShareCustomizationModal, ColorScheme } from './components/ShareCustomizationModal';
import { SettingsModal } from './components/SettingsModal';
import { generateShareCard, shareCard } from './utils/shareCardGenerator';
import { ExternalLink, LogOut, Settings } from 'lucide-react';

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
                notesObj[note.date_key] = parsed;
              } else {
                notesObj[note.date_key] = [{ id: generateUUID(), text: String(parsed), completed: false }];
              }
            } catch {
              if (note.content) {
                notesObj[note.date_key] = [{ id: generateUUID(), text: note.content, completed: false }];
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

  const updateNote = async (dateKey: string, tasks: Task[]) => {
    setNotes(prev => ({ ...prev, [dateKey]: tasks }));

    if (session?.user?.id) {
      if (tasks.length === 0) {
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
            content: JSON.stringify(tasks)
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
          <img src="/logo.png" alt="HabiCard" className="w-12 h-12 mx-auto mb-4" />
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
            onClick={() => setSettingsModalOpen(true)}
            className="p-1 hover:bg-stone-200 rounded text-stone-500"
            title="Settings"
          >
            <Settings size={14} />
          </button>
          {/*           <button
            onClick={handleLogout}
            className="p-1 hover:bg-stone-200 rounded text-stone-500"
            title="Sign Out"
          >
            <LogOut size={14} />
          </button> */}
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

      <button
        onClick={openFullSite}
        className="w-full mt-3 py-2 bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-stone-50 transition-all"
      >
        <span>Open Full Experience</span>
        <ExternalLink size={12} />
      </button>

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
    </div>
  );
};

export default App;
