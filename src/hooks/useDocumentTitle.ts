import { useEffect } from 'react';

const DEFAULT_TITLE = 'HabiCard — Build Habits That Stick';

// Vite/React SPA with no server-side rendering — <title> otherwise stays
// hardcoded to whatever index.html shipped for every route.
export function useDocumentTitle(title: string, description?: string) {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = title;

        let descriptionTag: HTMLMetaElement | null = null;
        let previousDescription: string | null = null;
        if (description) {
            descriptionTag = document.querySelector('meta[name="description"]');
            if (descriptionTag) {
                previousDescription = descriptionTag.getAttribute('content');
                descriptionTag.setAttribute('content', description);
            }
        }

        return () => {
            document.title = previousTitle;
            if (descriptionTag && previousDescription !== null) {
                descriptionTag.setAttribute('content', previousDescription);
            }
        };
    }, [title, description]);
}

export { DEFAULT_TITLE };
