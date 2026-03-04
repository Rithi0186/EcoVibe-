import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { Shield, LogIn, Loader2, Eye, EyeOff, Lock } from 'lucide-react'

export default function AdminLogin() {
    const [studentId, setStudentId] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        if (!studentId.trim() || !password) {
            toast.warning('Please fill in all fields')
            return
        }
        setLoading(true)
        try {
            await signIn({ studentId: studentId.trim(), password })
            // After sign-in, AuthContext fetches profile — check role on next render
            toast.success('Admin access granted 🔐')
            navigate('/admin/dashboard')
        } catch (err) {
            toast.error(err.message || 'Login failed.')
        } finally {
            setLoading(false)
        }
    }

    const inputBox = {
        width: '100%', padding: '14px 18px',
        border: '2px solid #e2e8f0', borderRadius: '14px',
        fontSize: '15px', fontFamily: 'Inter, sans-serif',
        outline: 'none', transition: 'all 0.3s', background: 'white',
        boxSizing: 'border-box'
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            padding: '24px'
        }}>
            {/* Background decorations */}
            <div style={{
                position: 'fixed', top: '-200px', right: '-200px',
                width: '500px', height: '500px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)'
            }} />
            <div style={{
                position: 'fixed', bottom: '-150px', left: '-150px',
                width: '400px', height: '400px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)'
            }} />

            <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{
                        width: '64px', height: '64px', margin: '0 auto 20px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(99,102,241,0.4)'
                    }}>
                        <Shield size={32} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '28px', fontWeight: 700, fontFamily: 'Poppins, sans-serif',
                        color: 'white', marginBottom: '8px'
                    }}>Admin Panel</h1>
                    <p style={{ color: '#94a3b8', fontSize: '15px' }}>Sign in with your admin credentials</p>
                </div>

                {/* Form Card */}
                <div style={{
                    background: 'rgba(30,41,59,0.8)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(148,163,184,0.15)',
                    borderRadius: '20px', padding: '40px 36px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
                }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '22px' }}>
                            <label style={{
                                display: 'block', fontSize: '13px', fontWeight: 600,
                                color: '#cbd5e1', marginBottom: '8px'
                            }}>Admin ID</label>
                            <input
                                type="text"
                                placeholder="Enter admin ID"
                                value={studentId}
                                onChange={e => setStudentId(e.target.value)}
                                style={{ ...inputBox, background: '#0f172a', color: 'white', borderColor: '#334155' }}
                                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                                onBlur={e => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none' }}
                            />
                        </div>

                        <div style={{ marginBottom: '28px' }}>
                            <label style={{
                                display: 'block', fontSize: '13px', fontWeight: 600,
                                color: '#cbd5e1', marginBottom: '8px'
                            }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={{ ...inputBox, background: '#0f172a', color: 'white', borderColor: '#334155', paddingRight: '48px' }}
                                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)' }}
                                    onBlur={e => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none' }}
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                                    display: 'flex', alignItems: 'center', padding: '4px'
                                }}>
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            fontSize: '15px', fontWeight: 700, borderRadius: '14px', border: 'none', cursor: 'pointer',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white', boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                            opacity: loading ? 0.7 : 1
                        }}>
                            {loading ? <Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn size={19} />}
                            {loading ? 'Signing in...' : 'Sign In as Admin'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(148,163,184,0.1)' }}>
                        <Link to="/login" style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'none' }}>
                            ← Back to Student Login
                        </Link>
                    </div>
                </div>
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
