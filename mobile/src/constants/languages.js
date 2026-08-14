// Shared language list. This was previously copy-pasted into MainScreen's settings
// sheet and OnboardingModal, which meant adding a locale required remembering both.
export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'zh', label: '中文' },
];

export const languageLabel = (code) =>
    LANGUAGES.find(l => l.code === code)?.label || String(code || '').toUpperCase();
