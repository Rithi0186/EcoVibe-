import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { localDb } from '../lib/localDb'
import {
    User, Award, Leaf, Calendar, BookOpen, Activity,
    TrendingDown, Flame, Star
} from 'lucide-react'

const card = {
    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.06)'
}

export default function Profile() {
    const { user, profile } = useAuth()
    const [stats, setStats] = useState({ totalLogs: 0, lifetimeCO2: 0, totalPosts: 0, badgeCount: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => { if (user) loadStats() }, [user])

    function loadStats() {
        try {
            const logs = localDb.query('co2_logs', l => l.user_id === user.id)
            const posts = localDb.query('posts', p => p.user_id === user.id)
            const badges = localDb.query('user_badges', b => b.user_id === user.id)
            setStats({
                totalLogs: logs.length,
                lifetimeCO2: logs.reduce((s, l) => s + Number(l.co2_kg || 0), 0),
                totalPosts: posts.length,
                badgeCount: badges.length,
            })
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    const statItems = [
        { icon: Star, color: '#f59e0b', val: profile?.eco_points || 0, label: 'EcoPoints' },
        { icon: Flame, color: '#f97316', val: profile?.streak || 0, label: 'Day Streak' },
        { icon: TrendingDown, color: '#4caf50', val: stats.lifetimeCO2.toFixed(1), label: 'Total CO2 (kg)' },
        { icon: Award, color: '#8b5cf6', val: stats.badgeCount, label: 'Badges' },
    ]

    const activityRows = [
        { icon: Leaf, color: '#4caf50', label: 'CO2 Entries Logged', val: stats.totalLogs },
        { icon: BookOpen, color: '#3b82f6', label: 'Feed Posts Created', val: stats.totalPosts },
        { icon: Calendar, color: '#8b5cf6', label: 'Member Since', val: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '—' },
    ]

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>My Profile</h1>

            {/* Profile Card */}
            <div style={{ ...card, padding: '24px', textAlign: 'center' }}>
                <div style={{
                    width: '80px', height: '80px', margin: '0 auto 16px',
                    background: 'linear-gradient(135deg, #66bb6a, #2e7d32)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(76,175,80,0.3)'
                }}>
                    <User size={36} color="white" />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>{profile?.name}</h2>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>{profile?.student_id}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <span style={{ padding: '4px 12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '100px', fontSize: '14px', fontWeight: 500 }}>
                        {profile?.department}
                    </span>
                    <span style={{ padding: '4px 12px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '100px', fontSize: '14px', fontWeight: 500 }}>
                        Year {profile?.year}
                    </span>
                    {profile?.role === 'admin' && (
                        <span style={{ padding: '4px 12px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '100px', fontSize: '14px', fontWeight: 500 }}>
                            Admin
                        </span>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {statItems.map((s, i) => (
                    <div key={i} style={{ ...card, padding: '16px', textAlign: 'center' }}>
                        <s.icon size={20} color={s.color} style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '20px', fontWeight: 700 }}>{s.val}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Activity Summary */}
            <div style={{ ...card, padding: '24px' }}>
                <h3 style={{ fontWeight: 600, color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} color="#4caf50" /> Activity Summary
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activityRows.map((row, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px', background: '#f9fafb', borderRadius: '12px'
                        }}>
                            <span style={{ fontSize: '14px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <row.icon size={14} color={row.color} /> {row.label}
                            </span>
                            <span style={{ fontWeight: 600 }}>{row.val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Eco Impact */}
            <div style={{
                ...card, padding: '24px',
                background: 'linear-gradient(135deg, #e8f5e9, #ecfdf5)'
            }}>
                <h3 style={{ fontWeight: 600, color: '#2e7d32', marginBottom: '12px' }}>🌍 Your Eco Impact</h3>
                <p style={{ fontSize: '14px', color: '#43a047', lineHeight: 1.7 }}>
                    You've logged <strong>{stats.totalLogs}</strong> activities, earned{' '}
                    <strong>{profile?.eco_points || 0} EcoPoints</strong>, and tracked{' '}
                    <strong>{stats.lifetimeCO2.toFixed(1)} kg</strong> of CO2. Keep going — every action makes a difference!
                </p>
            </div>
        </div>
    )
}
