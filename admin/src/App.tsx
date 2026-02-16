import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
import { Toaster, toast } from 'react-hot-toast';
import { TicketList } from './components/TicketList';
import { UserList } from './components/UserList';
import { Shield, Loader2, LogOut, Ticket, Users } from 'lucide-react';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'tickets' | 'users'>('tickets');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      // Try login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  }

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-stone-400" /></div>;
  }

  if (!session) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50 p-4">
        <Toaster />
        <div className="w-full max-w-md bg-white neo-border neo-shadow p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-full mb-3">
              <Shield size={24} />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight">HabiCard Admin</h1>
            <p className="text-stone-500 text-sm">Restricted Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 neo-border bg-stone-50 focus:bg-white focus:outline-none transition-colors font-medium"
                placeholder="admin@habicard.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-3 neo-border bg-stone-50 focus:bg-white focus:outline-none transition-colors font-medium"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-black text-white font-black uppercase tracking-widest neo-border neo-shadow hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              {authLoading ? 'Verifying...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Toaster />
      <header className="bg-white border-b-2 border-black p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-full">
              <Shield size={16} />
            </div>
            <span className="font-black uppercase tracking-tight">HabiAdmin</span>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('tickets')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${currentView === 'tickets' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}
            >
              <Ticket size={16} />
              Tickets
            </button>
            <button
              onClick={() => setCurrentView('users')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${currentView === 'users' ? 'bg-black text-white' : 'text-stone-500 hover:bg-stone-100'}`}
            >
              <Users size={16} />
              Users
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-stone-500 hidden md:inline">{session.user.email}</span>
          <button onClick={handleLogout} className="p-2 hover:bg-stone-100 rounded-md transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {currentView === 'tickets' ? <TicketList /> : <UserList />}
      </main>
    </div>
  );
}

export default App;
