import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

interface ThemeColors {
    // Brand
    primary: string;

    // Backgrounds
    background: string;
    backgroundSecondary: string;
    card: string;
    cardSecondary: string;

    // Text
    text: string;
    textSecondary: string;
    textMuted: string;

    // Borders
    border: string;
    borderLight: string;

    // Components
    navbarBackground: string;
    sidebarBackground: string;
    tabBarBackground: string;
    inputBackground: string;

    // Status bar
    statusBarStyle: 'light' | 'dark';

    // Blur tints
    blurTint: 'light' | 'dark';

    // Glassmorphism overlays
    glassBackground: string;
    glassBackgroundSecondary: string;
    glassBorder: string;
    error: string;
}

interface ThemeContextType {
    isDarkMode: boolean;
    theme: ThemeMode;
    colors: ThemeColors;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
}

const THEME_STORAGE_KEY = '@app_theme';

// Light theme colors — Alice Blue palette
const lightColors: ThemeColors = {
    primary: '#0E6F6A',

    background: '#F0F8FF',           // Alice Blue — main page background
    backgroundSecondary: '#E2EFF9',  // slightly deeper Alice Blue for sections
    card: '#F8FCFF',                 // near-white Alice Blue card surface
    cardSecondary: '#DCEAf5',        // muted Alice Blue card variant

    text: '#0A0C11',
    textSecondary: 'rgba(10, 12, 17, 0.70)',
    textMuted: '#5B7A99',

    border: '#C8DCED',
    borderLight: '#DAEAF5',

    navbarBackground: 'rgba(240, 248, 255, 0.72)',  // Alice Blue blur navbar
    sidebarBackground: '#E2EFF9',
    tabBarBackground: '#F0F8FF',
    inputBackground: '#E8F3FB',

    statusBarStyle: 'dark',
    blurTint: 'light',

    // Glassmorphism - Alice Blue mode
    glassBackground: 'rgba(240, 248, 255, 0.45)',
    glassBackgroundSecondary: 'rgba(248, 252, 255, 0.60)',
    glassBorder: 'rgba(200, 220, 237, 0.50)',
    error: '#EF4444',
};

// Dark theme colors
const darkColors: ThemeColors = {
    primary: '#0E6F6A', // Keep same or adjust for dark mode visibility

    background: '#0F1115',
    backgroundSecondary: '#1A1D24',
    card: '#1E222A',
    cardSecondary: '#252A35',

    text: '#ECEDEE',
    textSecondary: '#A0A5AD',
    textMuted: '#6B7280',

    border: '#2D3340',
    borderLight: '#252A35',

    navbarBackground: 'rgba(30, 34, 42, 0.7)',
    sidebarBackground: '#1A1D24',
    tabBarBackground: '#1E222A',
    inputBackground: '#252A35',

    statusBarStyle: 'light',
    blurTint: 'dark',

    // Glassmorphism - dark mode (preserved with darker tints)
    glassBackground: 'rgba(30, 34, 42, 0.6)',
    glassBackgroundSecondary: 'rgba(37, 42, 53, 0.7)',
    glassBorder: 'rgba(45, 51, 64, 0.5)',
    error: '#F87171',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<ThemeMode>('light');

    // Load persisted theme on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme === 'light' || savedTheme === 'dark') {
                    setThemeState(savedTheme);
                }
            } catch (error) {
                console.log('Error loading theme:', error);
            }
        };
        loadTheme();
    }, []);

    const setTheme = async (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (error) {
            console.log('Error saving theme:', error);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const isDarkMode = theme === 'dark';
    const colors = isDarkMode ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDarkMode, theme, colors, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Export color constants for reference
export { darkColors, lightColors };
