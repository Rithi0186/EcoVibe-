// ── AI Carbon Lifestyle Analyzer ─────────────────────────────────
// Analyzes WEEKLY lifestyle patterns and projects monthly/annual footprint
// Compares against averages and generates scenario-based recommendations

// ── Weekly lifestyle emission factors ──
const COMMUTE_FACTORS = {
    car: { co2PerKm: 0.21, label: '🚗 Car', alt: 'bus' },
    bus: { co2PerKm: 0.089, label: '🚌 Bus', alt: 'cycle' },
    train: { co2PerKm: 0.041, label: '🚆 Train', alt: 'cycle' },
    cycle: { co2PerKm: 0.0, label: '🚲 Cycle', alt: null },
    walk: { co2PerKm: 0.0, label: '🚶 Walk', alt: null },
    bike: { co2PerKm: 0.103, label: '🏍️ Bike', alt: 'bus' },
}

const DIET_FACTORS = {
    heavy_meat: { co2PerDay: 7.19, label: 'Heavy Meat Eater', desc: 'Meat in most meals' },
    medium_meat: { co2PerDay: 5.63, label: 'Medium Meat Eater', desc: 'Meat a few times/week' },
    low_meat: { co2PerDay: 4.67, label: 'Low Meat Eater', desc: 'Meat once/week' },
    vegetarian: { co2PerDay: 3.81, label: 'Vegetarian', desc: 'No meat, dairy OK' },
    vegan: { co2PerDay: 2.89, label: 'Vegan', desc: 'Plant-based only' },
}

const ENERGY_FACTOR_KWH = 0.82   // kg CO2 per kWh (India grid avg)
const WASTE_FACTOR_KG = 0.58   // kg CO2 per kg landfill waste
const WEEKS_PER_MONTH = 4.33
const WEEKS_PER_YEAR = 52

// ── Average benchmarks (kg CO2/year) ──
const BENCHMARKS = {
    india: 1900,
    world: 4700,
    usa: 15000,
    eu: 6800,
    target: 2300,  // Paris Agreement target per capita
}

// ── Main analyzer function ──
export function analyzeLifestyle({
    commuteMode = 'car',
    commuteDistanceKm = 10,
    commuteDaysPerWeek = 5,
    dietType = 'medium_meat',
    electricityKwhPerWeek = 30,
    wasteKgPerWeek = 3,
    acHoursPerDay = 0,
    shoppingFrequency = 'moderate', // low, moderate, high
}) {
    // ── Weekly CO2 by category ──
    const commuteFactor = COMMUTE_FACTORS[commuteMode]?.co2PerKm ?? 0.21
    const weeklyCommuteCO2 = commuteFactor * commuteDistanceKm * commuteDaysPerWeek

    const dietFactor = DIET_FACTORS[dietType]?.co2PerDay ?? 5.63
    const weeklyDietCO2 = dietFactor * 7

    const weeklyEnergyCO2 = electricityKwhPerWeek * ENERGY_FACTOR_KWH
    const acWeeklyCO2 = acHoursPerDay * 7 * 1.5 * ENERGY_FACTOR_KWH  // AC ~1.5 kWh/hr
    const totalWeeklyEnergyCO2 = weeklyEnergyCO2 + acWeeklyCO2

    const weeklyWasteCO2 = wasteKgPerWeek * WASTE_FACTOR_KG

    const shoppingMultiplier = { low: 0.5, moderate: 1.0, high: 2.0 }[shoppingFrequency] ?? 1.0
    const weeklyShoppingCO2 = 4.2 * shoppingMultiplier  // baseline ~4.2 kg CO2/week from goods

    const totalWeeklyCO2 = weeklyCommuteCO2 + weeklyDietCO2 + totalWeeklyEnergyCO2 + weeklyWasteCO2 + weeklyShoppingCO2

    // ── Projections ──
    const monthlyCO2 = totalWeeklyCO2 * WEEKS_PER_MONTH
    const annualCO2 = totalWeeklyCO2 * WEEKS_PER_YEAR

    // ── Category Breakdown ──
    const categories = [
        { key: 'commute', label: 'Commute', co2: weeklyCommuteCO2, color: '#4caf50' },
        { key: 'diet', label: 'Diet', co2: weeklyDietCO2, color: '#ff9800' },
        { key: 'energy', label: 'Energy & AC', co2: totalWeeklyEnergyCO2, color: '#3b82f6' },
        { key: 'waste', label: 'Waste', co2: weeklyWasteCO2, color: '#ef4444' },
        { key: 'shopping', label: 'Shopping', co2: weeklyShoppingCO2, color: '#a855f7' },
    ].map(cat => ({
        ...cat,
        co2: +cat.co2.toFixed(2),
        percent: totalWeeklyCO2 > 0 ? Math.round((cat.co2 / totalWeeklyCO2) * 100) : 0,
        annualCO2: +(cat.co2 * WEEKS_PER_YEAR).toFixed(0),
    }))

    // ── Highest emitter ──
    const highestEmitter = categories.reduce((a, b) => a.co2 >= b.co2 ? a : b)

    // ── Comparison with benchmarks ──
    const comparison = {
        india: { value: BENCHMARKS.india, label: '🇮🇳 India Avg', ratio: +(annualCO2 / BENCHMARKS.india).toFixed(2) },
        world: { value: BENCHMARKS.world, label: '🌍 World Avg', ratio: +(annualCO2 / BENCHMARKS.world).toFixed(2) },
        target: { value: BENCHMARKS.target, label: '🎯 Paris Target', ratio: +(annualCO2 / BENCHMARKS.target).toFixed(2) },
    }

    // ── Scenario Analysis: "What if you changed X?" ──
    const scenarios = generateScenarios({
        commuteMode, commuteDistanceKm, commuteDaysPerWeek,
        dietType, acHoursPerDay, weeklyCommuteCO2, weeklyDietCO2,
        acWeeklyCO2, totalWeeklyCO2
    })

    // ── Rating ──
    const rating = getLifestyleRating(annualCO2)

    return {
        weekly: +totalWeeklyCO2.toFixed(2),
        monthly: +monthlyCO2.toFixed(1),
        annual: +annualCO2.toFixed(0),
        categories,
        highestEmitter,
        comparison,
        scenarios,
        rating,
    }
}

