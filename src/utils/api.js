/**
 * API adapters for Uptime Robot, Uptime Kuma (public API), and Uptime Kuma Utopia Server
 * Normalizes data from all sources into a unified format.
 *
 * Heartbeats are returned as raw arrays — the HeartbeatBar component handles
 * aggregation based on how many bars fit in the container.
 */

// =============================================
// Uptime Robot Adapter
// =============================================

const UPTIME_ROBOT_STATUS_MAP = {
    0: 'paused',
    1: 'unknown',
    2: 'online',
    8: 'offline',
    9: 'offline'
};

const UPTIME_ROBOT_TYPE_MAP = {
    1: 'HTTP(s)',
    2: 'Keyword',
    3: 'Ping',
    4: 'Port',
    5: 'Heartbeat'
};

export async function fetchUptimeRobotData(sourceConfig) {
    const apiUrl = "https://api.uptimerobot.com/v2/getMonitors";
    const rangeDays = sourceConfig.rangeDays || 7;

    try {
        // UptimeRobot API limits response_times date range to 7 days per request.
        // For ranges > 7 days, we make multiple calls and merge.
        const now = Math.floor(Date.now() / 1000);
        const rangeStart = now - rangeDays * 86400;

        // Build 7-day chunks (reverse order: newest first)
        const chunks = [];
        let chunkEnd = now;
        while (chunkEnd > rangeStart) {
            const chunkStart = Math.max(chunkEnd - 7 * 86400, rangeStart);
            chunks.push({ start: chunkStart, end: chunkEnd });
            chunkEnd = chunkStart;
        }

        // First call: get monitor metadata + first chunk of response times
        const firstChunk = chunks[0];
        const bodyParams = new URLSearchParams({
            api_key: sourceConfig.apiKey,
            format: 'json',
            logs: '1',
            log_types: '1-2',
            logs_limit: '500',
            response_times: '1',
            response_times_limit: '500',
            response_times_average: '30',
            response_times_start_date: String(firstChunk.start),
            response_times_end_date: String(firstChunk.end),
            custom_uptime_ratios: String(rangeDays),
            all_time_uptime_ratio: '1'
        });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: bodyParams.toString()
        });

        const data = await response.json();

        if (data.stat !== 'ok') {
            throw new Error(data.error?.message || 'API request failed');
        }

        // For ranges > 7 days, fetch additional chunks
        const additionalResponseTimes = {};
        if (chunks.length > 1) {
            for (let i = 1; i < chunks.length; i++) {
                const chunk = chunks[i];
                const extraParams = new URLSearchParams({
                    api_key: sourceConfig.apiKey,
                    format: 'json',
                    response_times: '1',
                    response_times_limit: '500',
                    response_times_average: '30',
                    response_times_start_date: String(chunk.start),
                    response_times_end_date: String(chunk.end)
                });
                try {
                    const extraRes = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: extraParams.toString()
                    });
                    const extraData = await extraRes.json();
                    if (extraData.stat === 'ok' && extraData.monitors) {
                        for (const m of extraData.monitors) {
                            if (!additionalResponseTimes[m.id]) {
                                additionalResponseTimes[m.id] = [];
                            }
                            additionalResponseTimes[m.id].push(...(m.response_times || []));
                        }
                    }
                } catch (e) {
                    console.warn('Failed to fetch additional UR response times chunk:', e);
                }
            }
        }

        const monitors = data.monitors.map(monitor => {
            // Merge additional response times (older data)
            const allResponseTimes = [
                ...(monitor.response_times || []),
                ...(additionalResponseTimes[monitor.id] || [])
            ];
            monitor.response_times = allResponseTimes;

            const heartbeats = buildRawHeartbeatsFromUR(monitor);

            const latencies = heartbeats.map(h => h.latency).filter(l => l > 0);
            const avgLatency = latencies.length > 0
                ? Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length)
                : 0;
            const currentLatency = latencies.length > 0 ? latencies[latencies.length - 1] : 0;

            return {
                id: `ur_${monitor.id}`,
                name: monitor.friendly_name,
                url: monitor.url || null,
                status: UPTIME_ROBOT_STATUS_MAP[monitor.status] || 'unknown',
                uptime: parseFloat(monitor.custom_uptime_ratio) || 0,
                currentLatency,
                averageLatency: avgLatency,
                group: '',
                tags: [],
                method: null,
                type: UPTIME_ROBOT_TYPE_MAP[monitor.type] || 'Unknown',
                domainExpiry: null,
                certExpiry: null,
                heartbeats
            };
        });

        return { monitors, groups: groupMonitors(monitors) };
    } catch (error) {
        console.error('Uptime Robot fetch error:', error);
        return { monitors: [], groups: {}, error: error.message };
    }
}

