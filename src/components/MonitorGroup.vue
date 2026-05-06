<script setup>
import { ref } from 'vue';
import { useI18n } from '../utils/i18n.js';
import MonitorCard from './MonitorCard.vue';
import MonitorListItem from './MonitorListItem.vue';

const { t } = useI18n();

const props = defineProps({
    groupName: { type: String, default: '' },
    monitors: { type: Array, default: () => [] },
    viewMode: { type: String, default: 'card' }
});

const emit = defineEmits(['showDetail']);

const isCollapsed = ref(false);

function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value;
}

const displayName = props.groupName || t('defaultGroup');
</script>

<template>
    <div class="monitor-group animate-slide-up">
        <button class="group-header" @click="toggleCollapse">
            <div class="group-header-left">
                <svg
                    class="collapse-icon"
                    :class="{ collapsed: isCollapsed }"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
                <span class="group-name">{{ displayName }}</span>
                <span class="group-count">{{ monitors.length }}</span>
            </div>
        </button>

        <div class="group-content" :class="{ collapsed: isCollapsed }">
            <div v-if="viewMode === 'card'" class="card-grid">
                <MonitorCard
                    v-for="monitor in monitors"
                    :key="monitor.id"
                    :monitor="monitor"
                    @show-detail="(m) => emit('showDetail', m)"
                />
            </div>
            <div v-else class="list-grid">
                <MonitorListItem
                    v-for="monitor in monitors"
                    :key="monitor.id"
                    :monitor="monitor"
                    @show-detail="(m) => emit('showDetail', m)"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.monitor-group {
    margin-bottom: 20px;
}

.group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 4px;
    cursor: pointer;
    border-radius: var(--radius-md);
    transition: background var(--transition-fast);
}

.group-header:hover {
    background: var(--bg-tertiary);
}

.group-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.collapse-icon {
    transition: transform var(--transition-base);
    color: var(--text-tertiary);
    flex-shrink: 0;
}

.collapse-icon.collapsed {
    transform: rotate(-90deg);
}

.group-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}

.group-count {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
    border: 1px solid var(--border-primary);
}

.group-content {
    overflow: hidden;
    max-height: 10000px;
    transition: max-height 0.4s ease, opacity 0.3s ease;
    opacity: 1;
}

.group-content.collapsed {
    max-height: 0;
    opacity: 0;
}

.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 12px;
    padding-top: 8px;
}

.list-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 8px;
}

@media (max-width: 768px) {
    .card-grid {
        grid-template-columns: 1fr;
    }
}
</style>
