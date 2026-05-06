<script setup>
import { computed } from 'vue';
import { useI18n } from '../utils/i18n.js';
import AvailabilityCircle from './AvailabilityCircle.vue';
import BadgeList from './BadgeList.vue';
import HeartbeatBar from './HeartbeatBar.vue';

const { t } = useI18n();

const props = defineProps({
    monitor: { type: Object, required: true }
});

const emit = defineEmits(['showDetail']);

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
    <div class="monitor-card glass-card" @click="emit('showDetail', monitor)">
        <div class="card-header">
            <div class="card-header-left">
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
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                </a>
            </div>
            <div class="card-header-right">
                <AvailabilityCircle :value="monitor.uptime" :size="52" />
            </div>
        </div>

        <div class="card-badges">
            <BadgeList
                :tags="monitor.tags"
                :method="monitor.method"
                :type="monitor.type"
                :domain-expiry="monitor.domainExpiry"
                :cert-expiry="monitor.certExpiry"
            />
        </div>

        <div class="card-heartbeat">
            <HeartbeatBar
                :heartbeats="monitor.heartbeats"
                :current-latency="monitor.currentLatency"
                :average-latency="monitor.averageLatency"
            />
        </div>
    </div>
</template>

<style scoped>
.monitor-card {
    padding: 18px;
    cursor: pointer;
    animation: fadeIn 0.3s ease forwards;
}

.monitor-card:hover {
    transform: translateY(-1px);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
}

.card-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
}

.status-indicator {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
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
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    background: var(--color-accent-bg);
}

.card-header-right {
    flex-shrink: 0;
}

.card-badges {
    margin-bottom: 12px;
}

.card-heartbeat {
    margin-top: 4px;
}

@media (max-width: 480px) {
    .monitor-card {
        padding: 14px;
    }
    .monitor-name {
        font-size: 14px;
    }
}
</style>
