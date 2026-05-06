import { ref, watch } from 'vue';

const STORAGE_KEY = 'dashboard_theme_preference';
const THEME_CYCLE = ['auto', 'light', 'dark'];

const currentThemeMode = ref(localStorage.getItem(STORAGE_KEY) || 'auto');

function applyThemeToDocument(themeValue) {
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark');

    if (themeValue === 'dark') {
        html.classList.add('theme-dark');
    } else if (themeValue === 'light') {
        html.classList.add('theme-light');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    }
}

// Apply initial theme immediately
applyThemeToDocument(currentThemeMode.value);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentThemeMode.value === 'auto') {
        applyThemeToDocument('auto');
    }
});

export function useTheme() {
    const setTheme = (mode) => {
        currentThemeMode.value = mode;
        localStorage.setItem(STORAGE_KEY, mode);
        applyThemeToDocument(mode);
    };

    const cycleTheme = () => {
        const currentIndex = THEME_CYCLE.indexOf(currentThemeMode.value);
        const nextIndex = (currentIndex + 1) % THEME_CYCLE.length;
        setTheme(THEME_CYCLE[nextIndex]);
    };

    watch(currentThemeMode, applyThemeToDocument);

    return {
        currentThemeMode,
        setTheme,
        cycleTheme
    };
}