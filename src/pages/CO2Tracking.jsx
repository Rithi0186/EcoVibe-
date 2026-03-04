import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { localDb } from '../lib/localDb'
import { calculateCO2 } from '../lib/co2Calculator'
import { analyzeLifestyle, COMMUTE_OPTIONS, DIET_OPTIONS } from '../lib/carbonEstimator'
import { useAIPrediction } from '../hooks/useAIPrediction'
import {
    Footprints, Utensils, Zap, Trash2, Plus, History,
    CheckCircle, Loader2, ChevronDown, Lightbulb, Calendar,
    Brain, Car, BarChart3, AlertTriangle, RotateCcw, Leaf, TrendingDown,
    Globe, Target, Home, ShoppingBag, Thermometer,
    Sparkles, TrendingUp, Award, Activity, Shield, Info
} from 'lucide-react'

const TRANSPORT_MODES = [
    { value: 'walk', label: '🚶 Walk', eco: true },
    { value: 'bicycle', label: '🚲 Bicycle', eco: true },
    { value: 'bus', label: '🚌 Bus', eco: false },
    { value: 'bike', label: '🏍️ Motorbike', eco: false },
    { value: 'carpool', label: '🚗 Carpool', eco: true },
    { value: 'car', label: '🚘 Car (solo)', eco: false },
]

const FOOD_TYPES = [
    { value: 'veg', label: '🥗 Vegetarian', eco: true },
    { value: 'mixed', label: '🍽️ Mixed', eco: false },
    { value: 'non-veg', label: '🍖 Non-Vegetarian', eco: false },
]

const card = {
    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.06)'
}
const inputStyle = {
    width: '100%', padding: '12px 16px', border: '2px solid #e8f5e9',
    borderRadius: '12px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
    outline: 'none', background: 'white', boxSizing: 'border-box'
}
const btnGreen = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    padding: '14px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
    border: 'none', cursor: 'pointer', width: '100%',
    background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
    color: 'white', boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
}

const optionBtn = (isActive) => ({
    padding: '12px', borderRadius: '12px', border: `2px solid ${isActive ? '#66bb6a' : '#f3f4f6'}`,
    background: isActive ? '#e8f5e9' : 'white', cursor: 'pointer',
    fontSize: '14px', fontWeight: 500, textAlign: 'left', transition: 'all 0.2s'
})

