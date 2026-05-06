<script setup>
import { computed } from 'vue';
import { renderMarkdown } from '../utils/markdown.js';
import { useI18n } from '../utils/i18n.js';

const { t } = useI18n();

const props = defineProps({
    content: { type: String, default: '' }
});

const renderedContent = computed(() => renderMarkdown(props.content));
const hasContent = computed(() => !!props.content && props.content.trim().length > 0);
</script>

<template>
    <div v-if="hasContent" class="announcement-banner animate-fade-in">
        <div class="announcement-header">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="announcement-title">{{ t('announcement') }}</span>
        </div>
        <div class="announcement-content" v-html="renderedContent"></div>
    </div>
</template>

<style scoped>
.announcement-banner {
    padding: 14px 18px;
    background: var(--color-accent-bg);
    border: 1px solid var(--color-accent-border);
    border-radius: var(--radius-lg);
    margin-bottom: 16px;
}

.announcement-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: var(--color-accent);
}

.announcement-title {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.announcement-content {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-secondary);
}

.announcement-content :deep(a) {
    color: var(--color-accent);
}

.announcement-content :deep(strong) {
    color: var(--text-primary);
    font-weight: 600;
}
</style>
