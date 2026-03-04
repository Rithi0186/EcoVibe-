import { useState } from 'react'
import { estimateCarbon, TRANSPORT_OPTIONS } from '../lib/carbonEstimator'
import {
    Brain, Car, Zap, Trash2, Calculator, Lightbulb, BarChart3,
    AlertTriangle, Loader2, RotateCcw, Leaf, TrendingDown
} from 'lucide-react'

const card = {
    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.06)'
}
const inputStyle = {
    width: '100%', padding: '12px 16px', border: '2px solid #e8f5e9',
    borderRadius: '12px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
    outline: 'none', background: 'white', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
}
const labelStyle = {
    display: 'block', fontSize: '14px', fontWeight: 500,
    color: '#374151', marginBottom: '6px'
}

const CATEGORY_ICONS = { transport: Car, energy: Zap, waste: Trash2 }

export default function CarbonEstimator() {
    const [form, setForm] = useState({
        distance: '', transportType: 'car', energyConsumed: '', wasteGenerated: ''
    })
    const [result, setResult] = useState(null)
    const [animating, setAnimating] = useState(false)

    function update(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

    function handleEstimate(e) {
        e.preventDefault()
        setAnimating(true)
        setResult(null)
        // Brief delay to simulate "AI analysis"
        setTimeout(() => {
            const res = estimateCarbon({
                distance: parseFloat(form.distance) || 0,
                transportType: form.transportType,
                energyConsumed: parseFloat(form.energyConsumed) || 0,
                wasteGenerated: parseFloat(form.wasteGenerated) || 0,
            })
            setResult(res)
            setAnimating(false)
        }, 800)
    }

    function handleReset() {
        setForm({ distance: '', transportType: 'car', energyConsumed: '', wasteGenerated: '' })
        setResult(null)
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Brain size={28} color="#7c3aed" /> Carbon Footprint Estimator
                </h1>
                <p style={{ color: '#9ca3af', marginTop: '4px' }}>
                    AI-powered analysis of your daily carbon emissions with personalized tips
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="estimator-grid">
                {/* ── Input Form ─────────────────────────────────── */}
                <div style={{ ...card, padding: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Calculator size={18} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>Enter Your Data</h2>
                            <p style={{ fontSize: '12px', color: '#9ca3af' }}>Fill in your daily activity details</p>
                        </div>
                    </div>

                    <form onSubmit={handleEstimate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Transport Type */}
                        <div>
                            <label style={labelStyle}>🚗 Transport Type</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }} className="transport-grid">
                                {TRANSPORT_OPTIONS.map(opt => (
                                    <button key={opt.value} type="button" onClick={() => update('transportType', opt.value)} style={{
                                        padding: '10px 4px', borderRadius: '10px', fontSize: '12px', fontWeight: 500,
                                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                        border: `2px solid ${form.transportType === opt.value ? '#7c3aed' : '#f3f4f6'}`,
                                        background: form.transportType === opt.value ? '#f3e8ff' : 'white',
                                        color: form.transportType === opt.value ? '#7c3aed' : '#6b7280',
                                    }}>
                                        {opt.label}
                                        {opt.eco && <div style={{ fontSize: '9px', color: '#22c55e', marginTop: '2px' }}>Eco ✓</div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Distance */}
                        <div>
                            <label style={labelStyle}>📏 Distance Traveled (km)</label>
                            <input type="number" style={inputStyle} placeholder="e.g. 15"
                                value={form.distance} onChange={e => update('distance', e.target.value)}
                                min="0" step="0.1"
                                onFocus={e => e.target.style.borderColor = '#a78bfa'}
                                onBlur={e => e.target.style.borderColor = '#e8f5e9'}
                            />
                        </div>

                        {/* Energy */}
                        <div>
                            <label style={labelStyle}>⚡ Energy Consumed (kWh)</label>
                            <input type="number" style={inputStyle} placeholder="e.g. 8"
                                value={form.energyConsumed} onChange={e => update('energyConsumed', e.target.value)}
                                min="0" step="0.1"
                                onFocus={e => e.target.style.borderColor = '#a78bfa'}
                                onBlur={e => e.target.style.borderColor = '#e8f5e9'}
                            />
                        </div>

                        {/* Waste */}
                        <div>
                            <label style={labelStyle}>🗑️ Waste Generated (kg)</label>
                            <input type="number" style={inputStyle} placeholder="e.g. 1.5"
                                value={form.wasteGenerated} onChange={e => update('wasteGenerated', e.target.value)}
                                min="0" step="0.1"
                                onFocus={e => e.target.style.borderColor = '#a78bfa'}
                                onBlur={e => e.target.style.borderColor = '#e8f5e9'}
                            />
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="submit" disabled={animating} style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 600,
                                border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                                color: 'white', boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}>
                                {animating
                                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
                                    : <><Brain size={18} /> Estimate Footprint</>
                                }
                            </button>
                            {result && (
                                <button type="button" onClick={handleReset} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '14px 18px', borderRadius: '12px', fontSize: '14px', fontWeight: 500,
                                    border: '2px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#6b7280'
                                }}>
                                    <RotateCcw size={16} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* ── Results Panel ──────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {result ? (
                        <>
                            {/* Total CO₂ */}
                            <div style={{
                                ...card, padding: '24px',
                                background: `linear-gradient(135deg, ${result.rating.bg}, white)`,
                                border: `2px solid ${result.rating.color}30`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <h3 style={{ fontWeight: 700, color: '#1f2937', fontSize: '16px' }}>Total Estimated Emissions</h3>
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                        color: result.rating.color, background: result.rating.bg,
                                        border: `1px solid ${result.rating.color}40`
                                    }}>{result.rating.label}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{ fontSize: '48px', fontWeight: 800, color: result.rating.color, lineHeight: 1 }}>
                                        {result.totalCO2}
                                    </span>
                                    <span style={{ fontSize: '18px', fontWeight: 500, color: '#9ca3af' }}>kg CO₂</span>
                                </div>
                            </div>

                            {/* Category Breakdown */}
                            <div style={{ ...card, padding: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <BarChart3 size={18} color="#7c3aed" />
                                    <h3 style={{ fontWeight: 700, color: '#1f2937', fontSize: '15px' }}>Category Breakdown</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {result.breakdown.map(cat => {
                                        const Icon = CATEGORY_ICONS[cat.key] || Leaf
                                        const isHighest = cat.key === result.highestEmitter.key && cat.co2 > 0
                                        return (
                                            <div key={cat.key}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Icon size={16} color={cat.color} />
                                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{cat.label}</span>
                                                        {isHighest && (
                                                            <span style={{
                                                                fontSize: '10px', fontWeight: 600, color: '#dc2626',
                                                                background: '#fef2f2', padding: '2px 6px', borderRadius: '4px',
                                                                border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '3px'
                                                            }}>
                                                                <AlertTriangle size={9} /> Highest
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: '14px', fontWeight: 700, color: cat.color }}>
                                                        {cat.co2} kg ({cat.percent}%)
                                                    </span>
                                                </div>
                                                {/* Bar */}
                                                <div style={{ height: '10px', borderRadius: '5px', background: '#f3f4f6', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: '5px',
                                                        background: `linear-gradient(90deg, ${cat.color}, ${cat.color}99)`,
                                                        width: `${cat.percent}%`,
                                                        transition: 'width 0.8s ease-out',
                                                        minWidth: cat.co2 > 0 ? '4px' : '0'
                                                    }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Eco Tips */}
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
                                        <h3 style={{ fontWeight: 700, color: '#166534', fontSize: '15px' }}>Personalized Eco Tips</h3>
                                        <p style={{ fontSize: '11px', color: '#15803d' }}>AI-generated suggestions to reduce your footprint</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {result.tips.map((tip, i) => (
                                        <div key={i} style={{
                                            padding: '12px 14px', borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.7)', border: '1px solid #dcfce7',
                                            fontSize: '13px', color: '#374151', lineHeight: 1.5,
                                            display: 'flex', alignItems: 'flex-start', gap: '8px'
                                        }}>
                                            <TrendingDown size={14} color="#22c55e" style={{ flexShrink: 0, marginTop: '3px' }} />
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Placeholder */
                        <div style={{ ...card, padding: '48px 24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px',
                                background: 'linear-gradient(135deg, #ede9fe, #f3e8ff)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Brain size={36} color="#7c3aed" style={{ opacity: 0.7 }} />
                            </div>
                            <h3 style={{ fontWeight: 600, color: '#374151', marginBottom: '8px', fontSize: '18px' }}>
                                AI Carbon Analysis
                            </h3>
                            <p style={{ fontSize: '14px', color: '#9ca3af', maxWidth: '280px', lineHeight: 1.6 }}>
                                Enter your daily activity data and let our AI estimate your carbon footprint with personalized suggestions.
                            </p>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { icon: Car, label: 'Transport', color: '#4caf50' },
                                    { icon: Zap, label: 'Energy', color: '#3b82f6' },
                                    { icon: Trash2, label: 'Waste', color: '#f59e0b' },
                                ].map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '8px 14px', borderRadius: '10px',
                                        background: 'white', border: '1px solid #f3f4f6',
                                        fontSize: '12px', color: '#6b7280'
                                    }}>
                                        <item.icon size={14} color={item.color} />
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 1023px) {
                    .estimator-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .transport-grid { grid-template-columns: repeat(3, 1fr) !important; }
                }
            `}</style>
        </div>
    )
}
