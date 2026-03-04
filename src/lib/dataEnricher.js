// ── Data Enrichment Module ────────────────────────────────────
// Adds contextual metadata to log entries for better feature engineering.
// Weather fetching is optional and non-blocking.

const SEMESTER_BREAKS = [
    // Winter break (Dec 20 – Jan 5)
    { name: 'winter_break', startMonth: 12, startDay: 20, endMonth: 1, endDay: 5 },
    // Summer break (May 15 – Jul 15)
    { name: 'summer_break', startMonth: 5, startDay: 15, endMonth: 7, endDay: 15 },
    // Mid-sem break (Oct 1 – Oct 7)
    { name: 'mid_sem_break', startMonth: 10, startDay: 1, endMonth: 10, endDay: 7 },
]

// Rough exam periods
const EXAM_PERIODS = [
    { name: 'end_sem_1', startMonth: 11, startDay: 15, endMonth: 12, endDay: 10 },
    { name: 'end_sem_2', startMonth: 4, startDay: 15, endMonth: 5, endDay: 10 },
    { name: 'mid_sem', startMonth: 9, startDay: 10, endMonth: 9, endDay: 20 },
]

/**
 * Check if a date falls on a weekend.
 */
export function isWeekend(date) {
    const d = new Date(date)
    const day = d.getDay()
    return day === 0 || day === 6
}

/**
 * Get the day of the week (0 = Sunday, 6 = Saturday).
 */
export function getDayOfWeek(date) {
    return new Date(date).getDay()
}

/**
 * Determine the academic semester context for a given date.
 * @returns {'exam' | 'break' | 'regular'}
 */
export function getSemesterContext(date) {
    const d = new Date(date)
    const month = d.getMonth() + 1
    const day = d.getDate()

    for (const period of EXAM_PERIODS) {
        if (isInRange(month, day, period)) return 'exam'
    }
    for (const period of SEMESTER_BREAKS) {
        if (isInRange(month, day, period)) return 'break'
    }
    return 'regular'
}

/**
 * Check if a month/day falls within a date range (may wrap around year boundary).
 */
function isInRange(month, day, { startMonth, startDay, endMonth, endDay }) {
    const current = month * 100 + day
    const start = startMonth * 100 + startDay
    const end = endMonth * 100 + endDay

    if (start <= end) {
        return current >= start && current <= end
    }
    // Wraps around year (e.g., Dec 20 – Jan 5)
    return current >= start || current <= end
}

/**
 * Enrich a log entry with contextual metadata.
 * @param {object} entry — raw log entry
 * @returns {object} — enriched entry
 */
export function enrichEntry(entry) {
    const date = new Date(entry.created_at || new Date())
    return {
        ...entry,
        is_weekend: isWeekend(date),
        day_of_week: getDayOfWeek(date),
        semester_context: getSemesterContext(date),
        hour_of_day: date.getHours(),
    }
}

/**
 * Fetch weather data from OpenMeteo (free, no API key needed).
 * Non-blocking — returns null on failure.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{temperature: number, weatherCode: number, isRainy: boolean, tempBucket: string} | null>}
 */
export async function fetchWeather(lat = 28.6139, lng = 77.2090) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        const res = await fetch(url, { signal: controller.signal })
        clearTimeout(timeout)

        if (!res.ok) return null

        const data = await res.json()
        const cw = data.current_weather

        const temperature = cw?.temperature ?? null
        const weatherCode = cw?.weathercode ?? 0

        // Rain: weather codes 51-67, 80-82, 95-99 indicate precipitation
        const rainyCodesSet = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])
        const isRainy = rainyCodesSet.has(weatherCode)

        let tempBucket = 'mild'
        if (temperature !== null) {
            if (temperature < 15) tempBucket = 'cold'
            else if (temperature > 35) tempBucket = 'hot'
        }

        return { temperature, weatherCode, isRainy, tempBucket }
    } catch {
        return null
    }
}
