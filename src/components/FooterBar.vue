<script setup>
const props = defineProps({
    text: { type: String, default: '' }
});
</script>

<template>
    <footer class="footer-bar">
        <div class="footer-content">
            <span class="footer-text" v-if="text" v-html="text"></span>
            <span class="footer-text">
                Powered by <a href="https://github.com/UtopiaXC/UtopiaUptimePage" target="_blank" rel="noopener noreferrer">Utopia Uptime Page</a>
            </span>
        </div>
    </footer>
</template>

<style scoped>
.footer-bar {
    margin-top: auto;
    padding: 20px 0;
    border-top: 1px solid var(--border-primary);
}

.footer-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

.footer-text {
    font-size: 12px;
    color: var(--text-tertiary);
    text-align: center;
    line-height: 1.6;
}

.footer-text :deep(a) {
    color: var(--text-secondary);
    transition: color var(--transition-fast);
}

.footer-text :deep(a:hover) {
    color: var(--color-accent);
}
</style>
