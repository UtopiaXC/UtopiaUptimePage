<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../utils/i18n.js';
import AvailabilityCircle from './AvailabilityCircle.vue';
import BadgeList from './BadgeList.vue';
import HeartbeatBar from './HeartbeatBar.vue';
import LatencyChart from './LatencyChart.vue';

const { t } = useI18n();

const props = defineProps({
    monitor: { type: Object, default: null }
});

const emit = defineEmits(['close']);

const statusClass = computed(() => props.monitor ? 'status-' + props.monitor.status : '');

const statusLabel = computed(() => {
    if (!props.monitor) return '';
    switch (props.monitor.status) {
        case 'online': return t('statusOnline');
        case 'offline': return t('statusOffline');
        case 'maintenance': return t('statusMaintenance');
        case 'retrying': return t('statusRetrying');
        case 'paused': return t('statusPaused');
        default: return t('statusUnknown');
    }
});

const statusIcon = computed(() => {
    if (!props.monitor) return '?';
    switch (props.monitor.status) {
        case 'online': return '✓';
        case 'offline': return '✕';
        case 'maintenance': return '⚙';
        case 'retrying': return '⟳';
        case 'paused': return '⏸';
        default: return '?';
    }
});

function handleKeydown(e) {
    if (e.key === 'Escape') emit('close');
}

onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
    document.body.style.overflow = 'hidden';
});

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
    document.body.style.overflow = '';
});

function handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
        emit('close');
    }
}
</script>

<template>
    <Teleport to="body">
        <div class="detail-overlay" @click="handleOverlayClick" v-if="monitor">
            <div class="detail-panel animate-slide-up">
                <div class="detail-header">
                    <button class="back-btn" @click="emit('close')">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        <span>{{ t('backToList') }}</span>
                    </button>
                    <h2 class="detail-title">{{ t('monitorDetail') }}</h2>
                </div>

                <div class="detail-body">
                    <!-- Status Hero -->
                    <div class="detail-hero" :class="statusClass">
                        <div class="hero-left">
                            <span class="hero-status-icon" :class="statusClass">{{ statusIcon }}</span>
                            <div class="hero-info">
                                <h3 class="hero-name">{{ monitor.name }}</h3>
                                <span class="hero-status-text" :class="statusClass">{{ statusLabel }}</span>
                            </div>
                            <a
                                v-if="monitor.url"
                                class="hero-link"
                                :href="monitor.url"
                                target="_blank"
                                rel="noopener noreferrer"
                                :title="t('visitSite')"
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                    <polyline points="15 3 21 3 21 9"/>
                                    <line x1="10" y1="14" x2="21" y2="3"/>
                                </svg>
                            </a>
                        </div>
                        <div class="hero-right">
                            <AvailabilityCircle :value="monitor.uptime" :size="72" :stroke-width="5" />
                        </div>
                    </div>

                    <!-- Badges -->
                    <div class="detail-section" v-if="monitor.tags?.length || monitor.method || monitor.type || monitor.domainExpiry !== null || monitor.certExpiry !== null">
                        <BadgeList
                            :tags="monitor.tags"
                            :method="monitor.method"
                            :type="monitor.type"
                            :domain-expiry="monitor.domainExpiry"
                            :cert-expiry="monitor.certExpiry"
                        />
                    </div>

                    <!-- Heartbeat Bars -->
                    <div class="detail-section">
                        <HeartbeatBar
                            :heartbeats="monitor.heartbeats"
                            :current-latency="monitor.currentLatency"
                            :average-latency="monitor.averageLatency"
                        />
                    </div>

                    <!-- Latency Chart -->
                    <div class="detail-section">
                        <h4 class="section-title">{{ t('latencyChart') }}</h4>
                        <LatencyChart :heartbeats="monitor.heartbeats" />
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.detail-overlay {
    position: fixed;
    inset: 0;
    background: var(--bg-overlay);
    z-index: 1000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 40px 20px;
    overflow-y: auto;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
}

.detail-panel {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-xl);
    width: 100%;
    max-width: 720px;
    box-shadow: var(--shadow-xl);
}

.detail-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-primary);
    background: var(--bg-tertiary);
    border-radius: calc(var(--radius-xl) - 1px) calc(var(--radius-xl) - 1px) 0 0;
}

.back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    transition: all var(--transition-fast);
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
}

.back-btn:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
}

.detail-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
}

.detail-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.detail-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px;
    border-radius: var(--radius-lg);
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
}

.hero-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
}

.hero-status-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    flex-shrink: 0;
}

.hero-status-icon.status-online {
    background: var(--color-success-bg);
    color: var(--color-success);
    border: 1px solid var(--color-success-border);
}

.hero-status-icon.status-offline {
    background: var(--color-danger-bg);
    color: var(--color-danger);
    border: 1px solid var(--color-danger-border);
}

.hero-status-icon.status-maintenance {
    background: var(--color-info-bg);
    color: var(--color-info);
    border: 1px solid var(--color-info-border);
}

.hero-status-icon.status-retrying {
    background: var(--color-warning-bg);
    color: var(--color-warning);
    border: 1px solid var(--color-warning-border);
}

.hero-status-icon.status-paused,
.hero-status-icon.status-unknown {
    background: var(--color-muted-bg);
    color: var(--color-muted);
    border: 1px solid var(--border-primary);
}

.hero-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.hero-name {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.hero-status-text {
    font-size: 13px;
    font-weight: 600;
}

.hero-status-text.status-online { color: var(--color-success); }
.hero-status-text.status-offline { color: var(--color-danger); }
.hero-status-text.status-maintenance { color: var(--color-info); }
.hero-status-text.status-retrying { color: var(--color-warning); }
.hero-status-text.status-paused,
.hero-status-text.status-unknown { color: var(--color-muted); }

.hero-link {
    display: flex;
    align-items: center;
    color: var(--text-tertiary);
    flex-shrink: 0;
    padding: 4px;
    border-radius: var(--radius-sm);
    transition: all var(--transition-fast);
}

.hero-link:hover {
    color: var(--color-accent);
    background: var(--color-accent-bg);
}

.hero-right {
    flex-shrink: 0;
}

.detail-section {
    /* Section wrapper */
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 10px;
}

@media (max-width: 768px) {
    .detail-overlay {
        padding: 40px 0 0 0;
        align-items: flex-end;
    }
    .detail-panel {
        border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        margin-top: auto;
    }
    .hero-name {
        font-size: 16px;
    }
}
</style>
