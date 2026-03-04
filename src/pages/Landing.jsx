import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Leaf, ArrowRight, Footprints, Target, Star, Gift, Users, BarChart3, Recycle, TreePine } from 'lucide-react'

const STEPS = [
    { icon: Footprints, title: 'Track', desc: 'Log your daily transport, food & energy usage', color: 'from-eco-400 to-eco-600' },
    { icon: Target, title: 'Act', desc: 'Complete eco-challenges and swap goods', color: 'from-emerald-400 to-emerald-600' },
    { icon: Star, title: 'Earn', desc: 'Gain EcoPoints for every positive action', color: 'from-amber-400 to-amber-600' },
    { icon: Gift, title: 'Redeem', desc: 'Exchange points for real campus rewards', color: 'from-purple-400 to-purple-600' },
]

const FEATURES = [
    { icon: BarChart3, title: 'CO2 Dashboard', desc: 'Visualize your carbon footprint with interactive charts and track improvements over time.' },
    { icon: Recycle, title: 'GreenSwap', desc: 'Exchange books, stationery & upcycled items with fellow students. Reduce waste, save money.' },
    { icon: Users, title: 'Social Feed', desc: 'Share sustainability wins, inspire classmates, and build a greener campus community.' },
    { icon: TreePine, title: 'Challenges', desc: 'Daily & weekly eco-challenges with badges, streaks, and leaderboard rankings.' },
]

