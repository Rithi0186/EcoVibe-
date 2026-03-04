/**
 * EcoTips — Rule-based personalized suggestions
 * Analyzes last 7 days of CO2 logs to provide tips
 */

const TIPS_DATABASE = {
    highTransport: [
        "🚶 Try walking for distances under 2 km — you'll save CO2 and earn more EcoPoints!",
        "🚲 Campus cycling is a great way to cut transport emissions by 80%.",
        "🚌 Group errands together to reduce the number of trips you take.",
        "🤝 Start a carpool group with classmates who live nearby!",
    ],
    highFood: [
        "🥗 Try 'Meatless Mondays' — even one veg day/week cuts food emissions by 15%.",
        "🌱 Campus salad bars are delicious AND have 70% less carbon footprint than non-veg options.",
        "🍽️ Cook in batches to reduce per-meal energy usage and food waste.",
    ],
    highElectricity: [
        "💡 Switch off lights when leaving your room — saves 0.02 kg CO2 per hour.",
        "🔋 Use your laptop on battery mode sometimes to reduce power draw.",
        "❄️ In moderate weather, skip the AC and open a window instead.",
        "📱 Unplug chargers when not in use — phantom power adds up!",
    ],
    lowWaste: [
        "♻️ Set up a recycling corner in your room — it takes 30 seconds to sort!",
        "🌿 Start composting food scraps — many campuses have compost bins.",
        "📦 Reuse packaging and bring your own bags to the campus store.",
    ],
    general: [
        "🌍 Every small action counts! Your daily choices create ripple effects.",
        "📊 Check your CO2 dashboard weekly to spot trends and improve.",
        "🏆 Complete daily challenges to earn bonus EcoPoints!",
        "🤝 Share your sustainability wins on the feed to inspire others.",
        "🎯 Set a personal CO2 reduction goal for this month.",
        "💚 Explore GreenSwap — reuse is the greenest option!",
    ],
}

/**
 * Generate personalized tips based on recent CO2 logs
 * @param {Array} recentLogs - Last 7 days of co2_logs
 * @returns {Array<string>} - 3 personalized tip strings
 */
export function generateEcoTips(recentLogs = []) {
    const tips = []

    if (!recentLogs || recentLogs.length === 0) {
        tips.push("📝 Start logging your daily activities to get personalized eco-tips!")
        tips.push(TIPS_DATABASE.general[0])
        tips.push(TIPS_DATABASE.general[4])
        return tips
    }

    // Analyze patterns
    const transportLogs = recentLogs.filter(l => l.category === 'transport')
    const foodLogs = recentLogs.filter(l => l.category === 'food')
    const electricityLogs = recentLogs.filter(l => l.category === 'electricity')
    const wasteLogs = recentLogs.filter(l => l.category === 'waste')

    const totalTransportCO2 = transportLogs.reduce((s, l) => s + Number(l.co2_kg || 0), 0)
    const totalFoodCO2 = foodLogs.reduce((s, l) => s + Number(l.co2_kg || 0), 0)
    const totalElecCO2 = electricityLogs.reduce((s, l) => s + Number(l.co2_kg || 0), 0)

    // Pick relevant tips
    if (totalTransportCO2 > 2) {
        tips.push(randomPick(TIPS_DATABASE.highTransport))
    }
    if (totalFoodCO2 > 5) {
        tips.push(randomPick(TIPS_DATABASE.highFood))
    }
    if (totalElecCO2 > 1) {
        tips.push(randomPick(TIPS_DATABASE.highElectricity))
    }
    if (wasteLogs.length === 0) {
        tips.push(randomPick(TIPS_DATABASE.lowWaste))
    }

    // Fill remaining with general tips
    while (tips.length < 3) {
        const tip = randomPick(TIPS_DATABASE.general)
        if (!tips.includes(tip)) tips.push(tip)
    }

    return tips.slice(0, 3)
}

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Optional: Call AI API for more personalized tips
 */
export async function generateAITips(recentLogs) {
    const apiKey = import.meta.env.VITE_AI_API_KEY
    if (!apiKey) return generateEcoTips(recentLogs)

    try {
        const totalCO2 = recentLogs.reduce((s, l) => s + Number(l.co2_kg || 0), 0)
        const categories = recentLogs.map(l => l.category).filter(Boolean)
        const prompt = `Given a college student who emitted ${totalCO2.toFixed(1)} kg CO2 this week from activities: ${[...new Set(categories)].join(', ')}. Give 3 short, actionable sustainability tips. Format as a JSON array of strings.`

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        })
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''))
        if (Array.isArray(parsed) && parsed.length >= 3) return parsed.slice(0, 3)
    } catch {
        // Silently fallback
    }

    return generateEcoTips(recentLogs)
}
