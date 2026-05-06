import { ref, computed } from 'vue';

const SUPPORTED_LANGUAGES = ['zh', 'zh-TW', 'en', 'ja'];
const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'dashboard_language_preference';

function detectBrowserLanguage() {
    const savedLanguage = localStorage.getItem(STORAGE_KEY);
    if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage)) {
        return savedLanguage;
    }

    const browserLanguages = navigator.languages || [navigator.language || navigator.userLanguage || ''];
    for (const lang of browserLanguages) {
        const normalized = lang.trim();
        if (normalized.startsWith('zh')) {
            if (normalized.includes('TW') || normalized.includes('HK') || normalized.includes('Hant')) {
                return 'zh-TW';
            }
            return 'zh';
        }
        if (normalized.startsWith('ja')) return 'ja';
        if (normalized.startsWith('en')) return 'en';
    }
    return DEFAULT_LANGUAGE;
}

const currentLanguageCode = ref(detectBrowserLanguage());

const translations = {
    zh: {
        allOperational: "所有服务正常运行",
        partialOutage: "部分服务异常",
        allDown: "所有服务异常",
        statusOnline: "正常",
        statusOffline: "离线",
        statusMaintenance: "维护中",
        statusRetrying: "重试中",
        statusUnknown: "未知",
        statusPaused: "已暂停",
        responseTimeLabel: "响应时间",
        currentLatency: "当前延迟",
        averageLatency: "平均延迟",
        milliseconds: "ms",
        uptime: "可用率",
        pause: "暂停",
        resume: "恢复",
        refresh: "刷新",
        viewCard: "卡片视图",
        viewList: "列表视图",
        themeAuto: "跟随系统",
        themeLight: "浅色",
        themeDark: "深色",
        language: "语言",
        defaultGroup: "默认分组",
        announcement: "公告",
        noData: "暂无数据",
        loading: "加载中...",
        error: "加载失败",
        monitorDetail: "监控详情",
        close: "关闭",
        latencyChart: "延迟趋势",
        online: "在线",
        offline: "离线",
        maintenance: "维护",
        retrying: "重试",
        legend: "图例",
        time: "时间",
        status: "状态",
        latency: "延迟",
        method: "方法",
        type: "类型",
        tag: "标签",
        domainExpiry: "域名到期",
        certExpiry: "证书到期",
        daysLeft: "天后",
        collapsed: "已折叠",
        expand: "展开",
        collapse: "折叠",
        moreItems: "+{n} 项",
        visitSite: "访问网站",
        autoRefreshPaused: "自动刷新已暂停",
        autoRefreshActive: "自动刷新中",
        lastUpdated: "上次更新",
        day: "天",
        hour: "时",
        backToList: "返回列表"
    },
    "zh-TW": {
        allOperational: "所有服務正常運行",
        partialOutage: "部分服務異常",
        allDown: "所有服務異常",
        statusOnline: "正常",
        statusOffline: "離線",
        statusMaintenance: "維護中",
        statusRetrying: "重試中",
        statusUnknown: "未知",
        statusPaused: "已暫停",
        responseTimeLabel: "回應時間",
        currentLatency: "目前延遲",
        averageLatency: "平均延遲",
        milliseconds: "ms",
        uptime: "可用率",
        pause: "暫停",
        resume: "恢復",
        refresh: "重新整理",
        viewCard: "卡片檢視",
        viewList: "列表檢視",
        themeAuto: "跟隨系統",
        themeLight: "淺色",
        themeDark: "深色",
        language: "語言",
        defaultGroup: "預設分組",
        announcement: "公告",
        noData: "暫無資料",
        loading: "載入中...",
        error: "載入失敗",
        monitorDetail: "監控詳情",
        close: "關閉",
        latencyChart: "延遲趨勢",
        online: "線上",
        offline: "離線",
        maintenance: "維護",
        retrying: "重試",
        legend: "圖例",
        time: "時間",
        status: "狀態",
        latency: "延遲",
        method: "方法",
        type: "類型",
        tag: "標籤",
        domainExpiry: "域名到期",
        certExpiry: "憑證到期",
        daysLeft: "天後",
        collapsed: "已收合",
        expand: "展開",
        collapse: "收合",
        moreItems: "+{n} 項",
        visitSite: "造訪網站",
        autoRefreshPaused: "自動重新整理已暫停",
        autoRefreshActive: "自動重新整理中",
        lastUpdated: "上次更新",
        day: "天",
        hour: "時",
        backToList: "返回列表"
    },
    en: {
        allOperational: "All Systems Operational",
        partialOutage: "Partial Outage",
        allDown: "Major Outage",
        statusOnline: "Operational",
        statusOffline: "Offline",
        statusMaintenance: "Maintenance",
        statusRetrying: "Retrying",
        statusUnknown: "Unknown",
        statusPaused: "Paused",
        responseTimeLabel: "Response Time",
        currentLatency: "Current",
        averageLatency: "Average",
        milliseconds: "ms",
        uptime: "Uptime",
        pause: "Pause",
        resume: "Resume",
        refresh: "Refresh",
        viewCard: "Card View",
        viewList: "List View",
        themeAuto: "System",
        themeLight: "Light",
        themeDark: "Dark",
        language: "Language",
        defaultGroup: "Default",
        announcement: "Announcement",
        noData: "No data available",
        loading: "Loading...",
        error: "Failed to load",
        monitorDetail: "Monitor Details",
        close: "Close",
        latencyChart: "Latency Trend",
        online: "Online",
        offline: "Offline",
        maintenance: "Maintenance",
        retrying: "Retrying",
        legend: "Legend",
        time: "Time",
        status: "Status",
        latency: "Latency",
        method: "Method",
        type: "Type",
        tag: "Tag",
        domainExpiry: "Domain Expiry",
        certExpiry: "Cert Expiry",
        daysLeft: "days",
        collapsed: "Collapsed",
        expand: "Expand",
        collapse: "Collapse",
        moreItems: "+{n} more",
        visitSite: "Visit Site",
        autoRefreshPaused: "Auto-refresh paused",
        autoRefreshActive: "Auto-refreshing",
        lastUpdated: "Last updated",
        day: "d",
        hour: "h",
        backToList: "Back"
    },
    ja: {
        allOperational: "全サービス正常稼働中",
        partialOutage: "一部サービスに障害",
        allDown: "全サービスに障害",
        statusOnline: "正常",
        statusOffline: "オフライン",
        statusMaintenance: "メンテナンス中",
        statusRetrying: "リトライ中",
        statusUnknown: "不明",
        statusPaused: "一時停止中",
        responseTimeLabel: "応答時間",
        currentLatency: "現在の遅延",
        averageLatency: "平均遅延",
        milliseconds: "ms",
        uptime: "稼働率",
        pause: "一時停止",
        resume: "再開",
        refresh: "更新",
        viewCard: "カード表示",
        viewList: "リスト表示",
        themeAuto: "システム",
        themeLight: "ライト",
        themeDark: "ダーク",
        language: "言語",
        defaultGroup: "デフォルト",
        announcement: "お知らせ",
        noData: "データなし",
        loading: "読み込み中...",
        error: "読み込み失敗",
        monitorDetail: "モニター詳細",
        close: "閉じる",
        latencyChart: "遅延推移",
        online: "オンライン",
        offline: "オフライン",
        maintenance: "メンテナンス",
        retrying: "リトライ",
        legend: "凡例",
        time: "時間",
        status: "ステータス",
        latency: "遅延",
        method: "メソッド",
        type: "タイプ",
        tag: "タグ",
        domainExpiry: "ドメイン期限",
        certExpiry: "証明書期限",
        daysLeft: "日後",
        collapsed: "折りたたみ済み",
        expand: "展開",
        collapse: "折りたたみ",
        moreItems: "+{n} 件",
        visitSite: "サイトを開く",
        autoRefreshPaused: "自動更新を一時停止中",
        autoRefreshActive: "自動更新中",
        lastUpdated: "最終更新",
        day: "日",
        hour: "時",
        backToList: "戻る"
    }
};

export function useI18n() {
    const t = (key, params) => {
        const dict = translations[currentLanguageCode.value] || translations[DEFAULT_LANGUAGE];
        let text = dict[key] || translations[DEFAULT_LANGUAGE][key] || key;
        if (params) {
            Object.keys(params).forEach(paramKey => {
                text = text.replace(`{${paramKey}}`, params[paramKey]);
            });
        }
        return text;
    };

    const setLanguage = (lang) => {
        if (SUPPORTED_LANGUAGES.includes(lang)) {
            currentLanguageCode.value = lang;
            localStorage.setItem(STORAGE_KEY, lang);
        }
    };

    const supportedLanguages = computed(() => [
        { code: 'zh', label: '简体中文' },
        { code: 'zh-TW', label: '繁體中文' },
        { code: 'en', label: 'English' },
        { code: 'ja', label: '日本語' }
    ]);

    return {
        currentLanguageCode,
        t,
        setLanguage,
        supportedLanguages
    };
}