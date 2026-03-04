import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 size={32} color="#4caf50" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</p>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    return children
}
