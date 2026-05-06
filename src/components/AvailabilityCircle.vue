<script setup>
import { computed } from 'vue';

const props = defineProps({
    value: { type: Number, default: 0 },
    size: { type: Number, default: 52 },
    strokeWidth: { type: Number, default: 4 }
});

const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => {
    const clampedValue = Math.max(0, Math.min(100, props.value));
    return circumference.value * (1 - clampedValue / 100);
});

const displayValue = computed(() => {
    if (props.value >= 100) return '100';
    if (props.value >= 99.99) return props.value.toFixed(2);
    if (props.value >= 99.9) return props.value.toFixed(1);
    return props.value.toFixed(1);
});

const colorClass = computed(() => {
    if (props.value >= 99.5) return 'circle-success';
    if (props.value >= 95) return 'circle-warning';
    return 'circle-danger';
});
</script>

<template>
    <div class="availability-circle" :style="{ width: size + 'px', height: size + 'px' }">
        <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
            <circle
                class="circle-bg"
                :cx="size / 2"
                :cy="size / 2"
                :r="radius"
                fill="none"
                :stroke-width="strokeWidth"
            />
            <circle
                class="circle-progress"
                :class="colorClass"
                :cx="size / 2"
                :cy="size / 2"
                :r="radius"
                fill="none"
                :stroke-width="strokeWidth"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="dashOffset"
                stroke-linecap="round"
                :transform="`rotate(-90 ${size / 2} ${size / 2})`"
            />
        </svg>
        <span class="circle-value" :class="colorClass">{{ displayValue }}%</span>
    </div>
</template>

<style scoped>
.availability-circle {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.availability-circle svg {
    position: absolute;
    top: 0;
    left: 0;
}

.circle-bg {
    stroke: var(--bar-bg);
}

.circle-progress {
    transition: stroke-dashoffset 0.6s ease;
}

.circle-progress.circle-success {
    stroke: var(--color-success);
}

.circle-progress.circle-warning {
    stroke: var(--color-warning);
}

.circle-progress.circle-danger {
    stroke: var(--color-danger);
}

.circle-value {
    font-size: 11px;
    font-weight: 700;
    font-family: var(--font-mono);
    z-index: 1;
}

.circle-value.circle-success {
    color: var(--color-success);
}

.circle-value.circle-warning {
    color: var(--color-warning);
}

.circle-value.circle-danger {
    color: var(--color-danger);
}
</style>
