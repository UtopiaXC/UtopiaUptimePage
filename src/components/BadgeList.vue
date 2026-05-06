<script setup>
import { computed, ref } from 'vue';
import { useI18n } from '../utils/i18n.js';

const { t } = useI18n();

const props = defineProps({
    tags: { type: Array, default: () => [] },
    method: { type: String, default: null },
    type: { type: String, default: null },
    domainExpiry: { type: Number, default: null },
    certExpiry: { type: Number, default: null },
    maxVisible: { type: Number, default: -1 },
    compact: { type: Boolean, default: false }
});

const showOverflowTooltip = ref(false);

const allBadges = computed(() => {
    const badges = [];
    if (props.type) {
        badges.push({ label: props.type, variant: 'info', icon: 'type' });
    }
    if (props.method) {
        badges.push({ label: props.method, variant: 'accent', icon: 'method' });
    }
    if (props.tags && props.tags.length > 0) {
        for (const tag of props.tags) {
            badges.push({ label: tag, variant: 'default', icon: 'tag' });
        }
    }
    if (props.domainExpiry !== null) {
        const variant = props.domainExpiry <= 7 ? 'danger' : props.domainExpiry <= 30 ? 'warning' : 'success';
        badges.push({ label: `${t('domainExpiry')}: ${props.domainExpiry}${t('daysLeft')}`, variant, icon: 'domain' });
    }
    if (props.certExpiry !== null) {
        const variant = props.certExpiry <= 7 ? 'danger' : props.certExpiry <= 30 ? 'warning' : 'success';
        badges.push({ label: `${t('certExpiry')}: ${props.certExpiry}${t('daysLeft')}`, variant, icon: 'cert' });
    }
    return badges;
});

const visibleBadges = computed(() => {
    if (props.maxVisible < 0 || props.maxVisible >= allBadges.value.length) {
        return allBadges.value;
    }
    return allBadges.value.slice(0, props.maxVisible);
});

const hiddenBadges = computed(() => {
    if (props.maxVisible < 0 || props.maxVisible >= allBadges.value.length) {
        return [];
    }
    return allBadges.value.slice(props.maxVisible);
});

const hiddenCount = computed(() => hiddenBadges.value.length);
</script>

<template>
    <div class="badge-list" :class="{ compact }" v-if="allBadges.length > 0">
        <span
            v-for="(badge, index) in visibleBadges"
            :key="index"
            class="badge"
            :class="'badge-' + badge.variant"
        >
            {{ badge.label }}
        </span>
        <span
            v-if="hiddenCount > 0"
            class="badge badge-overflow tooltip-container"
            @mouseenter="showOverflowTooltip = true"
            @mouseleave="showOverflowTooltip = false"
        >
            +{{ hiddenCount }}
            <span class="tooltip-content overflow-tooltip" v-show="showOverflowTooltip">
                <span v-for="(badge, index) in hiddenBadges" :key="index" class="overflow-badge">
                    {{ badge.label }}
                </span>
            </span>
        </span>
    </div>
</template>

<style scoped>
.badge-list {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-items: center;
}

.badge-list.compact {
    flex-wrap: nowrap;
    overflow: hidden;
}

.badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    line-height: 1.5;
    transition: all var(--transition-fast);
}

.badge-default {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-primary);
}

.badge-info {
    background: var(--color-info-bg);
    color: var(--color-info);
    border: 1px solid var(--color-info-border);
}

.badge-accent {
    background: var(--color-accent-bg);
    color: var(--color-accent);
    border: 1px solid var(--color-accent-border);
}

.badge-success {
    background: var(--color-success-bg);
    color: var(--color-success);
    border: 1px solid var(--color-success-border);
}

.badge-warning {
    background: var(--color-warning-bg);
    color: var(--color-warning);
    border: 1px solid var(--color-warning-border);
}

.badge-danger {
    background: var(--color-danger-bg);
    color: var(--color-danger);
    border: 1px solid var(--color-danger-border);
}

.badge-overflow {
    background: var(--bg-hover);
    color: var(--text-secondary);
    border: 1px solid var(--border-primary);
    cursor: pointer;
    position: relative;
}

.badge-overflow:hover {
    background: var(--bg-active);
}

.overflow-tooltip {
    white-space: normal;
    max-width: 280px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
}

.overflow-badge {
    display: inline-block;
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-xs);
    font-size: 11px;
}
</style>
