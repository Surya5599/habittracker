import { useState, useEffect } from 'react';
import { THEMES } from '../constants';
import { Theme } from '../types';

export const useTheme = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        const saved = localStorage.getItem('habit_theme');
        return saved ? JSON.parse(saved) : THEMES[0];
    });

    useEffect(() => {
        localStorage.setItem('habit_theme', JSON.stringify(theme));
    }, [theme]);

    return { theme, setTheme, THEMES };
};
