// ============================================================
// localDb.js — localStorage-backed database for EcoVibe
// Replaces Supabase with a fully offline data layer
// ============================================================

const DB_PREFIX = 'ecovibe_'
const SEEDED_KEY = 'ecovibe_seeded'

// ── Helpers ──────────────────────────────────────────────────

function getTable(table) {
    const raw = localStorage.getItem(DB_PREFIX + table)
    return raw ? JSON.parse(raw) : []
}

function setTable(table, rows) {
    localStorage.setItem(DB_PREFIX + table, JSON.stringify(rows))
}

function genId() {
    return crypto.randomUUID()
}

// ── CRUD API ─────────────────────────────────────────────────

export const localDb = {
    /** Get all rows from a table */
    getAll(table) {
        return getTable(table)
    },

    /** Get a single row by ID */
    getById(table, id) {
        return getTable(table).find(r => r.id === id) || null
    },

    /** Insert a new row (auto-generates id and created_at) */
    insert(table, record) {
        const rows = getTable(table)
        const newRow = {
            id: genId(),
            created_at: new Date().toISOString(),
            ...record,
        }
        rows.push(newRow)
        setTable(table, rows)
        return newRow
    },

    /** Insert a row only if a matching row doesn't already exist */
    insertIfNotExists(table, record, matchFn) {
        const rows = getTable(table)
        if (rows.some(matchFn)) return null
        const newRow = { id: genId(), created_at: new Date().toISOString(), ...record }
        rows.push(newRow)
        setTable(table, rows)
        return newRow
    },

    /** Update a row by ID */
    update(table, id, updates) {
        const rows = getTable(table)
        const idx = rows.findIndex(r => r.id === id)
        if (idx === -1) return null
        rows[idx] = { ...rows[idx], ...updates }
        setTable(table, rows)
        return rows[idx]
    },

    /** Delete a row by ID */
    remove(table, id) {
        const rows = getTable(table)
        const filtered = rows.filter(r => r.id !== id)
        setTable(table, filtered)
    },

    /** Delete rows matching a filter */
    removeWhere(table, filterFn) {
        const rows = getTable(table)
        setTable(table, rows.filter(r => !filterFn(r)))
    },

    /** Query rows with a filter function */
    query(table, filterFn) {
        const rows = getTable(table)
        return filterFn ? rows.filter(filterFn) : rows
    },

    /** Count rows matching a filter */
    count(table, filterFn) {
        return this.query(table, filterFn).length
    },
}

// ── Seed Data ────────────────────────────────────────────────

function seedIfNeeded() {
    if (localStorage.getItem(SEEDED_KEY)) return

    // Challenges
    const challenges = [
        { title: 'Walk to Class', description: 'Walk instead of using motorized transport today', frequency: 'daily', points: 15, icon: 'footprints', active: true },
        { title: 'Meatless Monday', description: 'Have only vegetarian meals today', frequency: 'daily', points: 20, icon: 'salad', active: true },
        { title: 'Recycle Right', description: 'Properly recycle at least 3 items today', frequency: 'daily', points: 10, icon: 'recycle', active: true },
        { title: 'Power Down', description: 'Reduce screen time by 2 hours today', frequency: 'daily', points: 10, icon: 'battery-low', active: true },
        { title: 'Green Commute Week', description: 'Use only walking or cycling for 5 days', frequency: 'weekly', points: 75, icon: 'bike', active: true },
        { title: 'Zero Waste Challenge', description: 'Produce no non-recyclable waste for a full week', frequency: 'weekly', points: 100, icon: 'leaf', active: true },
    ]
    challenges.forEach(c => localDb.insert('challenges', c))

    // Rewards
    const rewards = [
        { title: 'Canteen 10% Off', description: '10% discount on your next canteen meal', points_cost: 100, vendor: 'Campus Canteen', icon: 'utensils', active: true },
        { title: 'Free Coffee', description: 'One free coffee at the campus café', points_cost: 50, vendor: 'Campus Café', icon: 'coffee', active: true },
        { title: 'Stationery Coupon', description: '₹50 off on stationery purchases', points_cost: 150, vendor: 'Campus Store', icon: 'pen-tool', active: true },
        { title: 'Event Pass', description: 'Free entry to the next campus cultural event', points_cost: 200, vendor: 'Student Council', icon: 'ticket', active: true },
        { title: 'Plant a Tree', description: 'We plant a tree in your name on campus', points_cost: 300, vendor: 'Green Club', icon: 'tree-pine', active: true },
    ]
    rewards.forEach(r => localDb.insert('rewards', r))

    // Badges
    const badges = [
        { name: 'First Steps', description: 'Logged your first CO2 entry', icon: 'footprints', requirement: 'first_log' },
        { name: 'Eco Warrior', description: 'Completed 10 challenges', icon: 'shield', requirement: '10_challenges' },
        { name: 'Green Trader', description: 'Made your first swap on GreenSwap', icon: 'repeat', requirement: 'first_swap' },
        { name: 'Social Butterfly', description: 'Created 5 posts on the feed', icon: 'message-circle', requirement: '5_posts' },
        { name: 'Point Master', description: 'Earned 500 EcoPoints', icon: 'star', requirement: '500_points' },
        { name: 'Streak Champion', description: 'Maintained a 7-day activity streak', icon: 'flame', requirement: '7_streak' },
        { name: 'Tree Hugger', description: 'Redeemed the Plant a Tree reward', icon: 'tree-pine', requirement: 'tree_reward' },
    ]
    badges.forEach(b => localDb.insert('badges', b))

    // Campus Points
    const campusPoints = [
        { name: 'Main Library', description: 'Central campus library - open 8 AM to 10 PM', lat: 12.9716, lng: 77.5946, map_x: 45, map_y: 30, icon: 'book-open' },
        { name: 'Canteen Block', description: 'Main canteen area with food courts', lat: 12.9720, lng: 77.5950, map_x: 60, map_y: 45, icon: 'utensils' },
        { name: 'Admin Block', description: 'Administrative offices and registration', lat: 12.9712, lng: 77.5942, map_x: 30, map_y: 20, icon: 'building' },
        { name: 'Main Gate', description: 'Primary entrance and security checkpoint', lat: 12.9708, lng: 77.5940, map_x: 15, map_y: 50, icon: 'door-open' },
        { name: 'Hostel Complex', description: 'Student residential area', lat: 12.9724, lng: 77.5954, map_x: 75, map_y: 35, icon: 'home' },
        { name: 'Stationery Shop', description: 'Books and supplies near library', lat: 12.9718, lng: 77.5948, map_x: 50, map_y: 28, icon: 'pencil' },
        { name: 'Pickup Zone', description: 'Designated exchange & pickup area', lat: 12.9714, lng: 77.5944, map_x: 40, map_y: 55, icon: 'package' },
    ]
    campusPoints.forEach(cp => localDb.insert('campus_points', cp))

    localStorage.setItem(SEEDED_KEY, 'true')
}

// Auto-seed on import
seedIfNeeded()