function buildRawHeartbeatsFromUR(monitor) {
    const responseTimes = (monitor.response_times || []).reverse();
    const logs = (monitor.logs || []).sort((a, b) => (a.datetime || 0) - (b.datetime || 0));

    // Build a set of downtime intervals from logs
    const downtimeIntervals = [];
    let currentDownStart = null;
    for (const log of logs) {
        if (log.type === 1) { // down
            currentDownStart = (log.datetime || 0) * 1000;
        } else if (log.type === 2 && currentDownStart) { // up
            downtimeIntervals.push({ start: currentDownStart, end: (log.datetime || 0) * 1000 });
            currentDownStart = null;
        }
    }
    if (currentDownStart) {
        downtimeIntervals.push({ start: currentDownStart, end: Date.now() });
    }

    return responseTimes.map(rt => {
        const time = new Date((rt.datetime || 0) * 1000).toISOString();
        const timeMs = (rt.datetime || 0) * 1000;
        let status = 'online';
        for (const interval of downtimeIntervals) {
            if (timeMs >= interval.start && timeMs <= interval.end) {
                status = 'offline';
                break;
            }
        }
        return { time, status, latency: rt.value || 0 };
    });
}


// =============================================
// Uptime Kuma Adapter (Public API)
// =============================================

const KUMA_STATUS_MAP = {
    0: 'offline',
    1: 'online',
    2: 'retrying',
    3: 'maintenance'
};

/**
 * Parse a Kuma status page URL into baseUrl and slug.
 * Supports formats:
 *   http://host:port/status/slug
 *   http://host:port/status  (slug = "default")
 *   http://host:port/api/status-page/slug
 */
function parseKumaUrl(inputUrl) {
    const url = inputUrl.replace(/\/+$/, '');

    // Match /status/slug or /status
    const statusMatch = url.match(/^(https?:\/\/.+?)\/status(?:\/([^/]+))?$/);
    if (statusMatch) {
        return {
            baseUrl: statusMatch[1],
            slug: statusMatch[2] || 'default'
        };
    }

    // Match /api/status-page/slug or /api/status-page/heartbeat/slug
    const apiMatch = url.match(/^(https?:\/\/.+?)\/api\/status-page\/(?:heartbeat\/)?([^/]+)$/);
    if (apiMatch) {
        return {
            baseUrl: apiMatch[1],
            slug: apiMatch[2]
        };
    }

    // Fallback: assume the last path segment is the slug
    const parts = url.split('/');
    const slug = parts.pop() || 'default';
    const baseUrl = parts.join('/').replace(/\/api\/status-page$/, '').replace(/\/status$/, '');
    return { baseUrl: baseUrl || url, slug };
}

