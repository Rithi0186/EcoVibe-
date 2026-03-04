// ── Feature Engineering Module ─────────────────────────────────
// Computes aggregated user-level features from an array of co2_log entries
// These features power the AI prediction, anomaly detection, and clustering modules

/**
 * Compute all features from a sorted (newest-first) array of co2 log entries.
 * Each entry must have at least: { co2_kg, created_at, category, transport_mode, food_type, waste_action }
 */
export function computeFeatures(logs) {
    if (!logs || logs.length === 0) {
        return emptyFeatures()
    }

    // Normalise & sort by date ascending
    const sorted = [...logs]
        .map(l => ({
            ...l,
            co2: Number(l.co2_kg) || 0,
            date: new Date(l.created_at),
        }))
        .sort((a, b) => a.date - b.date)

    const now = new Date()

    // ── Daily aggregation ──
    const dailyMap = new Map()
    for (const entry of sorted) {
        const key = entry.date.toISOString().split('T')[0]
        if (!dailyMap.has(key)) dailyMap.set(key, { co2: 0, entries: [] })
        const day = dailyMap.get(key)
        day.co2 += entry.co2
        day.entries.push(entry)
    }

    const dailyValues = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data }))

    // ── Rolling averages ──
    const last7d = filterByDays(dailyValues, now, 7)
    const last14d = filterByDays(dailyValues, now, 14)
    const last30d = filterByDays(dailyValues, now, 30)

    const avg7d = mean(last7d.map(d => d.co2))
    const avg30d = mean(last30d.map(d => d.co2))

    // ── Volatility (std dev over 14 days) ──
    const volatility = stdDev(last14d.map(d => d.co2))

    // ── Dominant transport mode ──
    const transportEntries = sorted.filter(e => e.transport_mode)
    const dominantTransport = mode(transportEntries.map(e => e.transport_mode)) || 'unknown'

    // ── Meat ratio over 30 days ──
    const foodEntries30d = sorted.filter(e =>
        e.food_type && daysSince(e.date, now) <= 30
    )
    const nonVegCount = foodEntries30d.filter(e => e.food_type === 'non-veg').length
    const meatRatio = foodEntries30d.length > 0 ? nonVegCount / foodEntries30d.length : 0

    // ── Weekend vs weekday delta ──
    const weekendDays = last30d.filter(d => {
        const dow = new Date(d.date).getDay()
        return dow === 0 || dow === 6
    })
    const weekdayDays = last30d.filter(d => {
        const dow = new Date(d.date).getDay()
        return dow > 0 && dow < 6
    })
    const weekendDelta = mean(weekendDays.map(d => d.co2)) - mean(weekdayDays.map(d => d.co2))

    // ── Eco streak (consecutive days below personal median) ──
    const medianCO2 = median(dailyValues.map(d => d.co2))
    let streak = 0
    for (let i = dailyValues.length - 1; i >= 0; i--) {
        if (dailyValues[i].co2 <= medianCO2) streak++
        else break
    }

    // ── Trend direction ──
    let trend = 'stable'
    if (avg7d > 0 && avg30d > 0) {
        const ratio = avg7d / avg30d
        if (ratio < 0.85) trend = 'improving'
        else if (ratio > 1.15) trend = 'worsening'
    }

    // ── Day-of-week averages (for seasonality) ──
    const dowTotals = Array(7).fill(0)
    const dowCounts = Array(7).fill(0)
    for (const day of dailyValues) {
        const dow = new Date(day.date).getDay()
        dowTotals[dow] += day.co2
        dowCounts[dow] += 1
    }
    const dowAverages = dowTotals.map((total, i) =>
        dowCounts[i] > 0 ? +(total / dowCounts[i]).toFixed(2) : 0
    )

    // ── Waste action ratio ──
    const wasteEntries30d = sorted.filter(e =>
        e.waste_action && daysSince(e.date, now) <= 30
    )
    const ecoWaste = wasteEntries30d.filter(e =>
        e.waste_action === 'recycled' || e.waste_action === 'composted'
    ).length
    const ecoWasteRatio = wasteEntries30d.length > 0 ? ecoWaste / wasteEntries30d.length : 0

    return {
        totalDays: dailyValues.length,
        totalEntries: sorted.length,
        avg_daily_co2_7d: +avg7d.toFixed(2),
        avg_daily_co2_30d: +avg30d.toFixed(2),
        co2_volatility: +volatility.toFixed(2),
        dominant_transport: dominantTransport,
        meat_ratio: +meatRatio.toFixed(2),
        eco_waste_ratio: +ecoWasteRatio.toFixed(2),
        weekend_vs_weekday_delta: +weekendDelta.toFixed(2),
        streak_eco_days: streak,
        trend_direction: trend,
        dow_averages: dowAverages,
        median_daily_co2: +medianCO2.toFixed(2),
        latest_daily_co2: dailyValues.length > 0 ? +dailyValues[dailyValues.length - 1].co2.toFixed(2) : 0,
        dailyValues,
    }
}

/** Return empty features when no data is available */
function emptyFeatures() {
    return {
        totalDays: 0,
        totalEntries: 0,
        avg_daily_co2_7d: 0,
        avg_daily_co2_30d: 0,
        co2_volatility: 0,
        dominant_transport: 'unknown',
        meat_ratio: 0,
        eco_waste_ratio: 0,
        weekend_vs_weekday_delta: 0,
        streak_eco_days: 0,
        trend_direction: 'stable',
        dow_averages: Array(7).fill(0),
        median_daily_co2: 0,
        latest_daily_co2: 0,
        dailyValues: [],
    }
}

// ── Utility helpers ──

function filterByDays(dailyValues, now, days) {
    const cutoff = new Date(now.getTime() - days * 86400000)
    return dailyValues.filter(d => new Date(d.date) >= cutoff)
}

function daysSince(date, now) {
    return Math.floor((now - date) / 86400000)
}

function mean(arr) {
    if (arr.length === 0) return 0
    return arr.reduce((s, v) => s + v, 0) / arr.length
}

function stdDev(arr) {
    if (arr.length < 2) return 0
    const m = mean(arr)
    const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length
    return Math.sqrt(variance)
}

function median(arr) {
    if (arr.length === 0) return 0
    const s = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(s.length / 2)
    return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid]
}

function mode(arr) {
    if (arr.length === 0) return null
    const counts = {}
    arr.forEach(v => { counts[v] = (counts[v] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}
