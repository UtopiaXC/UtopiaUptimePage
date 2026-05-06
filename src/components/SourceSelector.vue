<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    sources: { type: Array, required: true },
    activeIndex: { type: Number, default: 0 }
});

const emit = defineEmits(['select']);

const containerRef = ref(null);
const useDropdown = ref(false);
let resizeObserver = null;

function checkOverflow() {
    if (!containerRef.value) return;
    const container = containerRef.value;
    const slider = container.querySelector('.source-slider');
    if (!slider) {
        useDropdown.value = false;
        return;
    }
    // If any button's text is being truncated, switch to dropdown
    const buttons = slider.querySelectorAll('.source-btn');
    let needsDropdown = false;
    for (const btn of buttons) {
        const nameEl = btn.querySelector('.source-name');
        if (nameEl && nameEl.scrollWidth > nameEl.clientWidth + 2) {
            needsDropdown = true;
            break;
        }
    }
    useDropdown.value = needsDropdown;
}

onMounted(() => {
    if (containerRef.value) {
        resizeObserver = new ResizeObserver(() => {
            // Temporarily force tab mode to measure
            useDropdown.value = false;
            requestAnimationFrame(() => {
                checkOverflow();
            });
        });
        resizeObserver.observe(containerRef.value);
        requestAnimationFrame(() => checkOverflow());
    }
});

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect();
});

function handleDropdownChange(event) {
    emit('select', parseInt(event.target.value));
}
</script>

<template>
    <div class="source-selector" v-if="sources.length > 1" ref="containerRef">
        <!-- Tab mode -->
        <div class="source-slider" v-if="!useDropdown">
            <button
                v-for="(source, index) in sources"
                :key="index"
                class="source-btn"
                :class="{ active: index === activeIndex }"
                @click="emit('select', index)"
            >
                <span class="source-icon">
                    <svg v-if="source.sourceType === 'uptimerobot'" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <svg v-else-if="source.sourceType === 'kuma-server'" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                </span>
                <span class="source-name">{{ source.sourceName }}</span>
            </button>
        </div>

        <!-- Dropdown mode (for narrow screens) -->
        <div class="source-dropdown-wrap" v-else>
            <select class="source-dropdown" :value="activeIndex" @change="handleDropdownChange">
                <option v-for="(source, index) in sources" :key="index" :value="index">
                    {{ source.sourceName }}
                </option>
            </select>
            <svg class="dropdown-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
            </svg>
        </div>
    </div>
</template>

<style scoped>
.source-selector {
    margin: 16px 0 12px;
}

.source-slider {
    display: flex;
    gap: 8px;
    padding: 4px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-primary);
}

.source-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    background: transparent;
    border: 1px solid transparent;
    transition: all var(--transition-base);
    white-space: nowrap;
    flex: 1;
    justify-content: center;
    min-width: 0;
}

.source-btn:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
}

.source-btn.active {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border-color: var(--border-primary);
    box-shadow: var(--shadow-sm);
}

.source-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.source-name {
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Dropdown mode */
.source-dropdown-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.source-dropdown {
    width: 100%;
    padding: 10px 36px 10px 14px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-primary);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    appearance: none;
    -webkit-appearance: none;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
}

.source-dropdown:focus {
    border-color: var(--color-accent);
}

.dropdown-arrow {
    position: absolute;
    right: 12px;
    pointer-events: none;
    color: var(--text-tertiary);
}

@media (max-width: 480px) {
    .source-btn {
        padding: 7px 12px;
        font-size: 12px;
    }
}
</style>
