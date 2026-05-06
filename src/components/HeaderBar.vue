<script setup>
import { useI18n } from '../utils/i18n.js';
import { useTheme } from '../utils/theme.js';

const { t, currentLanguageCode, setLanguage, supportedLanguages } = useI18n();
const { currentThemeMode, cycleTheme } = useTheme();

const props = defineProps({
    title: { type: String, default: 'Status Dashboard' }
});

const themeIcons = {
    auto: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm6 11h4m-2-2v2',
    light: 'M12 3v1m0 16v1m-8-9H3m18 0h-1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
    dark: 'M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z'
};

function handleLanguageChange(event) {
    setLanguage(event.target.value);
}
</script>

<template>
    <header class="header-bar">
        <div class="header-left">
            <h1 class="header-title">{{ title }}</h1>
        </div>
        <div class="header-right">
            <button
                class="header-btn theme-btn"
                @click="cycleTheme"
                :title="t('theme' + currentThemeMode.charAt(0).toUpperCase() + currentThemeMode.slice(1))"
                :aria-label="t('theme' + currentThemeMode.charAt(0).toUpperCase() + currentThemeMode.slice(1))"
            >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path :d="themeIcons[currentThemeMode]" />
                </svg>
                <span class="header-btn-label">{{ t('theme' + currentThemeMode.charAt(0).toUpperCase() + currentThemeMode.slice(1)) }}</span>
            </button>

            <div class="language-selector-wrapper">
                <svg class="lang-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
                </svg>
                <select
                    class="language-selector"
                    :value="currentLanguageCode"
                    @change="handleLanguageChange"
                    :aria-label="t('language')"
                >
                    <option
                        v-for="lang in supportedLanguages"
                        :key="lang.code"
                        :value="lang.code"
                    >
                        {{ lang.label }}
                    </option>
                </select>
            </div>
        </div>
    </header>
</template>

<style scoped>
.header-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height);
    padding: 0;
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg-glass);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-primary);
    margin: 0 -24px;
    padding: 0 24px;
}

@media (max-width: 768px) {
    .header-bar {
        margin: 0 -16px;
        padding: 0 16px;
    }
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.header-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: linear-gradient(135deg, var(--text-primary), var(--color-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.header-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    border-radius: var(--radius-md);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    transition: all var(--transition-fast);
    white-space: nowrap;
}

.header-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-hover);
}

.header-btn svg {
    flex-shrink: 0;
}

.header-btn-label {
    font-size: 12px;
}

@media (max-width: 480px) {
    .header-btn-label {
        display: none;
    }
    .header-btn {
        padding: 7px 8px;
    }
}

.language-selector-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.lang-icon {
    position: absolute;
    left: 10px;
    pointer-events: none;
    color: var(--text-secondary);
    z-index: 1;
}

.language-selector {
    appearance: none;
    -webkit-appearance: none;
    padding: 7px 28px 7px 32px;
    border-radius: var(--radius-md);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all var(--transition-fast);
    outline: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
}

.language-selector:hover {
    background-color: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-hover);
}

.language-selector:focus {
    border-color: var(--color-accent-border);
    box-shadow: 0 0 0 3px var(--color-accent-bg);
}
</style>
