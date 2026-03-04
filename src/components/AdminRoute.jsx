import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function AdminRoute({ children }) {
    const { isAdminAuth } = useAuth()

    if (!isAdminAuth) return <Navigate to="/login" replace />

    return children
}