export default function Landing() {
    const { user } = useAuth()

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Navbar */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(200,230,201,0.4)',
                boxShadow: '0 2px 20px rgba(0,0,0,0.05)'
            }}>
                <div style={{
                    maxWidth: '1200px', margin: '0 auto', padding: '0 24px',
                    height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            background: 'linear-gradient(135deg, #66bb6a, #2e7d32)',
                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
                        }}>
                            <Leaf size={20} color="white" />
                        </div>
                        <span style={{
                            fontSize: '22px', fontWeight: 800, fontFamily: 'Poppins, sans-serif',
                            background: 'linear-gradient(to right, #388e3c, #2e7d32)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>
                            EcoVibe
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user ? (
                            <Link to="/dashboard" className="eco-btn" style={{ fontSize: '14px', padding: '10px 20px' }}>
                                Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" style={{
                                    fontSize: '14px', fontWeight: 600, color: '#388e3c',
                                    padding: '10px 16px', textDecoration: 'none',
                                    borderRadius: '10px', transition: 'background 0.2s'
                                }}>
                                    Login
                                </Link>
                                <Link to="/signup" className="eco-btn" style={{ fontSize: '14px', padding: '10px 20px' }}>
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                paddingTop: '140px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px',
                textAlign: 'center', position: 'relative', overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(232,245,233,0.5), transparent)',
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', top: '60px', left: '-40px',
                    width: '300px', height: '300px',
                    background: 'rgba(165,214,167,0.15)', borderRadius: '50%', filter: 'blur(60px)'
                }} />
                <div style={{
                    position: 'absolute', bottom: '20px', right: '-40px',
                    width: '350px', height: '350px',
                    background: 'rgba(167,243,208,0.15)', borderRadius: '50%', filter: 'blur(60px)'
                }} />

                <div style={{ position: 'relative', maxWidth: '720px', margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(200,230,201,0.5)', color: '#2e7d32',
                        fontSize: '14px', fontWeight: 600, padding: '8px 20px',
                        borderRadius: '100px', marginBottom: '28px'
                    }}>
                        🌍 Built for climate-conscious students
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 800,
                        fontFamily: 'Poppins, sans-serif', lineHeight: 1.1, marginBottom: '24px'
                    }}>
                        <span style={{
                            background: 'linear-gradient(to right, #388e3c, #10b981, #4caf50)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>
                            Track. Reduce.
                        </span>
                        <br />
                        <span style={{
                            background: 'linear-gradient(to right, #10b981, #4caf50, #1b5e20)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>
                            Earn. Sustain.
                        </span>
                    </h1>
                    <p style={{
                        fontSize: '18px', color: '#6b7280', maxWidth: '540px',
                        margin: '0 auto 40px', lineHeight: 1.7
                    }}>
                        Join your campus green revolution. Track your carbon footprint, earn rewards for sustainable choices, and trade pre-loved items.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <Link to="/signup" className="eco-btn" style={{
                            fontSize: '17px', padding: '16px 32px',
                            display: 'inline-flex', alignItems: 'center', gap: '8px'
                        }}>
                            Get Started <ArrowRight size={20} />
                        </Link>
                        <a href="#how-it-works" style={{
                            padding: '16px 32px', borderRadius: '12px',
                            border: '2px solid #c8e6c9', color: '#2e7d32',
                            fontWeight: 700, fontSize: '17px', textDecoration: 'none',
                            transition: 'background 0.2s'
                        }}>
                            How it Works
                        </a>
                    </div>
                </div>

                {/* Floating stats */}
                <div style={{
                    marginTop: '64px', display: 'flex', flexWrap: 'wrap',
                    justifyContent: 'center', gap: '20px', maxWidth: '600px', margin: '64px auto 0'
                }}>
                    {[
                        { val: '2,500+', label: 'Active Students' },
                        { val: '15 tons', label: 'CO2 Tracked' },
                        { val: '1,200+', label: 'Items Swapped' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px',
                            boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
                            padding: '16px 28px', textAlign: 'center', minWidth: '140px'
                        }}>
                            <p style={{ fontSize: '24px', fontWeight: 700, color: '#43a047' }}>{s.val}</p>
                            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.4)' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2 style={{
                        fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700,
                        fontFamily: 'Poppins, sans-serif', textAlign: 'center', marginBottom: '12px'
                    }}>
                        How It <span style={{ color: '#4caf50' }}>Works</span>
                    </h2>
                    <p style={{
                        color: '#9ca3af', textAlign: 'center', marginBottom: '56px',
                        maxWidth: '480px', margin: '0 auto 56px'
                    }}>
                        Four simple steps to make your campus life greener and more rewarding.
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: '24px'
                    }}>
                        {STEPS.map((step, i) => {
                            const Icon = step.icon
                            return (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.75)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
                                    padding: '32px 24px',
                                    textAlign: 'center',
                                    transition: 'transform 0.3s, box-shadow 0.3s',
                                    cursor: 'default'
                                }}>
                                    <div style={{
                                        width: '56px', height: '56px',
                                        margin: '0 auto 16px',
                                        borderRadius: '16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: i === 0 ? 'linear-gradient(135deg, #66bb6a, #2e7d32)' :
                                            i === 1 ? 'linear-gradient(135deg, #34d399, #059669)' :
                                                i === 2 ? 'linear-gradient(135deg, #fbbf24, #d97706)' :
                                                    'linear-gradient(135deg, #a78bfa, #7c3aed)',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
                                    }}>
                                        <Icon size={24} color="white" />
                                    </div>
                                    <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', color: '#1f2937' }}>
                                        {step.title}
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.5 }}>
                                        {step.desc}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '80px 24px' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2 style={{
                        fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 700,
                        fontFamily: 'Poppins, sans-serif', textAlign: 'center', marginBottom: '12px'
                    }}>
                        Powerful <span style={{ color: '#4caf50' }}>Features</span>
                    </h2>
                    <p style={{
                        color: '#9ca3af', textAlign: 'center',
                        maxWidth: '480px', margin: '0 auto 56px'
                    }}>
                        Everything you need to live sustainably on campus, all in one app.
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '24px'
                    }}>
                        {FEATURES.map((f, i) => {
                            const Icon = f.icon
                            return (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.75)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
                                    padding: '28px',
                                    display: 'flex',
                                    gap: '16px',
                                    alignItems: 'flex-start',
                                    transition: 'box-shadow 0.3s'
                                }}>
                                    <div style={{
                                        width: '48px', height: '48px', minWidth: '48px',
                                        background: '#e8f5e9',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Icon size={22} color="#43a047" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 700, fontSize: '18px', marginBottom: '6px', color: '#1f2937' }}>
                                            {f.title}
                                        </h3>
                                        <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: 1.6 }}>
                                            {f.desc}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '80px 24px' }}>
                <div style={{
                    maxWidth: '720px', margin: '0 auto', textAlign: 'center',
                    background: 'linear-gradient(135deg, #e8f5e9, #ecfdf5)',
                    border: '1px solid rgba(200,230,201,0.5)',
                    borderRadius: '20px', padding: '64px 40px',
                    boxShadow: '0 8px 40px rgba(76,175,80,0.08)'
                }}>
                    <h2 style={{
                        fontSize: '32px', fontWeight: 700,
                        fontFamily: 'Poppins, sans-serif', marginBottom: '16px', color: '#1f2937'
                    }}>
                        Ready to make a difference?
                    </h2>
                    <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '16px' }}>
                        Join thousands of students building a sustainable future, one action at a time.
                    </p>
                    <Link to="/signup" className="eco-btn" style={{
                        fontSize: '17px', padding: '16px 40px',
                        display: 'inline-flex', alignItems: 'center', gap: '8px'
                    }}>
                        Start Your Journey <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '32px 24px', borderTop: '1px solid #e8f5e9', textAlign: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Leaf size={18} color="#4caf50" />
                    <span style={{ fontWeight: 700, color: '#2e7d32' }}>EcoVibe</span>
                </div>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                    © 2026 EcoVibe. Built with 💚 for a greener campus.
                </p>
            </footer>
        </div>
    )
}
