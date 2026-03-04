// ── Anomaly Detection Module ──────────────────────────────────
// Z-score based spike detection for CO₂ log entries.
// Flags entries that are statistically unusual relative to the user's rolling window.

const Z_MILD = 1.5     // mildly unusual
const Z_HIGH = 2.5     // definitely a spike

/**
 * Detect if the latest log entry is an anomaly.
 * @param {object} features — output of computeFeatures()
 * @returns {{ isAnomaly, severity, zScore, explanation, suggestion }}
 */
export function detectAnomaly(features) {
    const { latest_daily_co2, avg_daily_co2_7d, co2_volatility, totalDays } = features

    // Need at least 3 days for meaningful detection
    if (totalDays < 3 || co2_volatility === 0) {
        return {
            isAnomaly: false,
            severity: 'none',
            zScore: 0,
            explanation: null,
            suggestion: null,
        }
    }

    const zScore = (latest_daily_co2 - avg_daily_co2_7d) / Math.max(co2_volatility, 0.1)

    if (zScore < Z_MILD) {
        return {
            isAnomaly: false,
            severity: 'none',
            zScore: +zScore.toFixed(2),
            explanation: null,
            suggestion: null,
        }
    }

    const isHigh = zScore >= Z_HIGH
    const severity = isHigh ? 'high' : 'mild'
    const excess = +(latest_daily_co2 - avg_daily_co2_7d).toFixed(2)

    const explanation = isHigh
        ? `Today's CO₂ (${latest_daily_co2} kg) is ${excess} kg above your 7-day average — a significant spike!`
        : `Today's CO₂ (${latest_daily_co2} kg) is ${excess} kg above your 7-day average — slightly higher than usual.`

    const suggestion = isHigh
        ? 'Check if there was unusual travel or energy use today. Consider offsets like recycling or walking tomorrow.'
        : 'A small spike is normal. Try to balance it out over the next couple of days.'

    return {
        isAnomaly: true,
        severity,
        zScore: +zScore.toFixed(2),
        explanation,
        suggestion,
    }
}

/**
 * Detect anomalies across a history of daily values.
 * Returns an array of anomaly entries with their dates.
 * @param {Array} dailyValues — from features.dailyValues
 * @returns {Array<{ date, co2, severity, zScore }>}
 */
export function detectHistoricalAnomalies(dailyValues) {
    if (!dailyValues || dailyValues.length < 5) return []

    const anomalies = []

    for (let i = 3; i < dailyValues.length; i++) {
        // Rolling window: last 7 days before this entry
        const windowStart = Math.max(0, i - 7)
        const window = dailyValues.slice(windowStart, i)
        const windowCO2 = window.map(d => d.co2)

        const mean = windowCO2.reduce((s, v) => s + v, 0) / windowCO2.length
        const variance = windowCO2.reduce((s, v) => s + (v - mean) ** 2, 0) / windowCO2.length
        const std = Math.sqrt(variance)

        if (std > 0) {
            const z = (dailyValues[i].co2 - mean) / std
            if (z >= Z_MILD) {
                anomalies.push({
                    date: dailyValues[i].date,
                    co2: dailyValues[i].co2,
                    severity: z >= Z_HIGH ? 'high' : 'mild',
                    zScore: +z.toFixed(2),
                })
            }
        }
    }

    return anomalies
}
