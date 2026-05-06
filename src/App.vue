<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from './utils/i18n.js';
import { useTheme } from './utils/theme.js';
import { fetchSourceData } from './utils/api.js';

import HeaderBar from './components/HeaderBar.vue';
import SourceSelector from './components/SourceSelector.vue';
import StatusBar from './components/StatusBar.vue';
import AnnouncementBanner from './components/AnnouncementBanner.vue';
import MonitorGroup from './components/MonitorGroup.vue';
import MonitorDetail from './components/MonitorDetail.vue';
import FooterBar from './components/FooterBar.vue';

const config = window.DashboardConfiguration || {};
const dashboardTitle = config.dashboardTitle || 'Status Dashboard';
const footerText = config.footerText || '';
const dataSources = config.dataSources || [];
const defaultView = config.defaultView || 'card';

document.title = dashboardTitle;

const { t } = useI18n();
useTheme();

const activeSourceIndex = ref(0);
const viewMode = ref(localStorage.getItem('dashboard_view_preference') || defaultView);
const isPaused = ref(false);
const isLoading = ref(false);
const monitors = ref([]);
const groups = ref({});
const errorMessage = ref('');
const selectedMonitor = ref(null);
const refreshTimerRef = ref(null);

const activeSource = computed(() => dataSources[activeSourceIndex.value] || null);

const announcement = computed(() => {
    if (!activeSource.value) return '';
    return activeSource.value.announcement || '';
});

const groupEntries = computed(() => {
    const entries = Object.entries(groups.value);
    if (entries.length === 0 && monitors.value.length > 0) {
        return [['', monitors.value]];
    }
    return entries;
});

async function loadData() {
    if (!activeSource.value) return;
    isLoading.value = true;
    errorMessage.value = '';

    const currentSourceIndex = activeSourceIndex.value;

    try {
        const result = await fetchSourceData(activeSource.value);
        
        // Ignore response if user switched to another tab while fetching
        if (activeSourceIndex.value !== currentSourceIndex) return;

        if (result.error) {
            errorMessage.value = result.error;
        }
        monitors.value = result.monitors || [];
        groups.value = result.groups || {};
    } catch (err) {
        if (activeSourceIndex.value !== currentSourceIndex) return;
        
        errorMessage.value = err.message;
        monitors.value = [];
        groups.value = {};
    } finally {
        if (activeSourceIndex.value === currentSourceIndex) {
            isLoading.value = false;
        }
    }
}

function startAutoRefresh() {
    stopAutoRefresh();
    if (isPaused.value || !activeSource.value) return;

    const interval = (activeSource.value.refreshInterval || 300) * 1000;
    refreshTimerRef.value = setInterval(() => {
        if (!isPaused.value) {
            loadData();
        }
    }, interval);
}

function stopAutoRefresh() {
    if (refreshTimerRef.value) {
        clearInterval(refreshTimerRef.value);
        refreshTimerRef.value = null;
    }
}

function handleSourceSelect(index) {
    activeSourceIndex.value = index;
    monitors.value = [];
    groups.value = {};
    errorMessage.value = '';
    loadData();
    startAutoRefresh();
}

function handleTogglePause() {
    isPaused.value = !isPaused.value;
    if (isPaused.value) {
        stopAutoRefresh();
    } else {
        startAutoRefresh();
    }
}

function handleRefresh() {
    loadData();
}

function handleToggleView() {
    viewMode.value = viewMode.value === 'card' ? 'list' : 'card';
    localStorage.setItem('dashboard_view_preference', viewMode.value);
}

function handleShowDetail(monitor) {
    selectedMonitor.value = monitor;
}

function handleCloseDetail() {
    selectedMonitor.value = null;
}

onMounted(() => {
    loadData();
    startAutoRefresh();
});

onUnmounted(() => {
    stopAutoRefresh();
});

watch(activeSourceIndex, () => {
    startAutoRefresh();
});
</script>