export async function fetchUptimeKumaData(sourceConfig) {
    try {
        const { baseUrl, slug } = parseKumaUrl(sourceConfig.pageUrl);
        const proxyUrl = (sourceConfig.proxyUrl || '').replace(/\/+$/, '');

        // Helper: fetch a URL, optionally via CORS proxy
        async function kumaFetch(url) {
            const fetchUrl = proxyUrl
                ? `${proxyUrl}/api/proxy/kuma?target=${encodeURIComponent(url)}`
                : url;
            return fetch(fetchUrl);
        }

        // Fetch status page config + monitor list
        const configUrl = `${baseUrl}/api/status-page/${slug}`;
        const configResponse = await kumaFetch(configUrl);
        const configData = await configResponse.json();

        // Fetch heartbeat data
        let heartbeatData = {};
        try {
            const hbUrl = `${baseUrl}/api/status-page/heartbeat/${slug}`;
            const hbResponse = await kumaFetch(hbUrl);
            heartbeatData = await hbResponse.json();
        } catch (e) {
            console.warn('Could not fetch Kuma heartbeat data:', e);
        }

        const monitors = [];
        const publicGroupList = configData.publicGroupList || [];

        for (const group of publicGroupList) {
            const groupName = group.name || '';
            const monitorList = group.monitorList || [];

            for (const monitor of monitorList) {
                const monitorId = monitor.id;
                const rawHeartbeats = (heartbeatData.heartbeatList?.[monitorId] || []).map(beat => ({
                    time: beat.time,
                    status: KUMA_STATUS_MAP[beat.status] || 'unknown',
                    latency: beat.ping || 0
                }));

                const uptimeData = heartbeatData.uptimeList?.[monitorId + '_24'] || 0;

                const latencyValues = rawHeartbeats.map(h => h.latency).filter(l => l > 0);
                const avgLatency = latencyValues.length > 0
                    ? Math.round(latencyValues.reduce((s, l) => s + l, 0) / latencyValues.length)
                    : 0;
                const currentLatency = latencyValues.length > 0
                    ? latencyValues[latencyValues.length - 1]
                    : 0;

                const tags = (monitor.tags || []).map(tag => tag.name || tag.value || String(tag));

                monitors.push({
                    id: `kuma_${monitorId}`,
                    name: monitor.name || `Monitor ${monitorId}`,
                    url: monitor.url || null,
                    status: KUMA_STATUS_MAP[monitor.active !== undefined ? (monitor.active ? 1 : 0) : 1] || 'unknown',
                    uptime: Math.round(uptimeData * 10000) / 100,
                    currentLatency,
                    averageLatency: avgLatency,
                    group: groupName,
                    tags,
                    method: monitor.method || null,
                    type: monitor.type || 'HTTP',
                    domainExpiry: null,
                    certExpiry: monitor.certExpiryDaysRemaining || null,
                    heartbeats: rawHeartbeats
                });
            }
        }

        return { monitors, groups: groupMonitors(monitors) };
    } catch (error) {
        console.error('Uptime Kuma fetch error:', error);
        return { monitors: [], groups: {}, error: error.message };
    }
}


// =============================================
// Uptime Kuma Utopia Server Adapter
// =============================================

export async function fetchKumaServerData(sourceConfig) {
    const serverUrl = (sourceConfig.serverUrl || '').replace(/\/+$/, '');

    try {
        const rangeDays = sourceConfig.rangeDays || 7;
        const dashboardUrl = `${serverUrl}/api/dashboard?range_days=${rangeDays}&limit=50000`;
        const dashboardResponse = await fetch(dashboardUrl);
        const dashboardData = await dashboardResponse.json();

        const monitors = [];

        for (const monitorMeta of (dashboardData.monitors || [])) {
            const monitorId = monitorMeta.id;
            
            const heartbeats = (monitorMeta.heartbeats || []).map(h => ({
                time: h.time,
                status: KUMA_STATUS_MAP[h.status] || 'unknown',
                latency: h.ping || 0
            }));
            const uptimePercent = monitorMeta.uptime || 0;

            const latencyValues = heartbeats.map(h => h.latency).filter(l => l > 0);
            const avgLatency = latencyValues.length > 0
                ? Math.round(latencyValues.reduce((s, l) => s + l, 0) / latencyValues.length)
                : 0;
            const currentLatency = latencyValues.length > 0
                ? latencyValues[latencyValues.length - 1]
                : 0;

            const tags = (monitorMeta.tags || []).map(t => typeof t === 'string' ? t : (t.name || t.value || ''));

            monitors.push({
                id: `kumasrv_${monitorId}`,
                name: monitorMeta.name || `Monitor ${monitorId}`,
                url: monitorMeta.url || null,
                status: KUMA_STATUS_MAP[monitorMeta.status !== undefined ? monitorMeta.status : (monitorMeta.active ? 1 : 0)] || 'unknown',
                uptime: uptimePercent,
                currentLatency,
                averageLatency: avgLatency,
                group: monitorMeta.group || '',
                tags,
                method: monitorMeta.method || null,
                type: monitorMeta.type || 'HTTP',
                domainExpiry: monitorMeta.domain_expiry_days || null,
                certExpiry: monitorMeta.cert_expiry_days || null,
                heartbeats
            });
        }

        return { monitors, groups: groupMonitors(monitors) };
    } catch (error) {
        console.error('Kuma Utopia Server fetch error:', error);
        return { monitors: [], groups: {}, error: error.message };
    }
}


