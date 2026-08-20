import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from '@env';

const supabaseUrl = SUPABASE_URL || VITE_SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY || VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Key is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // React Native has no navigator.locks, so auth-js falls back to a no-op lock.
        // Without this, a burst of parallel queries after sign-in each read the same
        // pre-rotation session from AsyncStorage and each call refresh with an already
        // rotated token. The first "Already Used" response is non-retryable, so auth-js
        // drops the session and emits SIGNED_OUT — the user is bounced back to the sign-in
        // screen seconds after a successful login.
        lock: processLock,
    },
});

AppState.addEventListener('change', (state) => {
    if (state === 'active') {
        supabase.auth.startAutoRefresh();
    } else {
        supabase.auth.stopAutoRefresh();
    }
});
