/// <reference types="chrome" />

const WEB_APP_STORAGE_KEY = 'sb-ogduktbkmjfvygzhvqdr-auth-token';
const EXTENSION_STORAGE_KEY = 'habit-tracker-session';

function syncSessionToExtension(value: string | null) {
    if (value) {
        chrome.storage.local.set({ [EXTENSION_STORAGE_KEY]: value });
    } else {
        chrome.storage.local.remove(EXTENSION_STORAGE_KEY);
    }
}

// On load: sync whatever session is already in localStorage (covers "already logged in" case)
const existing = localStorage.getItem(WEB_APP_STORAGE_KEY);
syncSessionToExtension(existing);

// Watch for sign-in / sign-out in other tabs
window.addEventListener('storage', (event) => {
    if (event.key === WEB_APP_STORAGE_KEY) {
        syncSessionToExtension(event.newValue);
    }
});

// Watch for sign-in in the same tab (sent by the web app on ?source=extension flow)
window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'HABIT_EXTENSION_LOGIN' && event.data.session) {
        syncSessionToExtension(JSON.stringify(event.data.session));
    }
});
