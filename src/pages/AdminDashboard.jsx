import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { localDb } from '../lib/localDb'
import {
    Shield, CheckCircle, XCircle, Trash2, Eye, Users, Activity,
    MessageSquare, Image, Clock, LogOut, Loader2,
    Award, BarChart3, Leaf
} from 'lucide-react'

const card = {
    background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.06)'
}

export default function AdminDashboard() {
    const { adminLogout } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('proofs')
    const [loading, setLoading] = useState(true)

    // Proofs state
    const [allProofs, setAllProofs] = useState([])
    const [proofFilter, setProofFilter] = useState('pending')
    const [actionLoading, setActionLoading] = useState(null)

    // Feed state
    const [posts, setPosts] = useState([])
    const [deletingPost, setDeletingPost] = useState(null)

    // Activity state
    const [users, setUsers] = useState([])
    const [stats, setStats] = useState({})
    const [recentActivity, setRecentActivity] = useState([])

    useEffect(() => {
        if (activeTab === 'proofs') loadProofs()
        else if (activeTab === 'feed') loadPosts()
        else if (activeTab === 'activity') loadActivity()
    }, [activeTab, proofFilter])

    // ──── PROOFS ────
    function loadProofs() {
        setLoading(true)
        try {
            let data = localDb.getAll('challenge_completions')
            if (proofFilter !== 'all') data = data.filter(p => p.status === proofFilter)
            data = data.sort((a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at))
            // Enrich with profiles and challenges
            data = data.map(p => ({
                ...p,
                profiles: localDb.getById('profiles', p.user_id),
                challenges: localDb.getById('challenges', p.challenge_id),
            }))
            setAllProofs(data)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    function handleProofAction(completion, action) {
        setActionLoading(completion.id)
        try {
            localDb.update('challenge_completions', completion.id, { status: action })

            if (action === 'approved' && completion.challenges?.points) {
                const userProfile = localDb.getById('profiles', completion.user_id)
                if (userProfile) {
                    localDb.update('profiles', completion.user_id, {
                        eco_points: (userProfile.eco_points || 0) + completion.challenges.points
                    })
                }
                toast.success(`Approved! +${completion.challenges.points} points awarded to ${completion.profiles?.name}`)
            } else if (action === 'rejected') {
                toast.info(`Proof rejected for ${completion.profiles?.name}`)
            }
            setAllProofs(prev => prev.filter(p => p.id !== completion.id))
        } catch (err) { toast.error(err.message) }
        finally { setActionLoading(null) }
    }

    // ──── FEED ────
    function loadPosts() {
        setLoading(true)
        try {
            let data = localDb.getAll('posts')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 50)
            data = data.map(p => ({
                ...p,
                profiles: localDb.getById('profiles', p.user_id),
                post_likes: localDb.query('post_likes', l => l.post_id === p.id),
                post_comments: localDb.query('post_comments', c => c.post_id === p.id),
            }))
            setPosts(data)
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    function deletePost(post) {
        if (!confirm(`Delete post by ${post.profiles?.name}?\n"${post.content?.slice(0, 80)}..."`)) return
        setDeletingPost(post.id)
        try {
            localDb.removeWhere('post_likes', l => l.post_id === post.id)
            localDb.removeWhere('post_comments', c => c.post_id === post.id)
            localDb.remove('posts', post.id)
            toast.success('Post deleted')
            setPosts(prev => prev.filter(p => p.id !== post.id))
        } catch (err) { toast.error(err.message) }
        finally { setDeletingPost(null) }
    }

    // ──── ACTIVITY ────
    function loadActivity() {
        setLoading(true)
        try {
            const allUsers = localDb.getAll('profiles')
                .sort((a, b) => (b.eco_points || 0) - (a.eco_points || 0))
            const comps = localDb.getAll('challenge_completions')
                .sort((a, b) => new Date(b.completed_at || b.created_at) - new Date(a.completed_at || a.created_at))
                .slice(0, 20)
                .map(c => ({ ...c, profiles: localDb.getById('profiles', c.user_id) }))
            setUsers(allUsers)
            setRecentActivity(comps)
            setStats({
                totalUsers: allUsers.length,
                totalPosts: localDb.getAll('posts').length,
                totalCO2Logs: localDb.getAll('co2_logs').length,
                totalPoints: allUsers.reduce((s, u) => s + (u.eco_points || 0), 0),
            })
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    function handleLogout() {
        adminLogout()
        navigate('/login')
    }

    const TABS = [
        { key: 'proofs', icon: CheckCircle, label: 'Proof Approvals' },
        { key: 'feed', icon: MessageSquare, label: 'Feed Moderation' },
        { key: 'activity', icon: Activity, label: 'Activity Monitor' },
    ]

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
            color: '#1f2937'
        }}>
            {/* Top Bar */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(200,230,201,0.4)',
                padding: '0 24px', height: '64px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px',
                        background: 'linear-gradient(135deg, #66bb6a, #2e7d32)',
                        borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Leaf size={20} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: '#1b5e20' }}>EcoVibe Admin</h1>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>Admin Portal</p>
                    </div>
                </div>
                <button onClick={handleLogout} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                    background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: '10px',
                    border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer', fontSize: '13px', fontWeight: 500
                }}>
                    <LogOut size={14} /> Logout
                </button>
            </header>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                            border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                            background: activeTab === t.key ? 'linear-gradient(135deg, #66bb6a, #2e7d32)' : 'rgba(255,255,255,0.7)',
                            color: activeTab === t.key ? 'white' : '#6b7280',
                            boxShadow: activeTab === t.key ? '0 4px 12px rgba(76,175,80,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* ═══════ PROOFS TAB ═══════ */}
                {activeTab === 'proofs' && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: '#1b5e20' }}>Challenge Proof Approvals</h2>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {['pending', 'approved', 'rejected', 'all'].map(f => (
                                    <button key={f} onClick={() => setProofFilter(f)} style={{
                                        padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                                        textTransform: 'capitalize', border: 'none', cursor: 'pointer',
                                        background: proofFilter === f ? '#4caf50' : 'rgba(255,255,255,0.7)',
                                        color: proofFilter === f ? 'white' : '#6b7280'
                                    }}>{f}</button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                <Loader2 size={28} color="#4caf50" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                            </div>
                        ) : allProofs.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {allProofs.map(proof => (
                                    <div key={proof.id} style={{
                                        ...card, padding: '20px',
                                        display: 'flex', gap: '16px', alignItems: 'flex-start',
                                        flexWrap: 'wrap'
                                    }}>
                                        {proof.proof_url ? (
                                            <img src={proof.proof_url} alt="Proof" style={{
                                                width: '120px', height: '120px', objectFit: 'cover',
                                                borderRadius: '12px', border: '2px solid #e8f5e9', flexShrink: 0
                                            }} />
                                        ) : (
                                            <div style={{
                                                width: '120px', height: '120px', borderRadius: '12px',
                                                background: '#e8f5e9', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <Image size={24} color="#81c784" />
                                            </div>
                                        )}

                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                <h3 style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>{proof.challenges?.title || 'Challenge'}</h3>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                    background: proof.status === 'pending' ? '#fff3cd' : proof.status === 'approved' ? '#d4edda' : '#f8d7da',
                                                    color: proof.status === 'pending' ? '#856404' : proof.status === 'approved' ? '#155724' : '#721c24',
                                                }}>{proof.status}</span>
                                            </div>
                                            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                                                <strong style={{ color: '#374151' }}>{proof.profiles?.name}</strong> · {proof.profiles?.student_id}
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={10} /> {new Date(proof.completed_at).toLocaleString()}
                                            </p>
                                            <p style={{ fontSize: '13px', color: '#2e7d32', fontWeight: 600, marginTop: '6px' }}>
                                                +{proof.challenges?.points || 0} EcoPoints
                                            </p>
                                        </div>

                                        {proof.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignSelf: 'center' }}>
                                                <button onClick={() => handleProofAction(proof, 'approved')} disabled={actionLoading === proof.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                                                    border: 'none', cursor: 'pointer',
                                                    background: 'linear-gradient(135deg, #66bb6a, #2e7d32)',
                                                    color: 'white', boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
                                                }}>
                                                    {actionLoading === proof.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
                                                    Approve
                                                </button>
                                                <button onClick={() => handleProofAction(proof, 'rejected')} disabled={actionLoading === proof.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                                                    border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                                                    background: 'rgba(239,68,68,0.06)', color: '#ef4444'
                                                }}>
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ ...card, padding: '60px', textAlign: 'center' }}>
                                <CheckCircle size={36} color="#81c784" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                <p style={{ color: '#9ca3af' }}>No {proofFilter} proofs found</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════ FEED TAB ═══════ */}
                {activeTab === 'feed' && (
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: '#1b5e20', marginBottom: '16px' }}>Feed Moderation</h2>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                <Loader2 size={28} color="#4caf50" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                            </div>
                        ) : posts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {posts.map(post => (
                                    <div key={post.id} style={{
                                        ...card, padding: '16px',
                                        display: 'flex', gap: '16px', alignItems: 'flex-start'
                                    }}>
                                        <div style={{
                                            width: '40px', height: '40px', minWidth: '40px',
                                            background: 'linear-gradient(135deg, #81c784, #4caf50)',
                                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: '14px', fontWeight: 700
                                        }}>
                                            {post.profiles?.name?.charAt(0) || '?'}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 600, fontSize: '14px', color: '#1f2937' }}>{post.profiles?.name}</span>
                                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>{post.profiles?.student_id}</span>
                                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                    {new Date(post.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p style={{ color: '#374151', fontSize: '14px', lineHeight: 1.5, marginBottom: '8px' }}>{post.content}</p>
                                            {post.image_url && (
                                                <img src={post.image_url} alt="" style={{
                                                    maxWidth: '200px', height: '100px', objectFit: 'cover',
                                                    borderRadius: '8px', marginBottom: '8px'
                                                }} />
                                            )}
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9ca3af' }}>
                                                <span>❤️ {post.post_likes?.length || 0}</span>
                                                <span>💬 {post.post_comments?.length || 0}</span>
                                            </div>
                                        </div>

                                        <button onClick={() => deletePost(post)} disabled={deletingPost === post.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                                            border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer',
                                            background: 'rgba(239,68,68,0.06)', color: '#ef4444', flexShrink: 0
                                        }}>
                                            {deletingPost === post.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ ...card, padding: '60px', textAlign: 'center' }}>
                                <MessageSquare size={36} color="#81c784" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                <p style={{ color: '#9ca3af' }}>No posts to moderate</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════ ACTIVITY TAB ═══════ */}
                {activeTab === 'activity' && (
                    <div>
                        <h2 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: '#1b5e20', marginBottom: '16px' }}>Activity Monitor</h2>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                <Loader2 size={28} color="#4caf50" style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                            </div>
                        ) : (
                            <>
                                {/* Stats Overview */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }} className="admin-stats-grid">
                                    {[
                                        { icon: Users, color: '#2e7d32', bg: '#e8f5e9', val: stats.totalUsers, label: 'Total Users' },
                                        { icon: MessageSquare, color: '#1565c0', bg: '#e3f2fd', val: stats.totalPosts, label: 'Total Posts' },
                                        { icon: BarChart3, color: '#e65100', bg: '#fff3e0', val: stats.totalCO2Logs, label: 'CO2 Entries' },
                                        { icon: Award, color: '#6a1b9a', bg: '#f3e5f5', val: stats.totalPoints, label: 'Total Points' },
                                    ].map((s, i) => (
                                        <div key={i} style={{ ...card, padding: '20px', textAlign: 'center' }}>
                                            <div style={{
                                                width: '44px', height: '44px', margin: '0 auto 10px',
                                                background: s.bg, borderRadius: '12px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <s.icon size={22} color={s.color} />
                                            </div>
                                            <p style={{ fontSize: '26px', fontWeight: 700, color: '#1f2937' }}>{s.val}</p>
                                            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="admin-grid">
                                    {/* User Leaderboard */}
                                    <div style={{ ...card, padding: '20px' }}>
                                        <h3 style={{ fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1b5e20' }}>
                                            <Users size={16} color="#2e7d32" /> User Leaderboard
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
                                            {users.slice(0, 20).map((u, i) => (
                                                <div key={u.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '12px',
                                                    padding: '10px', borderRadius: '10px',
                                                    background: i < 3 ? '#f0fdf4' : 'transparent'
                                                }}>
                                                    <span style={{
                                                        width: '24px', fontSize: '13px', fontWeight: 700, textAlign: 'center',
                                                        color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#9ca3af'
                                                    }}>#{i + 1}</span>
                                                    <div style={{
                                                        width: '32px', height: '32px',
                                                        background: `linear-gradient(135deg, hsl(${120 + i * 15}, 50%, 50%), hsl(${120 + i * 15}, 50%, 35%))`,
                                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'white', fontSize: '11px', fontWeight: 700
                                                    }}>{u.name?.charAt(0)}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>{u.name}</p>
                                                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>{u.student_id} · {u.department}</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#2e7d32' }}>{u.eco_points}</p>
                                                        <p style={{ fontSize: '10px', color: '#9ca3af' }}>points</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div style={{ ...card, padding: '20px' }}>
                                        <h3 style={{ fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1b5e20' }}>
                                            <Activity size={16} color="#2e7d32" /> Recent Challenge Activity
                                        </h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                                            {recentActivity.map(a => (
                                                <div key={a.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '12px',
                                                    padding: '10px', borderRadius: '10px', background: '#f9fafb'
                                                }}>
                                                    <div style={{
                                                        width: '8px', height: '8px', borderRadius: '50%',
                                                        background: a.status === 'pending' ? '#f59e0b' : a.status === 'approved' ? '#22c55e' : '#ef4444',
                                                        flexShrink: 0
                                                    }} />
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '13px', color: '#374151' }}>
                                                            <strong>{a.profiles?.name || 'User'}</strong>
                                                            <span style={{ color: '#9ca3af' }}> submitted proof</span>
                                                        </p>
                                                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                            {new Date(a.completed_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            {' · '}<span style={{
                                                                textTransform: 'capitalize', fontWeight: 600,
                                                                color: a.status === 'pending' ? '#f59e0b' : a.status === 'approved' ? '#22c55e' : '#ef4444'
                                                            }}>{a.status}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {recentActivity.length === 0 && (
                                                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '24px', fontSize: '14px' }}>No recent activity</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 768px) {
                    .admin-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .admin-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    )
}
