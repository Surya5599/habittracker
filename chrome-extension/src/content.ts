/// <reference types="chrome" />

// Listen for messages from the web app
window.addEventListener("message", (event) => {
    // We only accept messages from ourselves
    if (event.source !== window) return;

    if (event.data.type === "HABIT_EXTENSION_LOGIN" && event.data.session) {
        console.log("Extension received session from web app", event.data.session);

        // Save session to chrome.storage.local
        // The key must match what supabase-js expects if we were using it directly, but since we are using customStorage adapter:
        // We are just storing the session data provided by the web app.
        // However, Supabase's setSession takes the session object.
        // But here we are "receiving" it. Use chrome.storage to persist it so the popup picks it up.
        // The Supabase client in the popup (using customStorage) will look for:
        // `sb-<url>-auth-token` usually? Or just what we tell it?
        // Wait, Supabase client by default uses a specific key format.
        // Let's verify what key Supabase uses. It's usually `sb-${projectId}-auth-token`.
        // BUT we can't easily know the project ID here without hardcoding or reading env.
        // TRICK: The web app should send the *entire* local storage key-value pair or we should standardize the key.

        // BETTER APPROACH:
        // In `customStorage.ts`, we implemented `getItem` and `setItem`.
        // Supabase will call `setItem` with a key like `sb-<anon_key_part>-auth-token`.
        // To make this robust, the WEB APP should literally send the key it uses, OR we just save *any* session data.

        // ACTUALLY: The easiest way is for the Web App to just send the session object.
        // And we store it under a KNOWN key that our Extension's Supabase client is configured to use?
        // Supabase client config `storageKey` option can override the default key!
        // So in `supabase.ts`, we should set `auth: { storageKey: 'habit-tracker-session', ... }`.
        // Then here in content script, we save to `habit-tracker-session`.

        const STORAGE_KEY = 'habit-tracker-session';

        chrome.storage.local.set({ [STORAGE_KEY]: JSON.stringify(event.data.session) }, () => {
            console.log("Session saved to extension storage.");
            // Optional: Notify popup if open?
            chrome.runtime.sendMessage({ type: "SESSION_UPDATED" });
        });
    }
});