<template>
    <div class="app-container">
        <HeaderBar :title="dashboardTitle" />

        <main class="main-content">
            <SourceSelector
                :sources="dataSources"
                :active-index="activeSourceIndex"
                @select="handleSourceSelect"
            />

            <StatusBar
                :monitors="monitors"
                :is-paused="isPaused"
                :view-mode="viewMode"
                :loading="isLoading"
                @toggle-pause="handleTogglePause"
                @refresh="handleRefresh"
                @toggle-view="handleToggleView"
            />

            <AnnouncementBanner :content="announcement" />

            <div v-if="isLoading && monitors.length === 0" class="loading-container">
                <div class="loading-progress">
                    <div class="loading-progress-bar"></div>
                </div>
                <div class="loading-grid">
                    <div v-for="i in 4" :key="i" class="skeleton-card">
                        <div class="skeleton skeleton-header"></div>
                        <div class="skeleton skeleton-badges"></div>
                        <div class="skeleton skeleton-bars"></div>
                    </div>
                </div>
            </div>

            <div v-else-if="errorMessage && monitors.length === 0" class="error-container">
                <div class="error-card glass-card">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--color-danger)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p class="error-text">{{ t('error') }}</p>
                    <p class="error-detail">{{ errorMessage }}</p>
                    <button class="retry-btn" @click="handleRefresh">{{ t('refresh') }}</button>
                </div>
            </div>

            <div v-else-if="monitors.length > 0" class="monitors-container">
                <MonitorGroup
                    v-for="[groupName, groupMonitors] in groupEntries"
                    :key="groupName"
                    :group-name="groupName"
                    :monitors="groupMonitors"
                    :view-mode="viewMode"
                    @show-detail="handleShowDetail"
                />
            </div>

            <div v-else-if="!isLoading" class="empty-container">
                <p class="empty-text">{{ t('noData') }}</p>
            </div>
        </main>

        <FooterBar :text="footerText" />

        <MonitorDetail
            v-if="selectedMonitor"
            :monitor="selectedMonitor"
            @close="handleCloseDetail"
        />
    </div>
</template>

<style scoped>
.app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.main-content {
    flex: 1;
    padding-top: 8px;
    padding-bottom: 24px;
}

.loading-container {
    padding-top: 8px;
}

.loading-progress {
    width: 100%;
    height: 3px;
    background: var(--bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 16px;
}

.loading-progress-bar {
    height: 100%;
    width: 30%;
    background: linear-gradient(90deg, var(--color-accent), var(--color-info, #60a5fa));
    border-radius: 2px;
    animation: progressSlide 1.2s ease-in-out infinite;
}

@keyframes progressSlide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
}

.loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 12px;
}

.skeleton-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.skeleton-header {
    height: 28px;
    width: 60%;
}

.skeleton-badges {
    height: 20px;
    width: 40%;
}

.skeleton-bars {
    height: 32px;
    width: 100%;
}

/* Error state */
.error-container {
    display: flex;
    justify-content: center;
    padding-top: 40px;
}

.error-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px;
    text-align: center;
    max-width: 400px;
}

.error-text {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
}

.error-detail {
    font-size: 13px;
    color: var(--text-tertiary);
    word-break: break-word;
}

.retry-btn {
    padding: 8px 20px;
    border-radius: var(--radius-md);
    background: var(--color-accent);
    color: white;
    font-size: 13px;
    font-weight: 600;
    transition: all var(--transition-fast);
    border: none;
}

.retry-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

/* Empty state */
.empty-container {
    display: flex;
    justify-content: center;
    padding-top: 60px;
}

.empty-text {
    font-size: 15px;
    color: var(--text-tertiary);
}

.monitors-container {
    padding-top: 4px;
}

@media (max-width: 768px) {
    .loading-grid {
        grid-template-columns: 1fr;
    }
}
</style>