// ── Scenario generator ──
function generateScenarios({ commuteMode, commuteDistanceKm, commuteDaysPerWeek, dietType, acHoursPerDay, weeklyCommuteCO2, weeklyDietCO2, acWeeklyCO2, totalWeeklyCO2 }) {
    const scenarios = []

    // Commute scenario
    const altMode = COMMUTE_FACTORS[commuteMode]?.alt
    if (altMode && weeklyCommuteCO2 > 0) {
        const altCO2 = (COMMUTE_FACTORS[altMode]?.co2PerKm ?? 0) * commuteDistanceKm * commuteDaysPerWeek
        const savingWeekly = weeklyCommuteCO2 - altCO2
        if (savingWeekly > 0.5) {
            scenarios.push({
                title: `Switch to ${COMMUTE_FACTORS[altMode].label} for commute`,
                savingPerWeek: +savingWeekly.toFixed(2),
                savingPerYear: +(savingWeekly * WEEKS_PER_YEAR).toFixed(0),
                percentReduction: Math.round((savingWeekly / totalWeeklyCO2) * 100),
                icon: '🚌',
            })
        }
    }

    // Work from home scenario
    if (commuteDaysPerWeek >= 3 && weeklyCommuteCO2 > 1) {
        const wfhDays = 2
        const newCommuteCO2 = (COMMUTE_FACTORS[commuteMode]?.co2PerKm ?? 0.21) * commuteDistanceKm * (commuteDaysPerWeek - wfhDays)
        const saving = weeklyCommuteCO2 - newCommuteCO2
        scenarios.push({
            title: `Work from home ${wfhDays} days/week`,
            savingPerWeek: +saving.toFixed(2),
            savingPerYear: +(saving * WEEKS_PER_YEAR).toFixed(0),
            percentReduction: Math.round((saving / totalWeeklyCO2) * 100),
            icon: '🏠',
        })
    }

    // Diet scenario
    const dietOrder = ['heavy_meat', 'medium_meat', 'low_meat', 'vegetarian', 'vegan']
    const idx = dietOrder.indexOf(dietType)
    if (idx >= 0 && idx < dietOrder.length - 1) {
        const nextDiet = dietOrder[idx + 1]
        const newDietWeekly = (DIET_FACTORS[nextDiet]?.co2PerDay ?? 4) * 7
        const saving = weeklyDietCO2 - newDietWeekly
        if (saving > 0.5) {
            scenarios.push({
                title: `Shift to ${DIET_FACTORS[nextDiet].label} diet`,
                savingPerWeek: +saving.toFixed(2),
                savingPerYear: +(saving * WEEKS_PER_YEAR).toFixed(0),
                percentReduction: Math.round((saving / totalWeeklyCO2) * 100),
                icon: '🥗',
            })
        }
    }

    // AC scenario
    if (acHoursPerDay >= 4) {
        const reducedHours = Math.max(acHoursPerDay - 3, 1)
        const newACWeekly = reducedHours * 7 * 1.5 * ENERGY_FACTOR_KWH
        const saving = acWeeklyCO2 - newACWeekly
        if (saving > 0.5) {
            scenarios.push({
                title: `Reduce AC usage by 3 hrs/day`,
                savingPerWeek: +saving.toFixed(2),
                savingPerYear: +(saving * WEEKS_PER_YEAR).toFixed(0),
                percentReduction: Math.round((saving / totalWeeklyCO2) * 100),
                icon: '❄️',
            })
        }
    }

    return scenarios
}

// ── Lifestyle rating ──
function getLifestyleRating(annualCO2) {
    if (annualCO2 <= 1500) return { label: 'Eco Champion 🏆', color: '#16a34a', bg: '#f0fdf4', grade: 'A+' }
    if (annualCO2 <= 2300) return { label: 'Sustainable 🌱', color: '#22c55e', bg: '#f0fdf4', grade: 'A' }
    if (annualCO2 <= 3500) return { label: 'Below Average 👍', color: '#84cc16', bg: '#f7fee7', grade: 'B' }
    if (annualCO2 <= 5000) return { label: 'Average 🌍', color: '#f59e0b', bg: '#fffbeb', grade: 'C' }
    if (annualCO2 <= 8000) return { label: 'Above Average ⚠️', color: '#f97316', bg: '#fff7ed', grade: 'D' }
    return { label: 'High Impact 🔴', color: '#ef4444', bg: '#fef2f2', grade: 'F' }
}

// ── Exports for UI dropdowns ──
export const COMMUTE_OPTIONS = Object.entries(COMMUTE_FACTORS).map(([value, f]) => ({
    value, label: f.label, eco: f.co2PerKm === 0
}))

export const DIET_OPTIONS = Object.entries(DIET_FACTORS).map(([value, f]) => ({
    value, label: f.label, desc: f.desc
}))
