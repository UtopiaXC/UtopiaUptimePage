<script setup>
import { computed } from 'vue';
import { useI18n } from '../utils/i18n.js';

const { t } = useI18n();

const props = defineProps({
    monitors: { type: Array, default: () => [] },
    isPaused: { type: Boolean, default: false },
    viewMode: { type: String, default: 'card' },
    loading: { type: Boolean, default: false }
});

const emit = defineEmits(['togglePause', 'refresh', 'toggleView']);

const overallStatus = computed(() => {
    if (props.monitors.length === 0) return 'unknown';
    const onlineCount = props.monitors.filter(m => m.status === 'online').length;
    if (onlineCount === props.monitors.length) return 'all-ok';
    if (onlineCount === 0) return 'all-down';
    return 'partial';
});

const statusColor = computed(() => {
    switch (overallStatus.value) {
        case 'all-ok': return 'var(--color-success)';
        case 'partial': return 'var(--color-warning)';
        case 'all-down': return 'var(--color-danger)';
        default: return 'var(--color-muted)';
    }
});

const statusBg = computed(() => {
    switch (overallStatus.value) {
        case 'all-ok': return 'var(--color-success-bg)';
        case 'partial': return 'var(--color-warning-bg)';
        case 'all-down': return 'var(--color-danger-bg)';
        default: return 'var(--color-muted-bg)';
    }
});

const statusBorder = computed(() => {
    switch (overallStatus.value) {
        case 'all-ok': return 'var(--color-success-border)';
        case 'partial': return 'var(--color-warning-border)';
        case 'all-down': return 'var(--color-danger-border)';
        default: return 'var(--border-primary)';
    }
});

const statusText = computed(() => {
    switch (overallStatus.value) {
        case 'all-ok': return t('allOperational');
        case 'partial': return t('partialOutage');
        case 'all-down': return t('allDown');
        default: return t('loading');
    }
});
</script>

<template>
    <div class="status-bar" :style="{ '--status-color': statusColor, '--status-bg': statusBg, '--status-border': statusBorder }">
        <div class="status-info">
            <span class="status-dot" :class="{ 'pulse-dot': overallStatus === 'all-ok' }"></span>
            <span class="status-text">{{ statusText }}</span>
        </div>
        <div class="status-actions">
            <button
                class="action-btn"
                :class="{ active: isPaused }"
                @click="emit('togglePause')"
                :title="isPaused ? t('resume') : t('pause')"
            >
                <svg v-if="!isPaused" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="4" width="4" height="16"/>
                    <rect x="14" y="4" width="4" height="16"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none">
                    <polygon points="5,3 19,12 5,21"/>
                </svg>
            </button>

            <button
                class="action-btn"
                @click="emit('refresh')"
                :title="t('refresh')"
                :class="{ spinning: loading }"
            >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 4v6h-6M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
            </button>

            <button
                class="action-btn"
                @click="emit('toggleView')"
                :title="viewMode === 'card' ? t('viewList') : t('viewCard')"
            >
                <svg v-if="viewMode === 'card'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="1" y="3" width="7" height="7"/>
                    <rect x="10" y="3" width="7" height="7"/>
                    <rect x="1" y="12" width="7" height="7"/>
                    <rect x="10" y="12" width="7" height="7"/>
                </svg>
            </button>
        </div>
    </div>
</template>

<style scoped>
.status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    background: var(--status-bg);
    border: 1px solid var(--status-border);
    border-radius: var(--radius-lg);
    margin: 8px 0 16px;
    transition: all var(--transition-base);
}

.status-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--status-color);
    flex-shrink: 0;
}

.pulse-dot {
    animation: pulse-ring 2s ease-in-out infinite;
    box-shadow: 0 0 0 0 var(--status-color);
}

@keyframes pulse-ring {
    0% { box-shadow: 0 0 0 0 var(--status-color); }
    50% { box-shadow: 0 0 0 6px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
}

.status-text {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}

.status-actions {
    display: flex;
    align-items: center;
    gap: 4px;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    transition: all var(--transition-fast);
    background: transparent;
}

.action-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
}

.action-btn.active {
    color: var(--color-warning);
}

.action-btn.spinning svg {
    animation: spin 1s linear infinite;
}

@media (max-width: 480px) {
    .status-bar {
        padding: 10px 14px;
    }
    .status-text {
        font-size: 13px;
    }
    .action-btn {
        width: 30px;
        height: 30px;
    }
}
</style>
