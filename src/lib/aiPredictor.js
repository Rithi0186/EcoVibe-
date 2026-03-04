// ── AI CO₂ Prediction Engine ──────────────────────────────────
// Lightweight statistical predictor — no external ML libraries needed.
// Uses weighted moving average with day-of-week seasonality and trend adjustment.

const GLOBAL_AVG_DAILY_CO2 = 5.2  // kg — India student average estimate
const MIN_CONFIDENCE = 0.15
const MAX_CONFIDENCE = 0.92

/**
 * Predict tomorrow's CO₂ and generate a 3-day forecast.
 * @param {object} features — output of computeFeatures()
 * @returns {{ predictedCO2, confidence, trendForecast, personalizedTips }}
 */
export function predictNextDayCO2(features) {
    if (features.totalDays < 1) {
        return fallbackPrediction()
    }

    const { avg_daily_co2_7d, avg_daily_co2_30d, dow_averages, trend_direction,
        co2_volatility, dailyValues, streak_eco_days } = features

    // ── Base prediction: weighted blend of short-term + long-term ──
    const shortWeight = Math.min(features.totalDays / 7, 1) * 0.6
    const longWeight = Math.min(features.totalDays / 30, 1) * 0.4
    const totalWeight = shortWeight + longWeight || 1
    let base = (avg_daily_co2_7d * shortWeight + avg_daily_co2_30d * longWeight) / totalWeight

    // Fallback if no meaningful data
    if (base === 0) base = GLOBAL_AVG_DAILY_CO2

    // ── Day-of-week seasonality adjustment ──
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDow = tomorrow.getDay()
    const dowFactor = dow_averages[tomorrowDow]
    const overallDowMean = dow_averages.reduce((s, v) => s + v, 0) / 7

    if (overallDowMean > 0 && dowFactor > 0) {
        const seasonality = dowFactor / overallDowMean
        base *= seasonality
    }

    // ── Trend adjustment ──
    if (trend_direction === 'improving') base *= 0.93
    else if (trend_direction === 'worsening') base *= 1.07

    // ── Streak bonus: if user is on a good streak, expect continuation ──
    if (streak_eco_days >= 3) base *= 0.95

    const predictedCO2 = +Math.max(0, base).toFixed(2)

    // ── Confidence score ──
    const confidence = calculateConfidence(features)

    // ── 3-day trend forecast ──
    const trendForecast = generateForecast(base, dow_averages, overallDowMean, trend_direction)

    // ── Personalized tips ──
    const personalizedTips = generateTips(features, predictedCO2)

    return { predictedCO2, confidence, trendForecast, personalizedTips }
}

/**
 * Calculate prediction confidence based on data quality.
 */
function calculateConfidence(features) {
    let score = MIN_CONFIDENCE

    // More data = higher confidence
    const dataDays = Math.min(features.totalDays, 30)
    score += (dataDays / 30) * 0.4

    // Lower volatility = higher confidence
    if (features.co2_volatility > 0) {
        const cvInverse = 1 / (1 + features.co2_volatility / Math.max(features.avg_daily_co2_7d, 1))
        score += cvInverse * 0.2
    }

    // Consistent logging = higher confidence
    if (features.totalEntries > features.totalDays * 1.5) score += 0.1

    return +Math.min(score, MAX_CONFIDENCE).toFixed(2)
}

/**
 * Generate a 3-day forecast array.
 */
function generateForecast(base, dowAverages, overallDowMean, trend) {
    const forecast = []
    const trendMul = trend === 'improving' ? 0.97 : trend === 'worsening' ? 1.03 : 1.0

    for (let i = 1; i <= 3; i++) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + i)
        const dow = futureDate.getDay()

        let dayValue = base
        if (overallDowMean > 0 && dowAverages[dow] > 0) {
            dayValue = base * (dowAverages[dow] / overallDowMean)
        }
        dayValue *= trendMul ** i

        forecast.push({
            date: futureDate.toISOString().split('T')[0],
            dayLabel: futureDate.toLocaleDateString('en', { weekday: 'short' }),
            predictedCO2: +Math.max(0, dayValue).toFixed(2),
        })
    }
    return forecast
}

