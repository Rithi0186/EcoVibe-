import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { localDb } from '../lib/localDb'
import { StatSkeleton } from '../components/LoadingSkeleton'
import Modal from '../components/Modal'
import {
    Trophy, Flame, Award, CheckCircle, Star, Lock, Loader2,
    Calendar, Zap, Target, Upload, Clock, Camera, X, Image
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'

const card = {
    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.06)'
}

export default function Challenges() {
    const { user, profile, updateProfile } = useAuth()
    const toast = useToast()
    const [challenges, setChallenges] = useState([])
    const [completions, setCompletions] = useState([])
    const [badges, setBadges] = useState([])
    const [userBadges, setUserBadges] = useState([])
    const [loading, setLoading] = useState(true)
    const [completing, setCompleting] = useState(null)

    // Proof upload modal state
    const [proofModal, setProofModal] = useState(null) // holds the challenge object
    const [proofFile, setProofFile] = useState(null)
    const [proofPreview, setProofPreview] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => { loadData() }, [])

    // Auto-refresh when tab becomes visible or page gains focus
    useEffect(() => {
        function handleRefresh() {
            if (document.visibilityState === 'visible') refreshCompletions()
        }
        document.addEventListener('visibilitychange', handleRefresh)
        window.addEventListener('focus', refreshCompletions)

        // Also poll every 15 seconds for live updates
        const interval = setInterval(refreshCompletions, 15000)

        return () => {
            document.removeEventListener('visibilitychange', handleRefresh)
            window.removeEventListener('focus', refreshCompletions)
            clearInterval(interval)
        }
    }, [])

    // Real-time subscription: auto-update when admin approves/rejects
    // No realtime subscription needed with localStorage

    function refreshCompletions() {
        try {
            const data = localDb.query('challenge_completions', c => c.user_id === user.id)
            setCompletions(data)
        } catch (err) { console.error(err) }
    }

    function loadData() {
        try {
            const chs = localDb.query('challenges', c => c.active)
            const comps = localDb.query('challenge_completions', c => c.user_id === user.id)
            const bgs = localDb.getAll('badges')
            const ubs = localDb.query('user_badges', ub => ub.user_id === user.id)
                .map(ub => ({ ...ub, badges: localDb.getById('badges', ub.badge_id) }))
            setChallenges(chs)
            setCompletions(comps)
            setBadges(bgs)
            setUserBadges(ubs)

            checkAndAwardBadges(bgs, ubs, comps)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    function checkAndAwardBadges(allBadges, earnedBadges, userCompletions) {
        const earnedIds = new Set(earnedBadges.map(ub => ub.badge_id))
        const approvedCompletions = userCompletions.filter(c => c.status === 'approved' || !c.status)

        for (const badge of allBadges) {
            if (earnedIds.has(badge.id)) continue

            let met = false
            switch (badge.requirement) {
                case 'first_log':
                    met = localDb.count('co2_logs', l => l.user_id === user.id) >= 1
                    break
                case '10_challenges':
                    met = approvedCompletions.length >= 10
                    break
                case 'first_swap':
                    met = localDb.count('swap_requests', r => r.buyer_id === user.id && r.status === 'accepted') >= 1
                    break
                case '5_posts':
                    met = localDb.count('posts', p => p.user_id === user.id) >= 5
                    break
                case '500_points':
                    met = (profile?.eco_points || 0) >= 500
                    break
                case '7_streak':
                    met = (profile?.streak || 0) >= 7
                    break
                case 'tree_reward':
                    met = localDb.count('redemptions', r => r.user_id === user.id) >= 1
                    break
            }

            if (met) {
                localDb.insertIfNotExists('user_badges', { user_id: user.id, badge_id: badge.id },
                    ub => ub.user_id === user.id && ub.badge_id === badge.id)
                toast.success(`🏆 Badge Unlocked: ${badge.name}!`)
                const ubs = localDb.query('user_badges', ub => ub.user_id === user.id)
                    .map(ub => ({ ...ub, badges: localDb.getById('badges', ub.badge_id) }))
                setUserBadges(ubs)
            }
        }
    }

    function getCompletionStatus(challengeId) {
        const today = new Date().toISOString().split('T')[0]
        const completion = completions.find(c =>
            c.challenge_id === challengeId && c.completed_at?.split('T')[0] === today
        )
        if (!completion) return null
        return completion.status || 'approved' // fallback for old records without status
    }

    function isCompletedToday(challengeId) {
        const today = new Date().toISOString().split('T')[0]
        return completions.some(c => c.challenge_id === challengeId && c.completed_at?.split('T')[0] === today)
    }

    function isCompletedThisWeek(challengeId) {
        const weekStart = new Date(Date.now() - 7 * 86400000)
        return completions.some(c => c.challenge_id === challengeId && new Date(c.completed_at) >= weekStart)
    }

    function getWeeklyStatus(challengeId) {
        const weekStart = new Date(Date.now() - 7 * 86400000)
        const completion = completions.find(c =>
            c.challenge_id === challengeId && new Date(c.completed_at) >= weekStart
        )
        if (!completion) return null
        return completion.status || 'approved'
    }

    function openProofModal(challenge) {
        const isDaily = challenge.frequency === 'daily'
        if (isDaily && isCompletedToday(challenge.id)) { toast.info('Already submitted today!'); return }
        if (!isDaily && isCompletedThisWeek(challenge.id)) { toast.info('Already submitted this week!'); return }
        setProofModal(challenge)
        setProofFile(null)
        setProofPreview(null)
    }

    function handleFileSelect(e) {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            toast.warning('Please upload an image file')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.warning('Image must be under 5MB')
            return
        }
        setProofFile(file)
        const reader = new FileReader()
        reader.onload = (ev) => setProofPreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    function submitProof() {
        if (!proofFile || !proofModal) {
            toast.warning('Please upload a photo as proof')
            return
        }
        setSubmitting(true)
        try {
            // Convert proof image to base64
            const reader = new FileReader()
            reader.onload = (ev) => {
                const proofUrl = ev.target.result
                localDb.insert('challenge_completions', {
                    challenge_id: proofModal.id,
                    user_id: user.id,
                    proof_url: proofUrl,
                    status: 'pending',
                    completed_at: new Date().toISOString(),
                })
                toast.success('Proof submitted! ⏳ Waiting for admin approval to earn points.')
                setProofModal(null)
                setProofFile(null)
                setProofPreview(null)
                loadData()
                setSubmitting(false)
            }
            reader.readAsDataURL(proofFile)
        } catch (err) { toast.error(err.message || 'Failed to submit'); setSubmitting(false) }
    }

    function getIcon(iconName) {
        const name = iconName?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
        return LucideIcons[name] || Star
    }

    if (loading) {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                {Array(6).fill(0).map((_, i) => <StatSkeleton key={i} />)}
            </div>
        )
    }

    const dailyChallenges = challenges.filter(c => c.frequency === 'daily')
    const weeklyChallenges = challenges.filter(c => c.frequency === 'weekly')

    const approvedCount = completions.filter(c => c.status === 'approved' || !c.status).length
    const pendingCount = completions.filter(c => c.status === 'pending').length

    const statCards = [
        { icon: Trophy, color: '#f59e0b', val: approvedCount, label: 'Approved' },
        { icon: Clock, color: '#f97316', val: pendingCount, label: 'Pending' },
        { icon: Flame, color: '#ef4444', val: profile?.streak || 0, label: 'Day Streak' },
        { icon: Award, color: '#8b5cf6', val: userBadges.length, label: 'Badges' },
    ]

    function renderStatusBadge(status) {
        if (status === 'pending') {
            return (
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 600, color: '#d97706',
                    background: '#fffbeb', padding: '3px 8px', borderRadius: '6px',
                    border: '1px solid #fde68a'
                }}>
                    <Clock size={10} /> Pending
                </span>
            )
        }
        if (status === 'rejected') {
            return (
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 600, color: '#dc2626',
                    background: '#fef2f2', padding: '3px 8px', borderRadius: '6px',
                    border: '1px solid #fecaca'
                }}>
                    <X size={10} /> Rejected
                </span>
            )
        }
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', fontWeight: 600, color: '#16a34a',
                background: '#f0fdf4', padding: '3px 8px', borderRadius: '6px',
                border: '1px solid #bbf7d0'
            }}>
                <CheckCircle size={10} /> Done
            </span>
        )
    }

    function renderChallenge(ch, isDaily) {
        const status = isDaily ? getCompletionStatus(ch.id) : getWeeklyStatus(ch.id)
        const submitted = !!status
        const Icon = getIcon(ch.icon)
        const accent = isDaily
            ? { bg: '#e8f5e9', border: '#a5d6a7', text: '#43a047', gradFrom: '#66bb6a', gradTo: '#2e7d32', btnBg: '#4caf50' }
            : { bg: '#f3e8ff', border: '#c4b5fd', text: '#7c3aed', gradFrom: '#a78bfa', gradTo: '#7c3aed', btnBg: '#8b5cf6' }

        return (
            <div key={ch.id} style={{
                ...card, padding: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                background: submitted ? `${accent.bg}80` : card.background,
                borderColor: submitted ? accent.border : undefined
            }}>
                <div style={{
                    width: '44px', height: '44px', minWidth: '44px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: submitted ? accent.bg : `linear-gradient(135deg, ${accent.gradFrom}, ${accent.gradTo})`,
                    color: submitted ? accent.text : 'white'
                }}>
                    {status === 'approved' ? <CheckCircle size={20} /> : submitted ? <Clock size={20} /> : <Icon size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>{ch.title}</h3>
                    <p style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.description}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: accent.text, marginBottom: '4px' }}>+{ch.points} pts</p>
                    {submitted ? (
                        renderStatusBadge(status)
                    ) : (
                        <button onClick={() => openProofModal(ch)} disabled={completing === ch.id} style={{
                            padding: '6px 14px', background: accent.btnBg, color: 'white',
                            borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                            <Camera size={12} /> Complete
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h1 style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>Challenges</h1>
                <p style={{ color: '#9ca3af', marginTop: '4px' }}>Complete eco-challenges, upload proof, and earn rewards</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }} className="stats-grid">
                {statCards.map((s, i) => (
                    <div key={i} style={{ ...card, padding: '16px', textAlign: 'center' }}>
                        <s.icon size={22} color={s.color} style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '20px', fontWeight: 700 }}>{s.val}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Info Banner */}
            <div style={{
                ...card, padding: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                border: '1px solid #fde68a'
            }}>
                <Camera size={20} color="#d97706" />
                <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#92400e' }}>Proof Required</p>
                    <p style={{ fontSize: '12px', color: '#b45309' }}>Upload a photo when completing challenges. Points are awarded after admin approval.</p>
                </div>
            </div>

            {/* Daily */}
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Calendar size={18} color="#4caf50" /> Daily Challenges
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dailyChallenges.map(ch => renderChallenge(ch, true))}
                </div>
            </div>

            {/* Weekly */}
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Target size={18} color="#8b5cf6" /> Weekly Challenges
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {weeklyChallenges.map(ch => renderChallenge(ch, false))}
                </div>
            </div>

            {/* Badges */}
            <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Award size={18} color="#f59e0b" /> Badges
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                    {badges.map(badge => {
                        const earned = userBadges.some(ub => ub.badge_id === badge.id)
                        return (
                            <div key={badge.id} style={{
                                ...card, padding: '16px', textAlign: 'center', opacity: earned ? 1 : 0.5,
                                borderColor: earned ? '#fcd34d' : undefined
                            }}>
                                <div style={{
                                    width: '56px', height: '56px', margin: '0 auto 8px',
                                    borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: earned ? 'linear-gradient(135deg, #fbbf24, #d97706)' : '#f3f4f6',
                                    boxShadow: earned ? '0 4px 12px rgba(251,191,36,0.4)' : 'none'
                                }}>
                                    {earned ? <Award size={24} color="white" /> : <Lock size={20} color="#9ca3af" />}
                                </div>
                                <p style={{ fontSize: '14px', fontWeight: 600 }}>{badge.name}</p>
                                <p style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>{badge.description}</p>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Proof Upload Modal */}
            <Modal isOpen={!!proofModal} onClose={() => { setProofModal(null); setProofFile(null); setProofPreview(null) }} title="Upload Proof" size="sm">
                {proofModal && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Challenge info */}
                        <div style={{
                            padding: '16px', background: '#f0fdf4', borderRadius: '12px',
                            border: '1px solid #bbf7d0'
                        }}>
                            <h3 style={{ fontWeight: 600, fontSize: '16px', color: '#166534' }}>{proofModal.title}</h3>
                            <p style={{ fontSize: '13px', color: '#15803d', marginTop: '4px' }}>{proofModal.description}</p>
                            <p style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a', marginTop: '8px' }}>+{proofModal.points} EcoPoints</p>
                        </div>

                        {/* Upload area */}
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>📸 Upload photo proof</p>
                            {proofPreview ? (
                                <div style={{ position: 'relative' }}>
                                    <img src={proofPreview} alt="Proof" style={{
                                        width: '100%', height: '200px', objectFit: 'cover',
                                        borderRadius: '12px', border: '2px solid #a5d6a7'
                                    }} />
                                    <button onClick={() => { setProofFile(null); setProofPreview(null) }} style={{
                                        position: 'absolute', top: '8px', right: '8px',
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.6)', color: 'white',
                                        border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <X size={14} />
                                    </button>
                                    <p style={{ fontSize: '12px', color: '#4caf50', marginTop: '8px', fontWeight: 500 }}>
                                        ✅ {proofFile.name}
                                    </p>
                                </div>
                            ) : (
                                <label style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    gap: '12px', padding: '32px', borderRadius: '12px',
                                    border: '2px dashed #a5d6a7', background: '#f0fdf4',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #66bb6a, #2e7d32)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
                                    }}>
                                        <Camera size={24} color="white" />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#2e7d32' }}>Click to upload photo</p>
                                        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>JPG, PNG up to 5MB</p>
                                    </div>
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
                                </label>
                            )}
                        </div>

                        {/* Info note */}
                        <div style={{
                            padding: '12px', background: '#fffbeb', borderRadius: '10px',
                            border: '1px solid #fde68a', display: 'flex', gap: '8px', alignItems: 'flex-start'
                        }}>
                            <Clock size={14} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ fontSize: '12px', color: '#92400e', lineHeight: 1.5 }}>
                                After submitting, your proof will be reviewed by an admin. EcoPoints will be awarded once approved.
                            </p>
                        </div>

                        {/* Submit button */}
                        <button onClick={submitProof} disabled={submitting || !proofFile} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: 600,
                            border: 'none', width: '100%',
                            cursor: proofFile ? 'pointer' : 'not-allowed',
                            background: proofFile ? 'linear-gradient(135deg, #4caf50, #2e7d32)' : '#e5e7eb',
                            color: proofFile ? 'white' : '#9ca3af',
                            boxShadow: proofFile ? '0 4px 12px rgba(76,175,80,0.3)' : 'none'
                        }}>
                            {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} />}
                            {submitting ? 'Submitting...' : 'Submit Proof'}
                        </button>
                    </div>
                )}
            </Modal>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 640px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
            `}</style>
        </div>
    )
}
