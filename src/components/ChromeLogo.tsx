import React from 'react';

interface ChromeLogoProps {
    size?: number;
    className?: string;
}

// Full-color Chrome logo (not the monochrome lucide "Chrome" icon) — used
// wherever we link out to the Chrome Web Store listing, so it reads as the
// actual browser mark rather than a generic outline glyph.
export const ChromeLogo: React.FC<ChromeLogoProps> = ({ size = 24, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className={className}
        aria-hidden="true"
    >
        <circle cx="24" cy="24" r="24" fill="#fff" />
        <path d="M24 8a16 16 0 0 1 13.86 8H24a8 8 0 0 0-7.6 5.5L8.53 13.87A16 16 0 0 1 24 8Z" fill="#EA4335" />
        <path d="M8.53 13.87 16.4 21.5A8 8 0 0 0 20 30.93L12.6 43.6A16 16 0 0 1 8.53 13.87Z" fill="#FBBC05" />
        <path d="M20 30.93A8 8 0 0 0 30.93 27.5L38.4 40.13A16 16 0 0 1 12.6 43.6Z" fill="#34A853" />
        <path d="M37.86 16H24a8 8 0 0 1 6.93 11.5l7.47 12.63A16 16 0 0 0 37.86 16Z" fill="#4285F4" />
        <circle cx="24" cy="24" r="8" fill="#fff" />
        <circle cx="24" cy="24" r="6.4" fill="#4285F4" />
    </svg>
);