/**
 * Generate personalized tips based on features and predicted CO₂.
 */
function generateTips(features, predictedCO2) {
    const tips = []

    // Transport tip
    if (features.dominant_transport === 'car') {
        tips.push({
            icon: '🚌',
            title: 'Try public transport',
            description: 'Switching from car to bus can reduce commute emissions by 57%',
            savings: '~2.5 kg/day',
            priority: 'high',
        })
    } else if (features.dominant_transport === 'bike') {
        tips.push({
            icon: '🚌',
            title: 'Consider bus on rainy days',
            description: 'Bus emits less CO₂ than motorbike and keeps you dry',
            savings: '~0.3 kg/trip',
            priority: 'medium',
        })
    }

    // Diet tip
    if (features.meat_ratio > 0.5) {
        tips.push({
            icon: '🥗',
            title: 'Add more veggie meals',
            description: `${Math.round(features.meat_ratio * 100)}% of your meals are non-veg. Even one veggie day cuts 2.5 kg CO₂/week`,
            savings: '~2.5 kg/week',
            priority: 'high',
        })
    }

    // Volatility tip
    if (features.co2_volatility > 3) {
        tips.push({
            icon: '📊',
            title: 'Stabilise your routine',
            description: 'Your CO₂ varies a lot day-to-day. Consistent habits make a bigger impact',
            savings: 'Consistency bonus',
            priority: 'medium',
        })
    }

    // Streak encouragement
    if (features.streak_eco_days >= 3) {
        tips.push({
            icon: '🔥',
            title: `${features.streak_eco_days}-day eco streak!`,
            description: 'Keep going! You\'re below your median CO₂ for the past few days',
            savings: 'Keep it up!',
            priority: 'low',
        })
    }

    // Weekend tip
    if (features.weekend_vs_weekday_delta > 2) {
        tips.push({
            icon: '📅',
            title: 'Watch weekend emissions',
            description: `Weekends add ~${features.weekend_vs_weekday_delta.toFixed(1)} kg CO₂ more than weekdays`,
            savings: `~${features.weekend_vs_weekday_delta.toFixed(1)} kg/day`,
            priority: 'medium',
        })
    }

    // Eco waste
    if (features.eco_waste_ratio < 0.3) {
        tips.push({
            icon: '♻️',
            title: 'Start recycling or composting',
            description: 'Only ' + Math.round(features.eco_waste_ratio * 100) + '% of your waste is eco-managed',
            savings: '~0.5 kg/entry',
            priority: 'medium',
        })
    }

    // Always have at least one tip
    if (tips.length === 0) {
        tips.push({
            icon: '🌟',
            title: 'You\'re doing great!',
            description: 'Your habits are eco-friendly. Keep exploring new ways to stay green',
            savings: 'Keep going!',
            priority: 'low',
        })
    }

    return tips.sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 }
        return (p[a.priority] ?? 1) - (p[b.priority] ?? 1)
    })
}

/**
 * Fallback when < 1 day of data
 */
function fallbackPrediction() {
    return {
        predictedCO2: GLOBAL_AVG_DAILY_CO2,
        confidence: MIN_CONFIDENCE,
        trendForecast: [
            { date: getFutureDate(1), dayLabel: getDayLabel(1), predictedCO2: GLOBAL_AVG_DAILY_CO2 },
            { date: getFutureDate(2), dayLabel: getDayLabel(2), predictedCO2: GLOBAL_AVG_DAILY_CO2 },
            { date: getFutureDate(3), dayLabel: getDayLabel(3), predictedCO2: GLOBAL_AVG_DAILY_CO2 },
        ],
        personalizedTips: [{
            icon: '📝',
            title: 'Start logging!',
            description: 'Log at least 3 days of activities so our AI can learn your patterns',
            savings: 'Unlock predictions',
            priority: 'high',
        }],
    }
}

function getFutureDate(days) {
    const d = new Date(); d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
}

function getDayLabel(days) {
    const d = new Date(); d.setDate(d.getDate() + days)
    return d.toLocaleDateString('en', { weekday: 'short' })
}
