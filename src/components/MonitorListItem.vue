<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../utils/i18n.js';
import AvailabilityCircle from './AvailabilityCircle.vue';
import BadgeList from './BadgeList.vue';
import HeartbeatBar from './HeartbeatBar.vue';

const { t } = useI18n();

const props = defineProps({
    monitor: { type: Object, required: true }
});

const emit = defineEmits(['showDetail']);

const containerRef = ref(null);
const containerWidth = ref(1000);
const observer = ref(null);

onMounted(() => {
    if (containerRef.value) {
        containerWidth.value = containerRef.value.offsetWidth;
        observer.value = new ResizeObserver(entries => {
            for (const entry of entries) {
                containerWidth.value = entry.contentRect.width;
            }
        });
        observer.value.observe(containerRef.value);
    }
});

onUnmounted(() => {
    if (observer.value) observer.value.disconnect();
});

const maxVisibleBadges = computed(() => {
    if (containerWidth.value > 900) return -1;
    if (containerWidth.value > 700) return 4;
    if (containerWidth.value > 500) return 2;
    return 1;
});

const statusClass = computed(() => 'status-' + props.monitor.status);

const statusIcon = computed(() => {
    switch (props.monitor.status) {
        case 'online': return '✓';
        case 'offline': return '✕';
        case 'maintenance': return '⚙';
        case 'retrying': return '⟳';
        case 'paused': return '⏸';
        default: return '?';
    }
});
</script>

<template>
    <div class="monitor-list-item glass-card" ref="containerRef" @click="emit('showDetail', monitor)">
        <div class="list-top">
            <div class="list-top-left">
                <span class="status-indicator" :class="statusClass">{{ statusIcon }}</span>
                <span class="monitor-name">{{ monitor.name }}</span>
                <a
                    v-if="monitor.url"
                    class="visit-link"
                    :href="monitor.url"
                    :title="t('visitSite')"
                    @click.stop
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                </a>
                <div class="list-badges">
                    <BadgeList
                        :tags="monitor.tags"
                        :method="monitor.method"
                        :type="monitor.type"
                        :domain-expiry="monitor.domainExpiry"
                        :cert-expiry="monitor.certExpiry"
                        :max-visible="maxVisibleBadges"
                        :compact="true"
                    />
                </div>
            </div>
            <div class="list-top-right">
                <AvailabilityCircle :value="monitor.uptime" :size="42" :stroke-width="3" />
            </div>
        </div>
        <div class="list-bottom">
            <HeartbeatBar
                :heartbeats="monitor.heartbeats"
                :current-latency="monitor.currentLatency"
                :average-latency="monitor.averageLatency"
                :show-legend="false"
            />
        </div>
    </div>
</template>

<style scoped>
.monitor-list-item {
    padding: 14px 18px;
    cursor: pointer;
    animation: fadeIn 0.3s ease forwards;
}

.monitor-list-item:hover {
    transform: translateY(-1px);
}

.list-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
}

.list-top-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
    overflow: hidden;
}

.status-indicator {
    width: 22px;
    height: 22px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
}

.status-online {
    background: var(--color-success-bg);
    color: var(--color-success);
    border: 1px solid var(--color-success-border);
}

.status-offline {
    background: var(--color-danger-bg);
    color: var(--color-danger);
    border: 1px solid var(--color-danger-border);
}

.status-maintenance {
    background: var(--color-info-bg);
    color: var(--color-info);
    border: 1px solid var(--color-info-border);
}

.status-retrying {
    background: var(--color-warning-bg);
    color: var(--color-warning);
    border: 1px solid var(--color-warning-border);
}

.status-paused, .status-unknown {
    background: var(--color-muted-bg);
    color: var(--color-muted);
    border: 1px solid var(--border-primary);
}

.monitor-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
    max-width: 200px;
}

.visit-link {
    display: flex;
    align-items: center;
    color: var(--text-tertiary);
    flex-shrink: 0;
    padding: 2px;
    border-radius: var(--radius-xs);
    transition: all var(--transition-fast);
}

.visit-link:hover {
    color: var(--color-accent);
}

.list-badges {
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.list-top-right {
    flex-shrink: 0;
}

.list-bottom {
    border-top: 1px solid var(--border-secondary);
    padding-top: 10px;
}

@media (max-width: 480px) {
    .monitor-list-item {
        padding: 12px 14px;
    }
    .monitor-name {
        font-size: 13px;
        max-width: 140px;
    }
    .list-badges {
        display: none;
    }
}
</style>