// =============================================
// Heartbeat Aggregation (used by HeartbeatBar)
// =============================================

/**
 * Aggregate raw heartbeats into a fixed number of bars.
 * @param {Array} heartbeats - Raw heartbeat array (sorted chronologically)
 * @param {number} barCount  - Number of bars to fit
 * @returns {Array} Aggregated heartbeat bars
 */
export function aggregateHeartbeats(heartbeats, barCount) {
    if (!heartbeats || heartbeats.length === 0) {
        return [];
    }

    if (heartbeats.length <= barCount) {
        // Fewer data points than bars — return as-is (no padding)
        return [...heartbeats];
    }

    // More data points than bars — aggregate
    const chunkSize = heartbeats.length / barCount;
    const result = [];

    for (let i = 0; i < barCount; i++) {
        const start = Math.floor(i * chunkSize);
        const end = Math.floor((i + 1) * chunkSize);
        const chunk = heartbeats.slice(start, end);

        if (chunk.length === 0) {
            result.push({ time: '', status: 'unknown', latency: 0 });
            continue;
        }

        // Average latency
        const latencies = chunk.map(h => h.latency).filter(l => l > 0);
        const avgLatency = latencies.length > 0
            ? Math.round(latencies.reduce((s, l) => s + l, 0) / latencies.length)
            : 0;

        // Status: prioritize worst status in chunk (offline > retrying > maintenance > unknown > online)
        const statusPriority = { offline: 5, retrying: 4, maintenance: 3, unknown: 2, paused: 1, online: 0 };
        let worstStatus = 'online';
        let worstPriority = 0;
        for (const h of chunk) {
            const p = statusPriority[h.status] || 0;
            if (p > worstPriority) {
                worstPriority = p;
                worstStatus = h.status;
            }
        }

        // Use middle element's time as representative
        const midIndex = Math.floor(chunk.length / 2);
        result.push({
            time: chunk[midIndex].time,
            status: worstStatus,
            latency: avgLatency
        });
    }

    return result;
}


// =============================================
// Shared Utilities
// =============================================

function groupMonitors(monitors) {
    const groups = {};
    for (const monitor of monitors) {
        const groupName = monitor.group || '';
        if (!groups[groupName]) {
            groups[groupName] = [];
        }
        groups[groupName].push(monitor);
    }
    return groups;
}

export function fetchSourceData(sourceConfig) {
    if (sourceConfig.sourceType === 'uptimerobot') {
        return fetchUptimeRobotData(sourceConfig);
    } else if (sourceConfig.sourceType === 'kuma') {
        return fetchUptimeKumaData(sourceConfig);
    } else if (sourceConfig.sourceType === 'kuma-server') {
        return fetchKumaServerData(sourceConfig);
    }
    return Promise.resolve({ monitors: [], groups: {} });
}