export default function CO2Tracking() {
    const { user, profile, updateProfile } = useAuth()
    const toast = useToast()
    const [activeTab, setActiveTab] = useState('log')
    const [category, setCategory] = useState('transport')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [history, setHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [dateFilter, setDateFilter] = useState('week')

    const [form, setForm] = useState({
        transportMode: 'walk', km: '', foodType: 'veg', meals: '1',
        electricityHours: '', devices: ['laptop'], wasteAction: 'none'
    })

    useEffect(() => { if (activeTab === 'history') loadHistory() }, [activeTab, dateFilter])

    function loadHistory() {
        setHistoryLoading(true)
        try {
            const now = new Date()
            let fromDate
            if (dateFilter === 'week') fromDate = new Date(now.getTime() - 7 * 86400000)
            else if (dateFilter === 'month') fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
            else fromDate = new Date(2020, 0, 1)

            const data = localDb.query('co2_logs', l => l.user_id === user.id && new Date(l.created_at) >= fromDate)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            setHistory(data)
        } catch (err) { console.error(err) }
        finally { setHistoryLoading(false) }
    }

    function updateForm(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

    function toggleDevice(device) {
        setForm(prev => ({
            ...prev,
            devices: prev.devices.includes(device) ? prev.devices.filter(d => d !== device) : [...prev.devices, device]
        }))
    }

    function handleSubmit(e) {
        e.preventDefault()
        setLoading(true); setResult(null)
        try {
            const entry = {
                transportMode: category === 'transport' ? form.transportMode : null,
                km: category === 'transport' ? parseFloat(form.km) || 0 : 0,
                foodType: category === 'food' ? form.foodType : null,
                meals: category === 'food' ? parseInt(form.meals) || 0 : 0,
                electricityHours: category === 'electricity' ? parseFloat(form.electricityHours) || 0 : 0,
                devices: category === 'electricity' ? form.devices : [],
                wasteAction: category === 'waste' ? form.wasteAction : 'none',
            }
            const calc = calculateCO2(entry)
            localDb.insert('co2_logs', {
                user_id: user.id, category,
                transport_mode: entry.transportMode, km: entry.km || null,
                food_type: entry.foodType, meals: entry.meals || null,
                electricity_hours: entry.electricityHours || null,
                waste_action: entry.wasteAction !== 'none' ? entry.wasteAction : null,
                co2_kg: calc.totalCO2, points_earned: calc.totalPoints,
            })
            if (calc.totalPoints > 0 && profile) {
                updateProfile({
                    eco_points: (profile.eco_points || 0) + calc.totalPoints,
                    last_activity_date: new Date().toISOString().split('T')[0],
                })
            }
            setResult(calc)
            toast.success(`Logged ${calc.totalCO2} kg CO2 and earned ${calc.totalPoints} EcoPoints! 🌿`)
        } catch (err) { toast.error(err.message || 'Failed to log entry') }
        finally { setLoading(false) }
    }

    const CATEGORIES = [
        { key: 'transport', icon: Footprints, label: 'Transport', color: '#4caf50' },
        { key: 'food', icon: Utensils, label: 'Food', color: '#f59e0b' },
        { key: 'electricity', icon: Zap, label: 'Electricity', color: '#3b82f6' },
        { key: 'waste', icon: Trash2, label: 'Waste', color: '#8b5cf6' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>CO2 Tracking</h1>
                <p style={{ color: '#9ca3af', marginTop: '4px' }}>Log your daily activities, view history, and estimate your carbon footprint</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[{ key: 'log', icon: Plus, label: 'Log Entry' }, { key: 'history', icon: History, label: 'History' }, { key: 'estimator', icon: Brain, label: 'AI Estimator' }, { key: 'insights', icon: Sparkles, label: 'AI Insights' }].map(t => {
                    const isAI = t.key === 'estimator' || t.key === 'insights'
                    const isActive = activeTab === t.key
                    return (
                        <button key={t.key} onClick={() => { setActiveTab(t.key); if (t.key === 'log') setResult(null); }} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 500,
                            border: 'none', cursor: 'pointer',
                            background: isActive ? (isAI ? '#7c3aed' : '#4caf50') : 'white',
                            color: isActive ? 'white' : '#6b7280',
                            boxShadow: isActive ? (isAI ? '0 4px 12px rgba(124,58,237,0.3)' : '0 4px 12px rgba(76,175,80,0.3)') : 'none'
                        }}>
                            <t.icon size={16} /> {t.label}
                        </button>
                    )
                })}
            </div>

            {activeTab === 'log' && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }} className="co2-grid">
                    <div>
                        {/* Category Selector */}
                        <div style={{ ...card, padding: '24px', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#4b5563', marginBottom: '12px' }}>Select Category</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }} className="cat-grid">
                                {CATEGORIES.map(cat => (
                                    <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                        padding: '16px', borderRadius: '12px', cursor: 'pointer',
                                        border: `2px solid ${category === cat.key ? '#66bb6a' : '#f3f4f6'}`,
                                        background: category === cat.key ? '#e8f5e9' : 'white'
                                    }}>
                                        <cat.icon size={22} color={category === cat.key ? '#43a047' : '#9ca3af'} />
                                        <span style={{ fontSize: '14px', fontWeight: 500, color: category === cat.key ? '#2e7d32' : '#6b7280' }}>{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form */}
                        <div style={{ ...card, padding: '24px' }}>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {category === 'transport' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Mode of Transport</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }} className="mode-grid">
                                                {TRANSPORT_MODES.map(m => (
                                                    <button key={m.value} type="button" onClick={() => updateForm('transportMode', m.value)} style={optionBtn(form.transportMode === m.value)}>
                                                        {m.label}
                                                        {m.eco && <span style={{ display: 'block', fontSize: '10px', color: '#4caf50' }}>Eco-friendly</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Distance (km)</label>
                                            <input type="number" style={inputStyle} placeholder="e.g. 5" value={form.km} onChange={e => updateForm('km', e.target.value)} min="0" step="0.1" />
                                        </div>
                                    </>
                                )}

                                {category === 'food' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Meal Type</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                                {FOOD_TYPES.map(f => (
                                                    <button key={f.value} type="button" onClick={() => updateForm('foodType', f.value)} style={optionBtn(form.foodType === f.value)}>
                                                        {f.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Number of Meals</label>
                                            <input type="number" style={inputStyle} value={form.meals} onChange={e => updateForm('meals', e.target.value)} min="1" max="10" />
                                        </div>
                                    </>
                                )}

                                {category === 'electricity' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Devices Used</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {['fan', 'light', 'laptop', 'ac'].map(d => (
                                                    <button key={d} type="button" onClick={() => toggleDevice(d)} style={{
                                                        padding: '8px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 500,
                                                        textTransform: 'capitalize', cursor: 'pointer',
                                                        border: `2px solid ${form.devices.includes(d) ? '#66bb6a' : '#f3f4f6'}`,
                                                        background: form.devices.includes(d) ? '#e8f5e9' : 'white',
                                                        color: form.devices.includes(d) ? '#2e7d32' : '#6b7280'
                                                    }}>
                                                        {d === 'ac' ? 'AC' : d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Hours of Usage</label>
                                            <input type="number" style={inputStyle} placeholder="e.g. 3" value={form.electricityHours} onChange={e => updateForm('electricityHours', e.target.value)} min="0" step="0.5" />
                                        </div>
                                    </>
                                )}

                                {category === 'waste' && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Waste Action</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                            {[{ value: 'recycled', label: '♻️ Recycled' }, { value: 'composted', label: '🌿 Composted' }, { value: 'none', label: '🗑️ Regular' }].map(w => (
                                                <button key={w.value} type="button" onClick={() => updateForm('wasteAction', w.value)} style={optionBtn(form.wasteAction === w.value)}>
                                                    {w.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button type="submit" disabled={loading} style={btnGreen}>
                                    {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={18} />}
                                    {loading ? 'Logging...' : 'Log Activity'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Result Card */}
                    <div>
                        {result ? (
                            <div style={{ ...card, padding: '24px', border: '2px solid #a5d6a7', background: 'linear-gradient(135deg, #e8f5e9, #ecfdf5)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <CheckCircle size={20} color="#4caf50" />
                                    <h3 style={{ fontWeight: 700, color: '#2e7d32' }}>Activity Logged!</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'white', borderRadius: '12px' }}>
                                        <span style={{ fontSize: '14px', color: '#6b7280' }}>CO2 Emitted</span>
                                        <span style={{ fontWeight: 700, color: '#1f2937' }}>{result.totalCO2} kg</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'white', borderRadius: '12px' }}>
                                        <span style={{ fontSize: '14px', color: '#6b7280' }}>EcoPoints Earned</span>
                                        <span style={{ fontWeight: 700, color: '#43a047' }}>+{result.totalPoints} pts</span>
                                    </div>
                                    {Object.entries(result.breakdown).map(([key, val]) => (
                                        <div key={key} style={{ padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>{key}</p>
                                            <p style={{ fontSize: '14px', color: '#4b5563' }}>{val.co2.toFixed(2)} kg CO2 · {val.points} pts</p>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '16px', padding: '12px', background: '#fffde7', borderRadius: '12px', display: 'flex', gap: '8px' }}>
                                    <Lightbulb size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <p style={{ fontSize: '12px', color: '#b45309' }}>
                                        {result.totalCO2 < 1 ? "Great job! Your emissions are low today. Keep it up! 🌟" : "Consider eco-friendly alternatives to reduce your footprint. Every bit helps! 🌱"}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ ...card, padding: '24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌿</div>
                                <h3 style={{ fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Track Your Impact</h3>
                                <p style={{ fontSize: '14px', color: '#9ca3af' }}>Log your daily activities and see how your choices affect the planet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                /* History Tab */
                <div style={{ ...card, padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 style={{ fontWeight: 600, color: '#374151' }}>Activity History</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['week', 'month', 'all'].map(f => (
                                <button key={f} onClick={() => setDateFilter(f)} style={{
                                    padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                                    textTransform: 'capitalize', border: 'none', cursor: 'pointer',
                                    background: dateFilter === f ? '#4caf50' : '#f3f4f6',
                                    color: dateFilter === f ? 'white' : '#6b7280'
                                }}>
                                    {f === 'all' ? 'All Time' : `This ${f}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {historyLoading ? (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <Loader2 size={24} color="#4caf50" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                        </div>
                    ) : history.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#9ca3af' }}>
                                        <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Date</th>
                                        <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Category</th>
                                        <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Details</th>
                                        <th style={{ paddingBottom: '12px', fontWeight: 500, textAlign: 'right' }}>CO2 (kg)</th>
                                        <th style={{ paddingBottom: '12px', fontWeight: 500, textAlign: 'right' }}>Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(log => (
                                        <tr key={log.id} style={{ borderTop: '1px solid #f9fafb' }}>
                                            <td style={{ padding: '12px 0', color: '#4b5563' }}>{new Date(log.created_at).toLocaleDateString()}</td>
                                            <td style={{ padding: '12px 0' }}>
                                                <span style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: '8px', background: '#e8f5e9', color: '#2e7d32', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize' }}>{log.category}</span>
                                            </td>
                                            <td style={{ padding: '12px 0', color: '#6b7280' }}>
                                                {log.transport_mode && `${log.transport_mode} · ${log.km} km`}
                                                {log.food_type && `${log.food_type} · ${log.meals} meal(s)`}
                                                {log.electricity_hours && `${log.electricity_hours} hrs`}
                                                {log.waste_action && log.waste_action}
                                            </td>
                                            <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 500 }}>{Number(log.co2_kg).toFixed(2)}</td>
                                            <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 500, color: '#43a047' }}>+{log.points_earned}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                            <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                            <p>No entries found for this period</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'estimator' && <EstimatorTab />}
            {activeTab === 'insights' && <AIInsightsTab user={user} />}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 1023px) {
                    .co2-grid { grid-template-columns: 1fr !important; }
                    .estimator-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .cat-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .mode-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .transport-grid { grid-template-columns: repeat(3, 1fr) !important; }
                }
            `}</style>
        </div>
    )
}

// ── AI Lifestyle Carbon Analyzer Tab ────────────────────────────
const CAT_ICONS = { commute: Car, diet: Utensils, energy: Zap, waste: Trash2, shopping: ShoppingBag }

function EstimatorTab() {
    const [form, setForm] = useState({
        commuteMode: 'car', commuteDistanceKm: '', commuteDaysPerWeek: 5,
        dietType: 'medium_meat',
        electricityKwhPerWeek: '', acHoursPerDay: '',
        wasteKgPerWeek: '', shoppingFrequency: 'moderate',
    })
    const [result, setResult] = useState(null)
    const [animating, setAnimating] = useState(false)

    function update(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

    function handleAnalyze(e) {
        e.preventDefault()
        setAnimating(true)
        setResult(null)
        setTimeout(() => {
            const res = analyzeLifestyle({
                commuteMode: form.commuteMode,
                commuteDistanceKm: parseFloat(form.commuteDistanceKm) || 10,
                commuteDaysPerWeek: parseInt(form.commuteDaysPerWeek) || 5,
                dietType: form.dietType,
                electricityKwhPerWeek: parseFloat(form.electricityKwhPerWeek) || 30,
                acHoursPerDay: parseFloat(form.acHoursPerDay) || 0,
                wasteKgPerWeek: parseFloat(form.wasteKgPerWeek) || 3,
                shoppingFrequency: form.shoppingFrequency,
            })
            setResult(res)
            setAnimating(false)
        }, 1200)
    }

    function handleReset() {
        setForm({
            commuteMode: 'car', commuteDistanceKm: '', commuteDaysPerWeek: 5,
            dietType: 'medium_meat', electricityKwhPerWeek: '', acHoursPerDay: '',
            wasteKgPerWeek: '', shoppingFrequency: 'moderate',
        })
        setResult(null)
    }

    const selectStyle = {
        ...inputStyle,
        appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Input Form + Results */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="estimator-grid">
                <div style={{ ...card, padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Brain size={18} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>Your Weekly Lifestyle</h2>
                            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Tell us about your typical week</p>
                        </div>
                    </div>

                    <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Commute */}
                        <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>🚗 Daily Commute</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Mode</label>
                                    <select value={form.commuteMode} onChange={e => update('commuteMode', e.target.value)} style={selectStyle}>
                                        {COMMUTE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}{o.eco ? ' ✓' : ''}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Distance (km one-way)</label>
                                    <input type="number" style={inputStyle} placeholder="e.g. 10" min="0" step="0.5"
                                        value={form.commuteDistanceKm} onChange={e => update('commuteDistanceKm', e.target.value)} />
                                </div>
                            </div>
                            <div style={{ marginTop: '8px' }}>
                                <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Days per week</label>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                        <button key={d} type="button" onClick={() => update('commuteDaysPerWeek', d)} style={{
                                            flex: 1, padding: '8px 0', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                            border: 'none', cursor: 'pointer',
                                            background: form.commuteDaysPerWeek === d ? '#7c3aed' : 'white',
                                            color: form.commuteDaysPerWeek === d ? 'white' : '#6b7280',
                                        }}>{d}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Diet */}
                        <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>🍽️ Diet Type</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {DIET_OPTIONS.map(d => (
                                    <button key={d.value} type="button" onClick={() => update('dietType', d.value)} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 12px', borderRadius: '8px', fontSize: '13px',
                                        border: `2px solid ${form.dietType === d.value ? '#7c3aed' : '#f3f4f6'}`,
                                        background: form.dietType === d.value ? '#f3e8ff' : 'white',
                                        color: form.dietType === d.value ? '#7c3aed' : '#374151',
                                        cursor: 'pointer', textAlign: 'left',
                                    }}>
                                        <span style={{ fontWeight: 500 }}>{d.label}</span>
                                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{d.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Energy & AC */}
                        <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '12px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>⚡ Energy Usage</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Electricity (kWh/week)</label>
                                    <input type="number" style={inputStyle} placeholder="e.g. 30" min="0"
                                        value={form.electricityKwhPerWeek} onChange={e => update('electricityKwhPerWeek', e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>AC hours/day</label>
                                    <input type="number" style={inputStyle} placeholder="e.g. 4" min="0" max="24"
                                        value={form.acHoursPerDay} onChange={e => update('acHoursPerDay', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Waste & Shopping */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '12px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>🗑️ Waste (kg/week)</label>
                                <input type="number" style={inputStyle} placeholder="e.g. 3" min="0" step="0.5"
                                    value={form.wasteKgPerWeek} onChange={e => update('wasteKgPerWeek', e.target.value)} />
                            </div>
                            <div style={{ padding: '14px', background: '#f9fafb', borderRadius: '12px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>🛍️ Shopping</label>
                                <select value={form.shoppingFrequency} onChange={e => update('shoppingFrequency', e.target.value)} style={selectStyle}>
                                    <option value="low">Low (minimal)</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="high">High (frequent)</option>
                                </select>
                            </div>
                        </div>

                        {/* Submit */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" disabled={animating} style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 600,
                                border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                                color: 'white', boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
                            }}>
                                {animating
                                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing Lifestyle...</>
                                    : <><Brain size={18} /> Analyze My Lifestyle</>}
                            </button>
                            {result && (
                                <button type="button" onClick={handleReset} style={{
                                    padding: '14px 16px', borderRadius: '12px',
                                    border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#6b7280'
                                }}><RotateCcw size={16} /></button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Results Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {result ? (
                        <>
                            {/* Annual Projection */}
                            <div style={{
                                ...card, padding: '24px',
                                background: `linear-gradient(135deg, ${result.rating.bg}, white)`,
                                border: `2px solid ${result.rating.color}30`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <h3 style={{ fontWeight: 700, color: '#1f2937', fontSize: '15px' }}>Your Carbon Footprint</h3>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                                        color: result.rating.color, background: result.rating.bg,
                                        border: `1px solid ${result.rating.color}40`
                                    }}>Grade {result.rating.grade} · {result.rating.label}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                                    {[
                                        { label: 'Weekly', value: result.weekly, unit: 'kg' },
                                        { label: 'Monthly', value: result.monthly, unit: 'kg' },
                                        { label: 'Annual', value: result.annual, unit: 'kg' },
                                    ].map((p, i) => (
                                        <div key={i} style={{
                                            textAlign: 'center', padding: '12px', borderRadius: '10px',
                                            background: i === 2 ? `${result.rating.color}15` : '#f9fafb'
                                        }}>
                                            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{p.label}</p>
                                            <p style={{ fontSize: i === 2 ? '28px' : '20px', fontWeight: 800, color: i === 2 ? result.rating.color : '#1f2937', lineHeight: 1.1 }}>
                                                {p.value.toLocaleString()}
                                            </p>
                                            <p style={{ fontSize: '11px', color: '#9ca3af' }}>{p.unit} CO₂</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Benchmark Comparison */}
                            <div style={{ ...card, padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                    <Globe size={16} color="#7c3aed" />
                                    <h3 style={{ fontWeight: 700, color: '#1f2937', fontSize: '14px' }}>How You Compare</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {Object.values(result.comparison).map((c, i) => (
                                        <div key={i}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '13px', color: '#374151' }}>{c.label} ({c.value.toLocaleString()} kg/yr)</span>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: c.ratio <= 1 ? '#22c55e' : '#ef4444' }}>
                                                    {c.ratio <= 1 ? `${Math.round((1 - c.ratio) * 100)}% below` : `${Math.round((c.ratio - 1) * 100)}% above`}
                                                </span>
                                            </div>
                                            <div style={{ height: '6px', borderRadius: '3px', background: '#f3f4f6', overflow: 'hidden', position: 'relative' }}>
                                                <div style={{
                                                    position: 'absolute', height: '100%', borderRadius: '3px',
                                                    background: c.ratio <= 1 ? '#22c55e' : '#f59e0b',
                                                    width: `${Math.min(c.ratio * 100, 100)}%`,
                                                    transition: 'width 0.8s ease-out',
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ ...card, padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
                                background: 'linear-gradient(135deg, #ede9fe, #f3e8ff)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Brain size={36} color="#7c3aed" style={{ opacity: 0.7 }} />
                            </div>
                            <h3 style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', fontSize: '18px' }}>AI Lifestyle Analyzer</h3>
                            <p style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '320px', lineHeight: 1.6 }}>
                                Enter your weekly habits and get a complete carbon footprint analysis with annual projections, global comparisons, and personalized "what-if" scenarios.
                            </p>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '11px', color: '#9ca3af' }}>
                                {['🚗 Commute', '🍽️ Diet', '⚡ Energy', '🗑️ Waste', '🛍️ Shopping'].map((item, i) => (
                                    <span key={i} style={{ padding: '6px 12px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #f3f4f6' }}>{item}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom: Category breakdown + Scenarios */}
            {result && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="estimator-grid">
                    {/* Category Breakdown */}
                    <div style={{ ...card, padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <BarChart3 size={16} color="#7c3aed" />
                            <h3 style={{ fontWeight: 700, color: '#1f2937', fontSize: '14px' }}>Weekly Breakdown by Category</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {result.categories.map(cat => {
                                const Icon = CAT_ICONS[cat.key] || Leaf
                                const isHighest = cat.key === result.highestEmitter.key && cat.co2 > 0
                                return (
                                    <div key={cat.key}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Icon size={14} color={cat.color} />
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{cat.label}</span>
                                                {isHighest && (
                                                    <span style={{
                                                        fontSize: '9px', fontWeight: 600, color: '#dc2626',
                                                        background: '#fef2f2', padding: '2px 6px', borderRadius: '4px',
                                                        border: '1px solid #fecaca'
                                                    }}>▲ Highest</span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: cat.color }}>
                                                {cat.co2} kg/wk · {cat.annualCO2} kg/yr ({cat.percent}%)
                                            </span>
                                        </div>
                                        <div style={{ height: '8px', borderRadius: '4px', background: '#f3f4f6', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: '4px',
                                                background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)`,
                                                width: `${cat.percent}%`, transition: 'width 0.8s ease-out',
                                                minWidth: cat.co2 > 0 ? '4px' : '0'
                                            }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* What-If Scenarios */}
                    <div style={{ ...card, padding: '24px', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid #bbf7d0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Lightbulb size={16} color="white" />
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, color: '#166534', fontSize: '14px' }}>What-If Scenarios</h3>
                                <p style={{ fontSize: '11px', color: '#15803d' }}>Small changes that make a big difference</p>
                            </div>
                        </div>
                        {result.scenarios.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {result.scenarios.map((s, i) => (
                                    <div key={i} style={{
                                        padding: '14px', borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.8)', border: '1px solid #dcfce7',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '18px' }}>{s.icon}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{s.title}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                            <span style={{ color: '#22c55e', fontWeight: 600 }}>-{s.savingPerWeek} kg/week</span>
                                            <span style={{ color: '#16a34a', fontWeight: 700 }}>-{s.savingPerYear} kg/year</span>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '10px',
                                                background: '#dcfce7', color: '#166534', fontWeight: 600
                                            }}>{s.percentReduction}% reduction</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#15803d', fontSize: '14px' }}>
                                <Leaf size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                <p>You're already making great eco choices! 🎉</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── AI Insights Tab ─────────────────────────────────────────────
function AIInsightsTab({ user }) {
    const { prediction, features, anomaly, archetype, loading, error, logsCount } = useAIPrediction(user?.id)

    if (loading) {
        return (
            <div style={{ ...card, padding: '60px 24px', textAlign: 'center' }}>
                <Loader2 size={32} color="#7c3aed" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#9ca3af', fontSize: '15px' }}>Analyzing your carbon data with AI...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ ...card, padding: '40px 24px', textAlign: 'center', border: '1px solid #fed7aa' }}>
                <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Could Not Load AI Insights</h3>
                <p style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '400px', margin: '0 auto' }}>
                    {error.includes('timeout') || error.includes('abort')
                        ? 'Data is unavailable. Please try again later.'
                        : `Error: ${error}`}
                </p>
            </div>
        )
    }

    // Not enough data
    if (!features || features.totalDays < 1) {
        return (
            <div style={{ ...card, padding: '60px 24px', textAlign: 'center' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
                    background: 'linear-gradient(135deg, #ede9fe, #f3e8ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Sparkles size={36} color="#7c3aed" style={{ opacity: 0.7 }} />
                </div>
                <h3 style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', fontSize: '18px' }}>Unlock AI Insights</h3>
                <p style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '380px', margin: '0 auto', lineHeight: 1.6 }}>
                    Log your daily activities in the <strong>Log Entry</strong> tab to unlock AI-powered predictions,
                    anomaly detection, and your personal eco archetype.
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                    {['🤖 Predictions', '📊 Anomaly Alerts', '🏆 Archetype', '💡 Smart Tips'].map((item, i) => (
                        <span key={i} style={{ padding: '6px 14px', borderRadius: '20px', background: '#f5f3ff', border: '1px solid #e9d5ff', fontSize: '12px', color: '#7c3aed', fontWeight: 500 }}>{item}</span>
                    ))}
                </div>
            </div>
        )
    }

    const pred = prediction
    const maxForecastCO2 = Math.max(...(pred?.trendForecast || []).map(f => f.predictedCO2), pred?.predictedCO2 || 0, 1)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top row: Prediction + Archetype */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="estimator-grid">
                {/* Prediction Card */}
                <div style={{
                    ...card, padding: '24px',
                    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                    border: '1px solid #ddd6fe'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Brain size={18} color="white" />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 700, color: '#1f2937', fontSize: '15px' }}>Tomorrow's Prediction</h3>
                            <p style={{ fontSize: '11px', color: '#9ca3af' }}>Based on {features.totalDays} days of data</p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <p style={{ fontSize: '42px', fontWeight: 800, color: '#7c3aed', lineHeight: 1 }}>
                            {pred?.predictedCO2 ?? '—'}
                        </p>
                        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>kg CO₂ predicted</p>
                    </div>

                    {/* Confidence bar */}
                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#9ca3af' }}>Confidence</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#7c3aed' }}>{Math.round((pred?.confidence ?? 0) * 100)}%</span>
                        </div>
                        <div style={{ height: '6px', borderRadius: '3px', background: '#e9d5ff', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: '3px',
                                background: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
                                width: `${(pred?.confidence ?? 0) * 100}%`,
                                transition: 'width 0.8s ease-out',
                            }} />
                        </div>
                    </div>

                    {/* 3-day Forecast Sparkline */}
                    {pred?.trendForecast && (
                        <div>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>3-Day Forecast</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {pred.trendForecast.map((f, i) => (
                                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{
                                            height: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '6px'
                                        }}>
                                            <div style={{
                                                width: '100%', maxWidth: '40px',
                                                height: `${Math.max(8, (f.predictedCO2 / maxForecastCO2) * 48)}px`,
                                                borderRadius: '6px 6px 2px 2px',
                                                background: `linear-gradient(180deg, #a78bfa, #7c3aed)`,
                                                opacity: 1 - i * 0.15,
                                                transition: 'height 0.6s ease-out',
                                            }} />
                                        </div>
                                        <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151' }}>{f.predictedCO2}</p>
                                        <p style={{ fontSize: '10px', color: '#9ca3af' }}>{f.dayLabel}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Archetype Badge */}
                {archetype && (
                    <div style={{
                        ...card, padding: '24px',
                        background: `linear-gradient(135deg, ${archetype.bg}, white)`,
                        border: `1px solid ${archetype.border}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <Award size={18} color={archetype.color} />
                            <h3 style={{ fontWeight: 700, color: '#1f2937', fontSize: '15px' }}>Your Eco Archetype</h3>
                        </div>

                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>{archetype.emoji}</div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: archetype.color, marginBottom: '4px' }}>
                                {archetype.label}
                            </h2>
                            {archetype.score !== undefined && (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', background: `${archetype.color}15`, marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: archetype.color }}>Score: {archetype.score}/100</span>
                                </div>
                            )}
                            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.6, maxWidth: '320px', margin: '8px auto 0' }}>
                                {archetype.description}
                            </p>
                            {archetype.confidence && (
                                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>
                                    Confidence: {archetype.confidence} · {archetype.reason}
                                </p>
                            )}
                        </div>

                        {/* Archetype tips */}
                        <div style={{ marginTop: '12px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Tips for you:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {(archetype.tips || []).slice(0, 3).map((tip, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                                        padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.7)',
                                    }}>
                                        <Leaf size={12} color={archetype.color} style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.5 }}>{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Anomaly Alert (if applicable) */}
            {anomaly?.isAnomaly && (
                <div style={{
                    ...card, padding: '16px 20px',
                    background: anomaly.severity === 'high'
                        ? 'linear-gradient(135deg, #fef2f2, #fff1f2)'
                        : 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                    border: `1px solid ${anomaly.severity === 'high' ? '#fecaca' : '#fde68a'}`,
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                        background: anomaly.severity === 'high' ? '#fee2e2' : '#fef3c7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <AlertTriangle size={18} color={anomaly.severity === 'high' ? '#dc2626' : '#d97706'} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ fontWeight: 700, color: anomaly.severity === 'high' ? '#dc2626' : '#d97706', fontSize: '14px', marginBottom: '4px' }}>
                            {anomaly.severity === 'high' ? '⚠️ CO₂ Spike Detected!' : '📊 Slightly Above Average'}
                        </h4>
                        <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, marginBottom: '4px' }}>{anomaly.explanation}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>{anomaly.suggestion}</p>
                    </div>
                </div>
            )}

            {/* Bottom row: Feature Summary + Personalized Tips */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="estimator-grid">
                {/* Feature Summary */}
                <div style={{ ...card, padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Activity size={16} color="#7c3aed" />
                        <h3 style={{ fontWeight: 700, color: '#1f2937', fontSize: '14px' }}>Your Stats</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {[
                            { label: '7-Day Avg', value: `${features.avg_daily_co2_7d} kg`, color: '#7c3aed' },
                            { label: '30-Day Avg', value: `${features.avg_daily_co2_30d} kg`, color: '#3b82f6' },
                            { label: 'Volatility', value: `±${features.co2_volatility} kg`, color: features.co2_volatility > 3 ? '#f59e0b' : '#22c55e' },
                            { label: 'Eco Streak', value: `${features.streak_eco_days} days`, color: features.streak_eco_days >= 3 ? '#22c55e' : '#6b7280' },
                            { label: 'Top Transport', value: features.dominant_transport, color: '#4b5563' },
                            { label: 'Trend', value: features.trend_direction === 'improving' ? '📉 Improving' : features.trend_direction === 'worsening' ? '📈 Worsening' : '➡️ Stable', color: features.trend_direction === 'improving' ? '#22c55e' : features.trend_direction === 'worsening' ? '#ef4444' : '#6b7280' },
                        ].map((s, i) => (
                            <div key={i} style={{
                                padding: '12px', borderRadius: '10px', background: '#f9fafb',
                                border: '1px solid #f3f4f6',
                            }}>
                                <p style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</p>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: s.color, textTransform: 'capitalize' }}>{s.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Tips */}
                <div style={{
                    ...card, padding: '24px',
                    background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                    border: '1px solid #bbf7d0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Lightbulb size={16} color="white" />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 700, color: '#166534', fontSize: '14px' }}>AI-Powered Tips</h3>
                            <p style={{ fontSize: '11px', color: '#15803d' }}>Personalized for your habits</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(pred?.personalizedTips || []).map((tip, i) => (
                            <div key={i} style={{
                                padding: '14px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.8)', border: '1px solid #dcfce7',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '18px' }}>{tip.icon}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{tip.title}</span>
                                    {tip.priority === 'high' && (
                                        <span style={{
                                            fontSize: '9px', fontWeight: 700, color: '#dc2626',
                                            background: '#fef2f2', padding: '2px 6px', borderRadius: '4px',
                                            border: '1px solid #fecaca', marginLeft: 'auto'
                                        }}>HIGH</span>
                                    )}
                                </div>
                                <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5, marginBottom: '4px' }}>{tip.description}</p>
                                <span style={{
                                    display: 'inline-block', padding: '2px 8px', borderRadius: '10px',
                                    background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: 600,
                                }}>{tip.savings}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Data quality note */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '10px',
                background: '#f9fafb', border: '1px solid #f3f4f6',
            }}>
                <Info size={14} color="#9ca3af" />
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                    AI predictions are based on {features.totalEntries} log entries over {features.totalDays} days.
                    More data = better predictions. Keep logging daily!
                </p>
            </div>
        </div>
    )
}
