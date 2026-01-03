/**
 * Custom storage adapter for Supabase to use chrome.storage.local
 */
export const customStorage = {
    getItem: async (key: string): Promise<string | null> => {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key] || null);
            });
        });
    },
    setItem: async (key: string, value: string): Promise<void> => {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, () => {
                resolve();
            });
        });
    },
    removeItem: async (key: string): Promise<void> => {
        return new Promise((resolve) => {
            chrome.storage.local.remove([key], () => {
                resolve();
            });
        });
    },
};
