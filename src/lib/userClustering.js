// ── User Lifestyle Clustering Module ──────────────────────────
// Rule-based clustering that assigns a lifestyle archetype based on features.
// When a real ML model is available, swap this for K-Means cluster labels.

const ARCHETYPES = {
    eco_champion: {
        id: 'eco_champion',
        label: 'Eco Champion',
        emoji: '🏆',
        color: '#16a34a',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        description: 'You\'re a sustainability superstar! Low emissions across all categories.',
        tips: [
            'Inspire others by sharing your habits on the EcoVibe feed',
            'Try zero-waste challenges to push even further',
            'Consider volunteering for campus green initiatives',
        ],
    },
    green_commuter: {
        id: 'green_commuter',
        label: 'Green Commuter',
        emoji: '🚲',
        color: '#2563eb',
        bg: '#eff6ff',
        border: '#bfdbfe',
        description: 'Your transport choices are great! Room to improve in diet or energy.',
        tips: [
            'Try one vegetarian day per week to boost your score',
            'Reduce AC usage by 1 hour/day for meaningful savings',
            'Your commute is already eco — keep it up!',
        ],
    },
    mindful_eater: {
        id: 'mindful_eater',
        label: 'Mindful Eater',
        emoji: '🥗',
        color: '#d97706',
        bg: '#fffbeb',
        border: '#fde68a',
        description: 'Your diet is planet-friendly! Transport and energy have room to grow.',
        tips: [
            'Switch to bus or carpool for your commute',
            'Turn off lights and electronics when not in use',
            'Your diet is already green — share veggie recipes with friends!',
        ],
    },
    average_student: {
        id: 'average_student',
        label: 'Average Student',
        emoji: '📊',
        color: '#7c3aed',
        bg: '#f5f3ff',
        border: '#ddd6fe',
        description: 'Typical campus habits. Small changes can make a big difference!',
        tips: [
            'Start with one change: walk or bike for short distances',
            'Try the meatless Monday challenge',
            'Recycle or compost to earn bonus EcoPoints',
        ],
    },
    high_impact: {
        id: 'high_impact',
        label: 'High Impact',
        emoji: '🔴',
        color: '#dc2626',
        bg: '#fef2f2',
        border: '#fecaca',
        description: 'Your footprint is above average. Many easy wins available!',
        tips: [
            'Carpooling just 2 days/week can cut commute emissions by 40%',
            'Reducing AC by 2 hours/day saves ~8 kg CO₂/week',
            'Try mixed meals instead of full non-veg — small shifts add up',
        ],
    },
}

/**
 * Classify a user into a lifestyle archetype based on their features.
 * @param {object} features — output of computeFeatures()
 * @returns {object} — archetype object with label, emoji, tips, etc.
 */
export function classifyLifestyle(features) {
    if (features.totalDays < 1) {
        return {
            ...ARCHETYPES.average_student,
            confidence: 'low',
            reason: 'Not enough data yet — log more days for an accurate classification',
        }
    }

    const score = computeEcoScore(features)

    let archetype
    if (score >= 80) {
        archetype = ARCHETYPES.eco_champion
    } else if (score >= 60) {
        // Sub-classify based on strengths
        archetype = getStrengthArchetype(features)
    } else if (score >= 35) {
        archetype = ARCHETYPES.average_student
    } else {
        archetype = ARCHETYPES.high_impact
    }

    return {
        ...archetype,
        score,
        confidence: features.totalDays >= 7 ? 'high' : features.totalDays >= 3 ? 'medium' : 'low',
        reason: generateReason(features, archetype.id),
    }
}

/**
 * Compute an eco-friendliness score (0–100) from features.
 */
function computeEcoScore(features) {
    let score = 50  // baseline

    // Transport (+/- 20 points)
    const ecoTransport = ['walk', 'bicycle', 'bus', 'carpool']
    if (ecoTransport.includes(features.dominant_transport)) score += 15
    else if (features.dominant_transport === 'car') score -= 15
    else if (features.dominant_transport === 'bike') score -= 5

    // Diet (+/- 15 points)
    if (features.meat_ratio <= 0.1) score += 15
    else if (features.meat_ratio <= 0.3) score += 8
    else if (features.meat_ratio > 0.6) score -= 12

    // CO₂ level (+/- 15 points)
    if (features.avg_daily_co2_7d < 2) score += 15
    else if (features.avg_daily_co2_7d < 4) score += 8
    else if (features.avg_daily_co2_7d > 8) score -= 12
    else if (features.avg_daily_co2_7d > 5) score -= 5

    // Eco waste (+/- 10 points)
    if (features.eco_waste_ratio >= 0.7) score += 10
    else if (features.eco_waste_ratio >= 0.3) score += 5
    else if (features.eco_waste_ratio < 0.1) score -= 5

    // Trend bonus (+/- 5 points)
    if (features.trend_direction === 'improving') score += 5
    else if (features.trend_direction === 'worsening') score -= 5

    // Streak bonus
    if (features.streak_eco_days >= 5) score += 5
    else if (features.streak_eco_days >= 3) score += 3

    return Math.max(0, Math.min(100, score))
}

/**
 * For mid-range users (score 60–80), determine if they're a green commuter or mindful eater.
 */
function getStrengthArchetype(features) {
    const ecoTransport = ['walk', 'bicycle', 'bus', 'carpool']
    const isGreenCommuter = ecoTransport.includes(features.dominant_transport)
    const isMindfulEater = features.meat_ratio <= 0.2

    if (isGreenCommuter && !isMindfulEater) return ARCHETYPES.green_commuter
    if (isMindfulEater && !isGreenCommuter) return ARCHETYPES.mindful_eater
    if (isGreenCommuter && isMindfulEater) return ARCHETYPES.eco_champion
    return ARCHETYPES.green_commuter  // default for mid-range
}

function generateReason(features, archetypeId) {
    const parts = []

    if (archetypeId === 'eco_champion') {
        parts.push(`Your 7-day avg is just ${features.avg_daily_co2_7d} kg CO₂/day`)
        if (features.streak_eco_days > 0) parts.push(`${features.streak_eco_days}-day eco streak`)
    } else if (archetypeId === 'high_impact') {
        parts.push(`7-day avg: ${features.avg_daily_co2_7d} kg CO₂/day`)
        if (features.dominant_transport === 'car') parts.push('Primary transport: car')
    } else {
        parts.push(`7-day avg: ${features.avg_daily_co2_7d} kg CO₂/day`)
        parts.push(`Trend: ${features.trend_direction}`)
    }

    return parts.join(' · ')
}

export { ARCHETYPES }
