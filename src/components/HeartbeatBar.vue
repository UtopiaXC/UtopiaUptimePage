<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../utils/i18n.js';
import { aggregateHeartbeats } from '../utils/api.js';

const { t } = useI18n();

const props = defineProps({
    heartbeats: { type: Array, default: () => [] },
    currentLatency: { type: Number, default: 0 },
    averageLatency: { type: Number, default: 0 },
    showLatencyInfo: { type: Boolean, default: true },
    showLegend: { type: Boolean, default: true }
});

const hoveredIndex = ref(-1);
const tooltipStyle = ref({});
const containerRef = ref(null);
const containerWidth = ref(400);
let resizeObserver = null;

const BAR_WIDTH = 5;   // px per bar (including gap)
const BAR_GAP = 2;

onMounted(() => {
    if (containerRef.value) {
        containerWidth.value = containerRef.value.offsetWidth;
        resizeObserver = new ResizeObserver(entries => {
            containerWidth.value = entries[0].contentRect.width;
        });
        resizeObserver.observe(containerRef.value);
    }
});

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect();
});

const barCount = computed(() => {
    return Math.max(10, Math.floor(containerWidth.value / BAR_WIDTH));
});

const aggregatedBars = computed(() => {
    return aggregateHeartbeats(props.heartbeats, barCount.value);
});

const statusColors = {
    online: 'var(--bar-online)',
    offline: 'var(--bar-offline)',
    maintenance: 'var(--bar-maintenance)',
    retrying: 'var(--bar-retrying)',
    unknown: 'var(--bar-unknown)',
    paused: 'var(--color-muted)'
};

const statusLabels = computed(() => ({
    online: t('online'),
    offline: t('offline'),
    maintenance: t('maintenance'),
    retrying: t('retrying')
}));

const firstTime = computed(() => {
    const bars = aggregatedBars.value;
    for (const b of bars) {
        if (b.time) return formatTime(b.time);
    }
    return '';
});

const lastTime = computed(() => {
    const bars = aggregatedBars.value;
    for (let i = bars.length - 1; i >= 0; i--) {
        if (bars[i].time) return formatTime(bars[i].time);
    }
    return '';
});

function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFullTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function handleBarHover(index, event) {
    hoveredIndex.value = index;
    const rect = event.target.getBoundingClientRect();
    const top = rect.top - 8;
    const left = rect.left + rect.width / 2;
    tooltipStyle.value = { 
        position: 'fixed',
        top: `${top}px`, 
        left: `${left}px`, 
        transform: 'translate(-50%, -100%)' 
    };
}

function handleBarLeave() {
    hoveredIndex.value = -1;
}

function getStatusLabel(status) {
    return statusLabels.value[status] || status;
}
</script>

<template>
    <div class="heartbeat-section" ref="containerRef">
        <div class="heartbeat-header" v-if="showLatencyInfo || showLegend">
            <div class="latency-info" v-if="showLatencyInfo">
                <span class="latency-item">
                    <span class="latency-label">{{ t('currentLatency') }}</span>
                    <span class="latency-value">{{ currentLatency }}{{ t('milliseconds') }}</span>
                </span>
                <span class="latency-divider">|</span>
                <span class="latency-item">
                    <span class="latency-label">{{ t('averageLatency') }}</span>
                    <span class="latency-value">{{ averageLatency }}{{ t('milliseconds') }}</span>
                </span>
            </div>
            <div class="heartbeat-legend" v-if="showLegend">
                <span class="legend-item" v-for="(label, status) in statusLabels" :key="status">
                    <span class="legend-dot" :style="{ background: statusColors[status] }"></span>
                    <span class="legend-text">{{ label }}</span>
                </span>
            </div>
        </div>

        <div class="heartbeat-bars" :class="{ 'has-tooltip': hoveredIndex >= 0 }">
            <div
                v-for="(beat, index) in aggregatedBars"
                :key="index"
                class="heartbeat-bar"
                :style="{ background: statusColors[beat.status] || statusColors.unknown }"
                @mouseenter="handleBarHover(index, $event)"
                @mouseleave="handleBarLeave"
            ></div>

            <Teleport to="body">
                <div
                    v-if="hoveredIndex >= 0 && aggregatedBars[hoveredIndex]"
                    class="bar-tooltip"
                    :style="tooltipStyle"
                >
                    <div class="tooltip-row" v-if="aggregatedBars[hoveredIndex].time">
                        <span class="tooltip-label">{{ t('time') }}:</span>
                        <span>{{ formatFullTime(aggregatedBars[hoveredIndex].time) }}</span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">{{ t('status') }}:</span>
                        <span class="tooltip-status" :style="{ color: statusColors[aggregatedBars[hoveredIndex].status] }">
                            {{ getStatusLabel(aggregatedBars[hoveredIndex].status) }}
                        </span>
                    </div>
                    <div class="tooltip-row">
                        <span class="tooltip-label">{{ t('latency') }}:</span>
                        <span>{{ aggregatedBars[hoveredIndex].latency }}{{ t('milliseconds') }}</span>
                    </div>
                </div>
            </Teleport>
        </div>

        <div class="heartbeat-timeline">
            <span class="timeline-label">{{ firstTime }}</span>
            <span class="timeline-label">{{ lastTime }}</span>
        </div>
    </div>
</template>

<style scoped>
.heartbeat-section { width: 100%; }
.heartbeat-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px; }
.latency-info { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.latency-item { display: flex; align-items: center; gap: 4px; }
.latency-label { color: var(--text-tertiary); }
.latency-value { font-weight: 600; color: var(--text-primary); font-family: var(--font-mono); font-size: 11px; }
.latency-divider { color: var(--text-tertiary); opacity: 0.4; }
.heartbeat-legend { display: flex; align-items: center; gap: 10px; }
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.legend-text { font-size: 11px; color: var(--text-tertiary); }

.heartbeat-bars { position: relative; display: flex; gap: 2px; height: 32px; align-items: stretch; }
.heartbeat-bar { flex: 1; min-width: 2px; border-radius: 2px; cursor: pointer; transition: all var(--transition-fast); opacity: 0.85; }
.heartbeat-bar:hover { opacity: 1; transform: scaleY(1.15); transform-origin: bottom; }

.bar-tooltip { position: fixed; background: var(--bg-tooltip); color: var(--text-primary); border: 1px solid var(--border-primary); padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; white-space: nowrap; z-index: 1000; box-shadow: var(--shadow-lg); pointer-events: none; }
.bar-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: var(--border-primary); }
.tooltip-row { display: flex; gap: 6px; line-height: 1.6; }
.tooltip-label { opacity: 0.7; }
.tooltip-status { font-weight: 600; }

.heartbeat-timeline { display: flex; justify-content: space-between; margin-top: 4px; }
.timeline-label { font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono); }

@media (max-width: 480px) {
    .heartbeat-header { flex-direction: column; align-items: flex-start; }
    .heartbeat-bars { height: 26px; }
    .heartbeat-legend { gap: 6px; }
}
</style>
