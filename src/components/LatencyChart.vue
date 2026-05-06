<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
    heartbeats: { type: Array, default: () => [] }
});

const canvasRef = ref(null);
const containerRef = ref(null);
const tooltipData = ref(null);
const tooltipStyle = ref({});
const chartWidth = ref(600);
const chartHeight = 180;
const paddingTop = 20;
const paddingBottom = 30;
const paddingLeft = 50;
const paddingRight = 20;

const statusColors = {
    online: { line: '#22c55e', fill: 'rgba(34, 197, 94, 0.15)' },
    offline: { line: '#ef4444', fill: 'rgba(239, 68, 68, 0.15)' },
    maintenance: { line: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' },
    retrying: { line: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)' },
    unknown: { line: '#94a3b8', fill: 'rgba(148, 163, 184, 0.1)' }
};

let resizeObserver = null;

onMounted(() => {
    if (containerRef.value) {
        chartWidth.value = containerRef.value.offsetWidth;
        resizeObserver = new ResizeObserver(entries => {
            chartWidth.value = entries[0].contentRect.width;
        });
        resizeObserver.observe(containerRef.value);
    }
    drawChart();
});

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect();
});

watch(() => [props.heartbeats, chartWidth.value], () => {
    drawChart();
}, { deep: true });

// Filter heartbeats to only those with valid time and latency > 0
const dataPoints = computed(() => {
    if (!props.heartbeats || props.heartbeats.length === 0) return [];
    return props.heartbeats
        .filter(h => h.time && h.latency > 0)
        .map(h => ({
            time: new Date(h.time),
            latency: h.latency,
            status: h.status || 'unknown'
        }))
        .filter(h => !isNaN(h.time.getTime()))
        .sort((a, b) => a.time.getTime() - b.time.getTime());
});

function drawChart() {
    const canvas = canvasRef.value;
    if (!canvas || dataPoints.value.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const width = chartWidth.value;
    const height = chartHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const points = dataPoints.value;
    const drawWidth = width - paddingLeft - paddingRight;
    const drawHeight = height - paddingTop - paddingBottom;

    const maxLatency = Math.max(...points.map(p => p.latency)) * 1.2 || 100;
    const minTime = points[0].time.getTime();
    const maxTime = points[points.length - 1].time.getTime();
    const timeRange = maxTime - minTime || 1;

    function xPos(time) {
        return paddingLeft + ((time.getTime() - minTime) / timeRange) * drawWidth;
    }
    function yPos(latency) {
        return paddingTop + drawHeight - (latency / maxLatency) * drawHeight;
    }

    // Read CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const gridColor = computedStyle.getPropertyValue('--chart-grid').trim() || '#e2e8f0';
    const textColor = computedStyle.getPropertyValue('--text-tertiary').trim() || '#94a3b8';
    const lineColor = computedStyle.getPropertyValue('--chart-line').trim() || '#6366f1';

    // Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
        const y = paddingTop + (drawHeight / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();
        const val = Math.round(maxLatency - (maxLatency / gridLines) * i);
        ctx.fillStyle = textColor;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val + 'ms', paddingLeft - 6, y + 4);
    }
    ctx.setLineDash([]);

    // X labels
    const xLabels = 5;
    ctx.textAlign = 'center';
    for (let i = 0; i < xLabels; i++) {
        const t = minTime + (timeRange / (xLabels - 1)) * i;
        const x = xPos(new Date(t));
        const date = new Date(t);
        // Choose format based on time range
        let label;
        if (timeRange > 86400000 * 3) {
            label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } else {
            label = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        }
        ctx.fillStyle = textColor;
        ctx.fillText(label, x, height - 8);
    }

    // Fill areas with status-based gradient
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i], p2 = points[i + 1];
        const x1 = xPos(p1.time), x2 = xPos(p2.time);
        const y1 = yPos(p1.latency), y2 = yPos(p2.latency);
        const c1 = statusColors[p1.status] || statusColors.unknown;
        const c2 = statusColors[p2.status] || statusColors.unknown;
        const gradient = ctx.createLinearGradient(x1, 0, x2, 0);
        gradient.addColorStop(0, c1.fill);
        gradient.addColorStop(1, c2.fill);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x2, paddingTop + drawHeight);
        ctx.lineTo(x1, paddingTop + drawHeight);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let i = 0; i < points.length; i++) {
        const x = xPos(points[i].time), y = yPos(points[i].latency);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dots (only draw if not too many)
    if (points.length <= 200) {
        for (const point of points) {
            const x = xPos(point.time), y = yPos(point.latency);
            const color = statusColors[point.status] || statusColors.unknown;
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = color.line;
            ctx.fill();
        }
    }
}

function handleMouseMove(event) {
    if (!containerRef.value || dataPoints.value.length < 2) return;
    const rect = containerRef.value.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const drawWidth = chartWidth.value - paddingLeft - paddingRight;
    const minTime = dataPoints.value[0].time.getTime();
    const maxTime = dataPoints.value[dataPoints.value.length - 1].time.getTime();
    const timeRange = maxTime - minTime || 1;

    let closestPoint = null, closestDist = Infinity;
    for (const point of dataPoints.value) {
        const x = paddingLeft + ((point.time.getTime() - minTime) / timeRange) * drawWidth;
        const dist = Math.abs(x - mouseX);
        if (dist < closestDist) { closestDist = dist; closestPoint = point; }
    }

    if (closestPoint && closestDist < 30) {
        const x = paddingLeft + ((closestPoint.time.getTime() - minTime) / timeRange) * drawWidth;
        tooltipData.value = closestPoint;
        tooltipStyle.value = { left: x + 'px', transform: 'translateX(-50%)' };
    } else {
        tooltipData.value = null;
    }
}

function handleMouseLeave() { tooltipData.value = null; }

function formatTooltipTime(date) {
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
</script>

<template>
    <div class="latency-chart" ref="containerRef" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
        <canvas ref="canvasRef"></canvas>
        <div v-if="dataPoints.length < 2" class="chart-empty">
            <span>No latency data</span>
        </div>
        <div v-if="tooltipData" class="chart-tooltip" :style="tooltipStyle">
            <div class="chart-tooltip-time">{{ formatTooltipTime(tooltipData.time) }}</div>
            <div class="chart-tooltip-value">{{ tooltipData.latency }}ms</div>
        </div>
    </div>
</template>

<style scoped>
.latency-chart { position: relative; width: 100%; background: var(--bg-tertiary); border-radius: var(--radius-md); border: 1px solid var(--border-primary); overflow: hidden; cursor: crosshair; min-height: 60px; }
.latency-chart canvas { display: block; }
.chart-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary); font-size: 13px; }
.chart-tooltip { position: absolute; top: 4px; background: var(--bg-tooltip); color: var(--text-inverse); padding: 6px 10px; border-radius: var(--radius-sm); font-size: 11px; pointer-events: none; z-index: 10; box-shadow: var(--shadow-md); white-space: nowrap; }
.chart-tooltip-time { opacity: 0.7; font-size: 10px; margin-bottom: 2px; }
.chart-tooltip-value { font-weight: 700; font-family: var(--font-mono); }
</style>
